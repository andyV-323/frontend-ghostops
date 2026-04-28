import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { resolveRestrictions, RESTRICTION_LABELS } from "@/utils/Restrictions";
import { SOURCE, STATUS } from "@/config";

/* ─────────────────────────────────────────────────────────
   AO INTEL MAP
   Province-level intelligence display for AO Briefing.
   - Military satellite imagery aesthetic (same as tactical map)
   - MGRS-style alphanumeric grid overlay
   - Asset restriction badges HUD (top-right)
   - Terrain feature overlays: coast zones, airfield marker
   - SAM / AAA zone when aviation denied by threat
   - Classification header + scanlines overlay
   - Compass rose
   No objectives, no infil/exfil, no location markers.
───────────────────────────────────────────────────────── */

const COLS = 8;
const ROWS = 6;
const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* ── Inject global styles once ── */
const injectStyles = () => {
	if (document.getElementById("ao-intel-map-style")) return;
	const style = document.createElement("style");
	style.id = "ao-intel-map-style";
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

		.ao-map-grid-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 9px; color: rgba(143,184,64,0.4);
			letter-spacing: 0.08em; pointer-events: none; white-space: nowrap;
		}
		.ao-sam-label {
			font-family: 'Share Tech Mono', monospace; font-size: 8px;
			letter-spacing: 0.15em; color: rgba(255,68,68,0.75);
			text-shadow: 0 0 8px rgba(255,50,50,0.6);
			white-space: nowrap; pointer-events: none;
		}
		.ao-coast-label {
			font-family: 'Share Tech Mono', monospace; font-size: 7px;
			letter-spacing: 0.18em; color: rgba(100,200,255,0.7);
			text-shadow: 0 0 6px rgba(100,200,255,0.4);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.ao-airfield-label {
			font-family: 'Share Tech Mono', monospace; font-size: 8px;
			letter-spacing: 0.15em; color: rgba(255,200,80,0.8);
			text-shadow: 0 0 8px rgba(255,180,40,0.5);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.leaflet-control-zoom {
			border: 1px solid rgba(74,90,40,0.35) !important;
			border-radius: 2px !important; box-shadow: none !important;
		}
		.leaflet-control-zoom a {
			background: rgba(8,10,6,0.92) !important; color: #7a9060 !important;
			border-bottom: 1px solid rgba(74,90,40,0.25) !important;
			font-family: 'Share Tech Mono', monospace !important; font-size: 14px !important;
			width: 26px !important; height: 26px !important; line-height: 26px !important;
		}
		.leaflet-control-zoom a:hover { background: rgba(60,75,40,0.4) !important; color: #c1ff72 !important; }
	`;
	document.head.appendChild(style);
};

/* ── MGRS grid ref from map coordinates ── */
const toGridRef = (coords, bounds) => {
	if (!coords || !bounds) return "??-??";
	const [[minY, minX], [maxY, maxX]] = bounds;
	const colIdx = Math.min(
		Math.floor(((coords[1] - minX) / (maxX - minX)) * COLS),
		COLS - 1,
	);
	const rowIdx = Math.min(
		Math.floor(((maxY - coords[0]) / (maxY - minY)) * ROWS),
		ROWS - 1,
	);
	return `${COL_LETTERS[colIdx] || "?"}${rowIdx + 1}`;
};

/* ── Draw MGRS-style grid lines + labels ── */
const addGrid = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	const cellW = (maxX - minX) / COLS;
	const cellH = (maxY - minY) / ROWS;

	const lineStyle = {
		color: "rgba(143,184,64,0.12)",
		weight: 0.5,
		interactive: false,
	};

	for (let c = 1; c < COLS; c++) {
		const x = minX + c * cellW;
		L.polyline(
			[
				[minY, x],
				[maxY, x],
			],
			lineStyle,
		).addTo(map);
	}
	for (let r = 1; r < ROWS; r++) {
		const y = minY + r * cellH;
		L.polyline(
			[
				[y, minX],
				[y, maxX],
			],
			lineStyle,
		).addTo(map);
	}

	// Column letters (top) + row numbers (left)
	for (let c = 0; c < COLS; c++) {
		const x = minX + c * cellW + cellW / 2;
		L.marker([maxY - cellH * 0.18, x], {
			icon: L.divIcon({
				className: "ao-map-grid-label",
				iconAnchor: [6, 0],
				html: COL_LETTERS[c],
			}),
			interactive: false,
		}).addTo(map);
	}
	for (let r = 0; r < ROWS; r++) {
		const y = maxY - r * cellH - cellH / 2;
		L.marker([y, minX + cellW * 0.08], {
			icon: L.divIcon({
				className: "ao-map-grid-label",
				iconAnchor: [0, 6],
				html: `${r + 1}`,
			}),
			interactive: false,
		}).addTo(map);
	}
};

/* ── SAM / AAA zone ── */
const addSAMZone = (map, bounds) => {
	L.rectangle(bounds, {
		color: "rgba(255,30,30,0.45)",
		weight: 1.5,
		dashArray: "8, 10",
		fill: true,
		fillColor: "rgba(255,0,0,0.06)",
		fillOpacity: 1,
		interactive: false,
	}).addTo(map);

	const [[minY, minX], [maxY, maxX]] = bounds;
	L.marker([(minY + maxY) * 0.85, (minX + maxX) / 2], {
		icon: L.divIcon({
			className: "ao-sam-label",
			iconAnchor: [80, 10],
			html: "⚠ SAM / AAA COVERAGE ACTIVE",
		}),
		interactive: false,
	}).addTo(map);
};

/* ── Coast zone overlays ── */
const addCoastZones = (map, coastZones, bounds) => {
	if (!coastZones?.length) return;
	const [[minY, minX], [maxY, maxX]] = bounds;
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;

	coastZones.forEach((zone) => {
		// Draw a dashed line along the coast side with a label
		let line, labelPos;
		const margin = 18;
		switch (zone.side) {
			case "north":
				line = [
					[maxY - margin, minX + 80],
					[maxY - margin, maxX - 80],
				];
				labelPos = [maxY - margin * 2, midX];
				break;
			case "south":
				line = [
					[minY + margin, minX + 80],
					[minY + margin, maxX - 80],
				];
				labelPos = [minY + margin * 2.5, midX];
				break;
			case "west":
				line = [
					[minY + 80, minX + margin],
					[maxY - 80, minX + margin],
				];
				labelPos = [midY, minX + margin * 3];
				break;
			case "east":
				line = [
					[minY + 80, maxX - margin],
					[maxY - 80, maxX - margin],
				];
				labelPos = [midY, maxX - margin * 3];
				break;
			default:
				return;
		}

		L.polyline(line, {
			color: "rgba(100,200,255,0.35)",
			weight: 1.5,
			dashArray: "4, 8",
			interactive: false,
		}).addTo(map);

		L.marker(labelPos, {
			icon: L.divIcon({
				className: "ao-coast-label",
				iconAnchor: [40, 6],
				html: `▸ ${zone.label.toUpperCase()}`,
			}),
			interactive: false,
		}).addTo(map);
	});
};

/* ── Airfield marker ── */
const addAirfieldMarker = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	// Place in lower-center of map as a generic indicator
	const pos = [(minY + maxY) * 0.3, (minX + maxX) * 0.65];
	L.marker(pos, {
		icon: L.divIcon({
			className: "ao-airfield-label",
			iconAnchor: [30, 8],
			html: "✈ AIRFIELD",
		}),
		interactive: false,
	}).addTo(map);
};

/* ── Restriction HUD (top-right corner control) ── */
const buildRestrictionHUD = (restrictions) => {
	const control = L.control({ position: "topright" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:none;";

		const entries = Object.entries(RESTRICTION_LABELS)
			.map(([key, label]) => {
				const r = restrictions?.[key];
				if (!r || r.status === STATUS.NOMINAL) return null;
				const isDenied = r.status === STATUS.DENIED;
				const color =
					isDenied ? "rgba(255,60,60,0.9)" : "rgba(255,170,40,0.85)";
				const bg = isDenied ? "rgba(80,10,10,0.75)" : "rgba(60,40,5,0.75)";
				const border =
					isDenied ? "rgba(180,30,30,0.5)" : "rgba(160,100,10,0.5)";
				const tag = isDenied ? "DENIED" : "DEGR";
				return `
					<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;
						padding:3px 8px;margin-bottom:2px;
						background:${bg};border:1px solid ${border};border-radius:1px;">
						<span style="font-family:'Share Tech Mono',monospace;font-size:7.5px;
							letter-spacing:0.12em;color:${color};">${label}</span>
						<span style="font-family:'Share Tech Mono',monospace;font-size:7px;
							letter-spacing:0.18em;color:${color};opacity:0.8;">${tag}</span>
					</div>`;
			})
			.filter(Boolean);

		if (entries.length === 0) {
			div.innerHTML = `
				<div style="padding:4px 8px;background:rgba(5,20,5,0.75);border:1px solid rgba(74,90,40,0.3);border-radius:1px;">
					<span style="font-family:'Share Tech Mono',monospace;font-size:7.5px;
						letter-spacing:0.15em;color:rgba(143,184,64,0.6);">ALL ASSETS NOMINAL</span>
				</div>`;
		} else {
			div.innerHTML = `
				<div style="margin-bottom:3px;padding:2px 8px;">
					<span style="font-family:'Share Tech Mono',monospace;font-size:7px;
						letter-spacing:0.2em;color:rgba(255,100,100,0.5);">ASSET RESTRICTIONS</span>
				</div>
				${entries.join("")}`;
		}
		return div;
	};
	return control;
};

/* ── Classification header overlay ── */
const buildClassificationHeader = (provinceName, biome) => {
	const control = L.control({ position: "topleft" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:none;";
		div.innerHTML = `
			<div style="padding:4px 10px;background:rgba(5,8,4,0.82);
				border:1px solid rgba(74,90,40,0.3);border-radius:1px;
				border-left:2px solid rgba(143,184,64,0.4);">
				<div style="font-family:'Share Tech Mono',monospace;font-size:14px;
					letter-spacing:0.15em;color:rgba(143,184,64,0.7);margin-bottom:1px;">
					${provinceName.toUpperCase()}
				</div>
				<div style="font-family:'Share Tech Mono',monospace;font-size:12px;
					letter-spacing:0.22em;color:rgba(143,184,64,0.35);">
				${biome ? biome.toUpperCase() : "AO-INTEL // CLASSIFIED"}
				</div>
			</div>`;
		return div;
	};
	return control;
};

/* ════════════════════════════════════════════════════════ */

const AOIntelMap = ({
	bounds,
	imgURL,
	province,
	terrain,
	provinceName,
	biome,
}) => {
	const mapRef = useRef(null);
	const mapInst = useRef(null);

	useEffect(() => {
		if (!bounds || !imgURL) return;

		if (mapInst.current) {
			try {
				mapInst.current.stop();
				mapInst.current.remove();
			} catch {
				/* removed */
			}
			mapInst.current = null;
		}

		injectStyles();

		const initialZoom = window.innerWidth >= 1024 ? 0 : -2;
		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: initialZoom,
			crs: L.CRS.Simple,
			dragging: true,
			zoomControl: false,
			scrollWheelZoom: false,
			zoomAnimation: false,
			attributionControl: false,
		});
		map.setMinZoom(-3);
		map.setMaxZoom(1);
		mapInst.current = map;

		/* ── Base image ── */
		const overlay = L.imageOverlay(imgURL, bounds, {
			className: "ao-intel-map-img",
		}).addTo(map);
		overlay.on("load", () => {
			const el = overlay.getElement();
			if (el) {
				el.style.filter =
					"brightness(0.68) saturate(0.6) contrast(1.12) sepia(0.1)";
				el.style.transition = "filter 0.4s ease";
			}
		});

		/* ── Grid ── */
		addGrid(map, bounds);

		/* ── Restrictions ── */
		const restrictions = province ? resolveRestrictions(province, null) : null;

		/* ── SAM zone ── */
		if (
			restrictions?.aviation?.status === STATUS.DENIED &&
			restrictions?.aviation?.source === SOURCE.THREAT
		) {
			addSAMZone(map, bounds);
		}

		/* ── Coast zones ── */
		if (terrain?.hasCoast && terrain?.coastZones?.length) {
			addCoastZones(map, terrain.coastZones, bounds);
		}

		/* ── Airfield marker ── */
		if (terrain?.hasAirfield) {
			addAirfieldMarker(map, bounds);
		}

		/* ── HUD controls ── */
		if (window.innerWidth >= 1024) buildRestrictionHUD(restrictions).addTo(map);
		buildClassificationHeader(
			provinceName || province || "UNKNOWN",
			biome,
		).addTo(map);

		/* ── Fit to full bounds ── */
		map.fitBounds(bounds, { padding: [10, 10] });

		/* ── Fix size after layout settle ── */
		const rafId = requestAnimationFrame(() => {
			if (mapInst.current) mapInst.current.invalidateSize();
		});
		const timerId = setTimeout(() => {
			if (mapInst.current) mapInst.current.invalidateSize();
		}, 300);

		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(timerId);
			if (mapInst.current) {
				try {
					mapInst.current.stop();
					mapInst.current.remove();
				} catch {
					/* removed */
				}
				mapInst.current = null;
			}
		};
	}, [bounds, imgURL, province, terrain, provinceName, biome]);

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				background: "#050704",
				overflow: "hidden",
			}}>
			<div
				ref={mapRef}
				style={{ width: "100%", height: "100%", background: "#050704" }}
			/>
		</div>
	);
};

AOIntelMap.propTypes = {
	bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
	imgURL: PropTypes.string.isRequired,
	province: PropTypes.string,
	terrain: PropTypes.shape({
		hasCoast: PropTypes.bool,
		coastZones: PropTypes.array,
		hasAirfield: PropTypes.bool,
	}),
	provinceName: PropTypes.string,
	biome: PropTypes.string,
};

export default AOIntelMap;
