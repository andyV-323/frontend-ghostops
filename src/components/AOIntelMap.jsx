import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { resolveRestrictions } from "@/utils/Restrictions";
import { SOURCE, STATUS } from "@/config";
import { LOC_TYPE_CONFIG, getLocationType } from "@/utils/locationTypes";

/* ─────────────────────────────────────────────────────────
   AO INTEL MAP  —  Full-stage tactical display
   Handles:
     - Satellite imagery with tactical filter
     - MGRS-style alphanumeric grid
     - SAM / AAA zone overlay (when aviation threat-denied)
     - Coast zone lines + airfield marker
     - Key location markers from ProvinceKeyLocations
       (click fires onLocationSelect callback)
   React overlays (weather HUD, restrictions, teams)
   are rendered by AOBriefingPage on top of this div.
───────────────────────────────────────────────────────── */

const COLS = 8;
const ROWS = 6;
const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const injectStyles = () => {
	if (document.getElementById("ao-intel-map-style")) return;
	const style = document.createElement("style");
	style.id = "ao-intel-map-style";
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
		.ao-map-grid-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 8px; color: rgba(143,184,64,0.3);
			letter-spacing: 0.08em; pointer-events: none; white-space: nowrap;
		}
		.ao-sam-label {
			font-family: 'Share Tech Mono', monospace; font-size: 7px;
			letter-spacing: 0.12em; color: rgba(255,68,68,0.75);
			text-shadow: 0 0 8px rgba(255,50,50,0.6);
			white-space: nowrap; pointer-events: none;
		}
		.ao-coast-label {
			font-family: 'Share Tech Mono', monospace; font-size: 6px;
			letter-spacing: 0.15em; color: rgba(100,200,255,0.6);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.ao-airfield-label {
			font-family: 'Share Tech Mono', monospace; font-size: 7px;
			letter-spacing: 0.12em; color: rgba(255,200,80,0.75);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.ao-loc-marker {
			transition: transform 0.1s ease, box-shadow 0.1s ease;
			cursor: pointer !important;
		}
		.ao-loc-marker:hover {
			transform: scale(1.35) !important;
		}
		.leaflet-div-icon {
			background: transparent !important;
			border: none !important;
		}
	`;
	document.head.appendChild(style);
};

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

const addGrid = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	const cellW = (maxX - minX) / COLS;
	const cellH = (maxY - minY) / ROWS;
	const lineStyle = {
		color: "rgba(143,184,64,0.1)",
		weight: 0.4,
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
	for (let c = 0; c < COLS; c++) {
		const x = minX + c * cellW + cellW / 2;
		L.marker([maxY - cellH * 0.15, x], {
			icon: L.divIcon({
				className: "ao-map-grid-label",
				iconAnchor: [5, 0],
				html: COL_LETTERS[c],
			}),
			interactive: false,
		}).addTo(map);
	}
	for (let r = 0; r < ROWS; r++) {
		const y = maxY - r * cellH - cellH / 2;
		L.marker([y, minX + cellW * 0.06], {
			icon: L.divIcon({
				className: "ao-map-grid-label",
				iconAnchor: [0, 5],
				html: `${r + 1}`,
			}),
			interactive: false,
		}).addTo(map);
	}
};

const addSAMZone = (map, bounds) => {
	L.rectangle(bounds, {
		color: "rgba(255,30,30,0.5)",
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
			iconAnchor: [70, 8],
			html: "⚠ SAM / AAA ACTIVE",
		}),
		interactive: false,
	}).addTo(map);
};

const addCoastZones = (map, coastZones, bounds) => {
	if (!coastZones?.length) return;
	const [[minY, minX], [maxY, maxX]] = bounds;
	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	coastZones.forEach((zone) => {
		let line, labelPos;
		const m = 18;
		switch (zone.side) {
			case "north":
				line = [
					[maxY - m, minX + 80],
					[maxY - m, maxX - 80],
				];
				labelPos = [maxY - m * 2.2, midX];
				break;
			case "south":
				line = [
					[minY + m, minX + 80],
					[minY + m, maxX - 80],
				];
				labelPos = [minY + m * 2.8, midX];
				break;
			case "west":
				line = [
					[minY + 80, minX + m],
					[maxY - 80, minX + m],
				];
				labelPos = [midY, minX + m * 3];
				break;
			case "east":
				line = [
					[minY + 80, maxX - m],
					[maxY - 80, maxX - m],
				];
				labelPos = [midY, maxX - m * 3.5];
				break;
			default:
				return;
		}
		L.polyline(line, {
			color: "rgba(100,200,255,0.28)",
			weight: 1,
			dashArray: "4, 8",
			interactive: false,
		}).addTo(map);
		L.marker(labelPos, {
			icon: L.divIcon({
				className: "ao-coast-label",
				iconAnchor: [35, 5],
				html: `▸ ${zone.label.toUpperCase()}`,
			}),
			interactive: false,
		}).addTo(map);
	});
};

const addAirfieldMarker = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	L.marker([(minY + maxY) * 0.3, (minX + maxX) * 0.65], {
		icon: L.divIcon({
			className: "ao-airfield-label",
			iconAnchor: [28, 7],
			html: "✈ AIRFIELD",
		}),
		interactive: false,
	}).addTo(map);
};

const buildClassificationHeader = (provinceName, biome) => {
	const control = L.control({ position: "topleft" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:none;";
		div.innerHTML = `
			<div style="padding:3px 8px;background:rgba(4,6,3,0.88);
				border:1px solid rgba(74,90,40,0.3);border-left:2px solid rgba(143,184,64,0.45);">
				<div style="font-family:'Share Tech Mono',monospace;font-size:12px;
					letter-spacing:0.14em;color:rgba(143,184,64,0.8);margin-bottom:1px;">
					${provinceName.toUpperCase()}
				</div>
				<div style="font-family:'Share Tech Mono',monospace;font-size:9px;
					letter-spacing:0.2em;color:rgba(143,184,64,0.35);">
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
	locations,
	onLocationSelect,
}) => {
	const mapRef = useRef(null);
	const mapInst = useRef(null);
	const onSelectRef = useRef(onLocationSelect);

	useEffect(() => {
		onSelectRef.current = onLocationSelect;
	}, [onLocationSelect]);

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

		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: -1,
			crs: L.CRS.Simple,
			dragging: false,
			zoomControl: false,
			scrollWheelZoom: false,
			zoomAnimation: false,
			attributionControl: false,
			keyboard: false,
		});
		map.setMinZoom(-3);
		map.setMaxZoom(1);
		mapInst.current = map;

		/* ── Base satellite image ── */
		const overlay = L.imageOverlay(imgURL, bounds, {}).addTo(map);
		overlay.on("load", () => {
			const el = overlay.getElement();
			if (el) {
				el.style.filter =
					"brightness(0.62) saturate(0.52) contrast(1.18) sepia(0.08)";
				el.style.transition = "filter 0.4s ease";
			}
		});

		/* ── MGRS grid ── */
		addGrid(map, bounds);

		/* ── Terrain + threat restrictions ── */
		const restrictions = province ? resolveRestrictions(province, null) : null;
		if (
			restrictions?.aviation?.status === STATUS.DENIED &&
			restrictions?.aviation?.source === SOURCE.THREAT
		) {
			addSAMZone(map, bounds);
		}
		if (terrain?.hasCoast && terrain?.coastZones?.length)
			addCoastZones(map, terrain.coastZones, bounds);
		if (terrain?.hasAirfield) addAirfieldMarker(map, bounds);

		/* ── Location markers ── */
		(locations || []).forEach((loc) => {
			const type = getLocationType(loc.name);
			const config = LOC_TYPE_CONFIG[type] || LOC_TYPE_CONFIG.poi;
			const size = config.size;

			const marker = L.marker(loc.coordinates, {
				icon: L.divIcon({
					className: "",
					iconSize: [size, size],
					iconAnchor: [size / 2, size / 2],
					html: `<div
						class="ao-loc-marker"
						title="${loc.name}"
						style="
							width:${size}px;height:${size}px;
							background:${config.bg};
							border:1px solid ${config.color}66;
							display:flex;align-items:center;justify-content:center;
							font-size:${Math.round(size * 0.55)}px;
							color:${config.color};
							border-radius:2px;
							box-shadow:0 0 8px ${config.color}28,inset 0 0 4px ${config.color}10;
							font-family:'Share Tech Mono',monospace;
						">${config.symbol}</div>`,
				}),
			}).addTo(map);

			marker.on("click", () => {
				const gridRef = toGridRef(loc.coordinates, bounds);
				onSelectRef.current?.({ ...loc, type, gridRef });
			});
		});

		/* ── Classification header ── */
		buildClassificationHeader(
			provinceName || province || "UNKNOWN",
			biome,
		).addTo(map);

		/* ── Fit + fix layout ── */
		map.fitBounds(bounds, { padding: [8, 8] });
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
	}, [bounds, imgURL, province, terrain, provinceName, biome, locations]);

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
	locations: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string,
			coordinates: PropTypes.arrayOf(PropTypes.number),
			description: PropTypes.string,
		}),
	),
	onLocationSelect: PropTypes.func,
};

export default AOIntelMap;
