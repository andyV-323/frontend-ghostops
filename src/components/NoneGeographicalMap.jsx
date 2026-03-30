import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { resolveRestrictions, RESTRICTION_LABELS } from "@/utils/Restrictions";
import { SOURCE, STATUS } from "@/config";

/* ─────────────────────────────────────────────────────────
   TACTICAL OPERATIONS MAP
   - Military satellite imagery aesthetic
   - MGRS-style alphanumeric grid (A1, B2...) with grid lines
   - AO boundary circles: inner engagement + outer search rings
   - OBJ markers with external labels + grid ref in popup
   - Infil / exfil markers with method indicator
   - Approach vector overlay (dashed line + arrowhead)
   - SAM / AAA zone overlay (aviation-denied threat provinces)
   - Province restriction badges HUD (top-left)
   - Compass rose (top-right)
   - Classification / intel-feed header overlay
   - Scanlines overlay for CRT/satellite-feed look
   - Auto-fit view to objectives
───────────────────────────────────────────────────────── */

const OBJ_COLOR = "#FF4444";
const OBJ_PULSE_COLOR = "rgba(255,68,68,0.2)";
const OBJ_SIZE = 36;

const COLS = 8;
const ROWS = 6;
const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/* ── Inject all global styles once ── */
const injectStyles = () => {
	if (document.getElementById("tac-map-style")) return;
	const style = document.createElement("style");
	style.id = "tac-map-style";
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

		@keyframes obj-pulse {
			0%   { box-shadow: 0 0 0 0 ${OBJ_PULSE_COLOR}; transform: scale(1); }
			60%  { box-shadow: 0 0 0 12px rgba(255,68,68,0); transform: scale(1.08); }
			100% { box-shadow: 0 0 0 0 rgba(255,68,68,0); transform: scale(1); }
		}
		.obj-marker {
			width: ${OBJ_SIZE}px; height: ${OBJ_SIZE}px;
			border-radius: 2px;
			background: rgba(180,30,30,0.25);
			border: 1.5px solid ${OBJ_COLOR};
			display: flex; align-items: center; justify-content: center;
			animation: obj-pulse 1.8s ease-out infinite;
			box-sizing: border-box; position: relative;
			transform: rotate(45deg);
		}
		.obj-marker::before {
			content: ''; position: absolute; inset: 0;
			background:
				linear-gradient(${OBJ_COLOR} 1px, transparent 1px) center / 1px 40%,
				linear-gradient(90deg, ${OBJ_COLOR} 1px, transparent 1px) center / 40% 1px;
			background-repeat: no-repeat; opacity: 0.5;
		}
		.obj-marker::after {
			content: ''; position: absolute; inset: 3px;
			border: 1px solid rgba(255,68,68,0.3); border-radius: 1px;
		}
		.obj-label-inner {
			font-family: 'Share Tech Mono', monospace;
			font-size: 9px; font-weight: 700;
			color: ${OBJ_COLOR}; letter-spacing: 0.05em;
			text-shadow: 0 0 6px rgba(255,68,68,0.8);
			position: relative; z-index: 1; line-height: 1;
			transform: rotate(-45deg);
		}
		.obj-ext-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 8.5px; font-weight: 700; color: ${OBJ_COLOR};
			letter-spacing: 0.12em;
			text-shadow: 0 0 8px rgba(255,68,68,0.9), 0 1px 3px rgba(0,0,0,0.9);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.map-grid-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 9px; color: rgba(143,184,64,0.5);
			letter-spacing: 0.08em; pointer-events: none; white-space: nowrap;
		}
		.coordinates-container {
			background: rgba(8,10,5,0.88); border: 1px solid rgba(74,90,40,0.3);
			color: #5a6a40; font-family:'Share Tech Mono',monospace;
			font-size:10px; letter-spacing:0.12em;
			padding: 3px 8px; border-radius:1px; pointer-events:none;
		}
		.tac-popup-obj .leaflet-popup-content-wrapper {
			background: rgba(10,5,5,0.97);
			border: 1px solid rgba(180,30,30,0.4);
			border-top: 2px solid rgba(255,68,68,0.5);
			border-radius: 2px; box-shadow: 0 6px 28px rgba(0,0,0,0.9); padding: 0;
		}
		.tac-popup-obj .leaflet-popup-content { margin: 10px 14px; }
		.tac-popup-obj .leaflet-popup-tip-container { display: none; }
		.tac-popup-obj .leaflet-popup-close-button { color:#7a3535 !important; top:5px !important; right:7px !important; }
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
		.leaflet-control-zoom a:hover { background:rgba(60,75,40,0.4) !important; color:#c1ff72 !important; }

		.infil-label {
			font-family: 'Share Tech Mono', monospace; font-size: 8px;
			letter-spacing: 0.14em; line-height: 1.5;
			color: rgba(193,255,114,0.9); text-shadow: 0 0 8px rgba(193,255,114,0.5);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.exfil-label {
			font-family: 'Share Tech Mono', monospace; font-size: 8px;
			letter-spacing: 0.14em; color: rgba(100,200,220,0.85);
			text-shadow: 0 0 8px rgba(100,200,220,0.4);
			white-space: nowrap; pointer-events: none; text-align: center;
		}
		.approach-arrow {
			width: 0; height: 0;
			border-left: 5px solid transparent; border-right: 5px solid transparent;
			border-bottom: 10px solid rgba(193,255,114,0.75);
			filter: drop-shadow(0 0 3px rgba(193,255,114,0.45));
		}
		.sam-warning-label {
			font-family: 'Share Tech Mono', monospace; font-size: 8px;
			letter-spacing: 0.15em; color: rgba(255,68,68,0.75);
			text-shadow: 0 0 8px rgba(255,50,50,0.6);
			white-space: nowrap; pointer-events: none;
		}
	`;
	document.head.appendChild(style);
};

/* ── Objective marker ── */
const buildObjIcon = (index) =>
	L.divIcon({
		className: "",
		iconSize: [OBJ_SIZE, OBJ_SIZE],
		iconAnchor: [OBJ_SIZE / 2, OBJ_SIZE / 2],
		html: `<div class="obj-marker"><span class="obj-label-inner">${String(index + 1).padStart(2, "0")}</span></div>`,
	});

const buildObjLabelIcon = (index) =>
	L.divIcon({
		className: "",
		iconSize: [60, 14],
		iconAnchor: [30, -OBJ_SIZE / 2 - 4],
		html: `<div class="obj-ext-label">OBJ-${String(index + 1).padStart(2, "0")}</div>`,
	});

/* ── MGRS-style grid ── */
const addGrid = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	const stepX = (maxX - minX) / COLS;
	const stepY = (maxY - minY) / ROWS;
	const lineStyle = { color: "rgba(143,184,64,0.1)", weight: 1, interactive: false };

	for (let i = 0; i <= COLS; i++) {
		const x = minX + i * stepX;
		L.polyline([[minY, x], [maxY, x]], lineStyle).addTo(map);
		if (i < COLS) {
			L.marker([maxY, x + stepX / 2], {
				icon: L.divIcon({ className: "map-grid-label", html: COL_LETTERS[i] || String(i + 1), iconAnchor: [6, -4] }),
				interactive: false,
			}).addTo(map);
		}
	}
	for (let j = 0; j <= ROWS; j++) {
		const y = minY + j * stepY;
		L.polyline([[y, minX], [y, maxX]], lineStyle).addTo(map);
		if (j < ROWS) {
			L.marker([y + stepY / 2, minX], {
				icon: L.divIcon({ className: "map-grid-label", html: String(ROWS - j), iconAnchor: [36, 6] }),
				interactive: false,
			}).addTo(map);
		}
	}
};

/* ── AO boundary rings ── */
const addAORings = (map, coords) => {
	L.circle(coords, { radius: 55, color: "rgba(255,68,68,0.5)", weight: 1, dashArray: "5, 6", fill: false, interactive: false }).addTo(map);
	L.circle(coords, { radius: 115, color: "rgba(255,68,68,0.18)", weight: 1, dashArray: "2, 9", fill: true, fillColor: "rgba(255,68,68,0.03)", fillOpacity: 1, interactive: false }).addTo(map);
};

/* ── Approach vector: dashed axis-of-advance line with directional arrowhead ── */
const addApproachVector = (map, infilPoint, objectives) => {
	if (!infilPoint || !objectives.length) return;
	objectives.forEach((objCoords) => {
		L.polyline([infilPoint, objCoords], {
			color: "rgba(193,255,114,0.5)", weight: 1.5, dashArray: "7, 9", interactive: false,
		}).addTo(map);

		// Arrowhead at 70% along the line
		const arrowPos = [
			infilPoint[0] + (objCoords[0] - infilPoint[0]) * 0.7,
			infilPoint[1] + (objCoords[1] - infilPoint[1]) * 0.7,
		];
		const bearing = Math.atan2(
			objCoords[1] - infilPoint[1],
			objCoords[0] - infilPoint[0],
		) * (180 / Math.PI);

		L.marker(arrowPos, {
			icon: L.divIcon({
				className: "",
				iconSize: [10, 10],
				iconAnchor: [5, 5],
				html: `<div class="approach-arrow" style="transform:rotate(${bearing}deg);transform-origin:center center;"></div>`,
			}),
			interactive: false,
		}).addTo(map);
	});
};

/* ── SAM / AAA zone: full-AO coverage when aviation denied by threat ── */
const addSAMZone = (map, bounds) => {
	L.rectangle(bounds, {
		color: "rgba(255,30,30,0.45)", weight: 1.5, dashArray: "8, 10",
		fill: true, fillColor: "rgba(255,0,0,0.06)", fillOpacity: 1, interactive: false,
	}).addTo(map);

	const [[minY, minX], [maxY, maxX]] = bounds;
	L.marker([(minY + maxY) * 0.82, (minX + maxX) / 2], {
		icon: L.divIcon({ className: "sam-warning-label", iconAnchor: [70, 10], html: "⚠ SAM / AAA COVERAGE ACTIVE" }),
		interactive: false,
	}).addTo(map);
};

/* ── Infil marker with insertion method ── */
const addInfilMarker = (map, infilPoint, infilMethod) => {
	if (!infilPoint) return;
	const methodLine = infilMethod ?
		`<span style="display:block;font-size:7px;letter-spacing:0.2em;margin-top:1px;opacity:0.8;">${infilMethod.toUpperCase()}</span>`
		: "";
	L.marker(infilPoint, {
		icon: L.divIcon({
			className: "",
			iconSize: [64, 36],
			iconAnchor: [32, 36],
			html: `<div class="infil-label">▲ INFIL${methodLine}</div>`,
		}),
		interactive: false,
		zIndexOffset: 50,
	}).addTo(map);
};

/* ── Exfil marker ── */
const addExfilMarker = (map, exfilPoint, fallbackExfil) => {
	const point = exfilPoint || fallbackExfil;
	if (!point) return;
	L.marker(point, {
		icon: L.divIcon({
			className: "",
			iconSize: [64, 20],
			iconAnchor: [32, 0],
			html: `<div class="exfil-label">▼ EXFIL</div>`,
		}),
		interactive: false,
		zIndexOffset: 50,
	}).addTo(map);
};

/* ── Province restriction badges HUD ── */
const buildRestrictionBadges = (restrictions) => {
	const control = L.control({ position: "topleft" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:none;margin-top:32px;";

		const denied = Object.entries(restrictions).filter(([, v]) => v.status === STATUS.DENIED);
		const degraded = Object.entries(restrictions).filter(([, v]) => v.status === STATUS.DEGRADED);
		const items = [
			...denied.slice(0, 3).map(([k]) => ({ key: k, type: "denied" })),
			...degraded.slice(0, 2).map(([k]) => ({ key: k, type: "degraded" })),
		].slice(0, 4);

		if (!items.length) return div;

		div.innerHTML = `<div style="display:flex;flex-direction:column;gap:3px;">${items.map(({ key, type }) =>
			`<div style="font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:0.12em;padding:2px 7px;border-radius:1px;white-space:nowrap;${
				type === "denied" ?
					"background:rgba(160,20,20,0.25);border:1px solid rgba(255,68,68,0.4);color:#FF6666;"
					: "background:rgba(150,90,0,0.25);border:1px solid rgba(255,170,0,0.35);color:#FBBF24;"
			}">${RESTRICTION_LABELS[key] ?? key.toUpperCase()} ${type.toUpperCase()}</div>`
		).join("")}</div>`;
		return div;
	};
	return control;
};

/* ── Compass rose ── */
const buildCompass = () => {
	const control = L.control({ position: "topright" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:none;margin:10px;";
		div.innerHTML = `
			<svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg"
				style="filter:drop-shadow(0 0 6px rgba(143,184,64,0.3))">
				<circle cx="26" cy="26" r="24" stroke="rgba(143,184,64,0.35)" stroke-width="1"/>
				<circle cx="26" cy="26" r="20" stroke="rgba(143,184,64,0.15)" stroke-width="0.5" stroke-dasharray="3,4"/>
				${[0,45,90,135,180,225,270,315].map((deg) => {
					const r = deg % 90 === 0 ? 20 : 21.5, r2 = 24;
					const rad = ((deg - 90) * Math.PI) / 180;
					const x1 = 26 + r * Math.cos(rad), y1 = 26 + r * Math.sin(rad);
					const x2 = 26 + r2 * Math.cos(rad), y2 = 26 + r2 * Math.sin(rad);
					return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(143,184,64,0.5)" stroke-width="${deg % 90 === 0 ? 1.5 : 0.8}"/>`;
				}).join("")}
				<polygon points="26,5 23,22 26,19 29,22" fill="rgba(193,255,114,0.9)" opacity="0.9"/>
				<polygon points="26,47 23,30 26,33 29,30" fill="rgba(143,184,64,0.35)"/>
				<text x="26" y="4.5" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="7" fill="#c1ff72" font-weight="700" letter-spacing="0.05em">N</text>
				<text x="26" y="51" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="6" fill="rgba(143,184,64,0.5)">S</text>
				<text x="50" y="27.5" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="6" fill="rgba(143,184,64,0.5)">E</text>
				<text x="2" y="27.5" text-anchor="middle" font-family="Share Tech Mono,monospace" font-size="6" fill="rgba(143,184,64,0.5)">W</text>
				<circle cx="26" cy="26" r="2.5" fill="rgba(193,255,114,0.8)"/>
				<circle cx="26" cy="26" r="1" fill="#c1ff72"/>
			</svg>`;
		return div;
	};
	return control;
};

/* ── Scale bar ── */
const buildScale = () =>
	L.control.scale({ position: "bottomright", imperial: false, maxWidth: 80 });

/* ── Legend ── */
const buildLegend = () => {
	const control = L.control({ position: "bottomleft" });
	control.onAdd = () => {
		const isMobile = window.innerWidth < 640;
		const div = L.DomUtil.create("div");
		div.style.cssText = "pointer-events:auto;";

		const bodyId = "tac-legend-body-" + Math.random().toString(36).slice(2, 7);
		const arrowId = "tac-legend-arrow-" + Math.random().toString(36).slice(2, 7);

		div.innerHTML = `
			<div style="font-family:'Share Tech Mono',monospace;font-size:9.5px;letter-spacing:0.1em;
				background:rgba(8,10,6,0.92);border:1px solid rgba(74,90,40,0.35);
				border-top:2px solid rgba(143,184,64,0.4);border-radius:1px;min-width:165px;">
				<button id="tac-legend-toggle"
					style="width:100%;display:flex;align-items:center;justify-content:space-between;
					padding:7px 12px;background:none;border:none;cursor:pointer;outline:none;">
					<span style="color:rgba(143,184,64,0.5);letter-spacing:0.18em;font-size:8.5px;font-family:'Share Tech Mono',monospace;">MAP LEGEND</span>
					<span id="${arrowId}" style="color:rgba(143,184,64,0.4);font-size:8px;transition:transform 0.2s;display:inline-block;transform:rotate(${isMobile ? "180deg" : "0deg"});">▲</span>
				</button>
				<div id="${bodyId}" style="padding:0 12px 10px 12px;display:${isMobile ? "none" : "block"};">
					<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
						<div style="width:12px;height:12px;border-radius:2px;border:1.5px solid #FF4444;background:rgba(255,68,68,0.15);flex-shrink:0;transform:rotate(45deg);"></div>
						<span style="color:#7a9060;">OBJECTIVE</span>
					</div>
					<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
						<div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid rgba(193,255,114,0.7);flex-shrink:0;"></div>
						<span style="color:#7a9060;">INFIL / AXIS OF ADVANCE</span>
					</div>
					<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
						<div style="width:12px;height:12px;border-radius:50%;border:1px dashed rgba(255,68,68,0.5);flex-shrink:0;"></div>
						<span style="color:#7a9060;">ENGAGEMENT ZONE</span>
					</div>
					<div style="display:flex;align-items:center;gap:7px;">
						<div style="width:12px;height:12px;border-radius:50%;border:1px dashed rgba(255,68,68,0.2);flex-shrink:0;"></div>
						<span style="color:#7a9060;">SEARCH PERIMETER</span>
					</div>
				</div>
			</div>`;

		// Wire up toggle after DOM insertion
		setTimeout(() => {
			const btn = div.querySelector("#tac-legend-toggle");
			const body = div.querySelector(`#${bodyId}`);
			const arrow = div.querySelector(`#${arrowId}`);
			if (!btn || !body || !arrow) return;
			let open = !isMobile;
			btn.addEventListener("click", (e) => {
				L.DomEvent.stopPropagation(e);
				open = !open;
				body.style.display = open ? "block" : "none";
				arrow.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
			});
		}, 0);

		return div;
	};
	return control;
};

/* ── MGRS grid ref from map coordinates ── */
const toGridRef = (coords, bounds) => {
	if (!coords || !bounds) return "??-??";
	const [[minY, minX], [maxY, maxX]] = bounds;
	const colIdx = Math.min(Math.floor(((coords[1] - minX) / (maxX - minX)) * COLS), COLS - 1);
	const rowIdx = Math.min(Math.floor(((maxY - coords[0]) / (maxY - minY)) * ROWS), ROWS - 1);
	return `${COL_LETTERS[colIdx] || "?"}${rowIdx + 1}`;
};

/* ── Objective popup with grid reference ── */
const objPopupHTML = (mark, index, gridRef) => `
	<div style="font-family:'Share Tech Mono',monospace;">
		<div style="font-size:0.58em;color:#7a3535;letter-spacing:0.15em;margin-bottom:4px;display:flex;gap:8px;">
			<span>OBJ-${String(index + 1).padStart(2, "0")}</span>
			<span style="color:#5a6a40;">GRID ${gridRef}</span>
			<span>// CLASSIFIED</span>
		</div>
		<div style="font-size:0.78em;font-weight:700;color:#e8b0b0;letter-spacing:0.06em;margin-bottom:5px;">
			${mark.name}
		</div>
		<div style="font-size:0.62em;color:#7a6060;line-height:1.5;border-top:1px solid rgba(120,50,50,0.3);padding-top:5px;">
			${mark.description || "No additional intel."}
		</div>
	</div>`;

/* ════════════════════════════════════════════════════════ */
const NoneGeographicalMap = ({
	bounds,
	locationsInProvince,
	imgURL,
	infilPoint,
	exfilPoint,
	fallbackExfil,
	infilMethod,
	province,
}) => {
	const mapRef = useRef(null);
	const mapInst = useRef(null);
	const coordsRef = useRef(null);

	useEffect(() => {
		if (!bounds || !imgURL || !Array.isArray(locationsInProvince)) {
			console.warn("Map Data is Invalid. Skipping Update.");
			return;
		}

		if (mapInst.current) {
			try { mapInst.current.stop(); mapInst.current.remove(); } catch { /* already removed */ }
			mapInst.current = null;
		}

		injectStyles();

		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: 2, crs: L.CRS.Simple,
			dragging: true, zoomControl: true, scrollWheelZoom: true, zoomAnimation: false,
		});
		map.setMinZoom(-3);
		map.setMaxZoom(2);
		mapInst.current = map;

		/* ── Base image ── */
		const overlay = L.imageOverlay(imgURL, bounds, { className: "tac-map-img" }).addTo(map);
		overlay.on("load", () => {
			const el = overlay.getElement();
			if (el) {
				el.style.filter = "brightness(0.72) saturate(0.65) contrast(1.1) sepia(0.12)";
				el.style.transition = "filter 0.4s ease";
			}
		});

		/* ── Province restrictions ── */
		const restrictions = province ? resolveRestrictions(province, null) : null;

		/* ── SAM / AAA zone — aviation denied by threat ── */
		if (
			restrictions?.aviation?.status === STATUS.DENIED &&
			restrictions?.aviation?.source === SOURCE.THREAT
		) {
			addSAMZone(map, bounds);
		}

		/* ── MGRS grid ── */
		addGrid(map, bounds);

		/* ── Collect objective coords ── */
		const objCoords = locationsInProvince
			.filter((m) => Array.isArray(m.coordinates) && m.coordinates.length === 2)
			.map((m) => m.coordinates);

		/* ── Approach vector ── */
		addApproachVector(map, infilPoint, objCoords);

		/* ── Infil / Exfil markers ── */
		addInfilMarker(map, infilPoint, infilMethod);
		addExfilMarker(map, exfilPoint, fallbackExfil);

		/* ── Objectives + AO rings ── */
		locationsInProvince.forEach((mark, i) => {
			if (!Array.isArray(mark.coordinates) || mark.coordinates.length !== 2) return;
			addAORings(map, mark.coordinates);
			const gridRef = toGridRef(mark.coordinates, bounds);
			L.marker(mark.coordinates, { icon: buildObjIcon(i), interactive: true })
				.bindPopup(objPopupHTML(mark, i, gridRef), { className: "tac-popup-obj", maxWidth: 220, offset: [0, -8] })
				.addTo(map);
			L.marker(mark.coordinates, { icon: buildObjLabelIcon(i), interactive: false, zIndexOffset: -10 }).addTo(map);
		});

		/* ── Controls ── */
		buildCompass().addTo(map);
		buildScale().addTo(map);
		buildLegend().addTo(map);
		if (restrictions) buildRestrictionBadges(restrictions).addTo(map);

		/* ── Coordinates display ── */
		const coordControl = L.control({ position: "bottomright" });
		coordControl.onAdd = () => {
			const div = L.DomUtil.create("div", "coordinates-container");
			div.style.marginBottom = "4px";
			coordsRef.current = div;
			div.textContent = "—, —";
			return div;
		};
		coordControl.addTo(map);
		map.on("mousemove", (e) => {
			if (coordsRef.current) {
				const ref = toGridRef([e.latlng.lat, e.latlng.lng], bounds);
				coordsRef.current.textContent = `${ref} · ${e.latlng.lat.toFixed(0)}, ${e.latlng.lng.toFixed(0)}`;
			}
		});

		/* ── Auto-fit to objectives + infil ── */
		const fitCoords = [...objCoords, ...(infilPoint ? [infilPoint] : [])];
		if (fitCoords.length > 0) {
			try { map.fitBounds(L.latLngBounds(fitCoords), { padding: [120, 120], maxZoom: -1 }); }
			catch { map.setZoom(-2); }
		} else {
			map.setZoom(-2);
		}

		return () => {
			coordsRef.current = null;
			if (mapInst.current) {
				try { mapInst.current.stop(); mapInst.current.remove(); } catch { /* already removed */ }
				mapInst.current = null;
			}
		};
	}, [bounds, locationsInProvince, imgURL, infilPoint, exfilPoint, fallbackExfil, infilMethod, province]);

	/* ── Derive header data ── */
	const firstObj = Array.isArray(locationsInProvince) && locationsInProvince[0];
	const gridRef = firstObj ? toGridRef(firstObj.coordinates, bounds) : "??-??";
	const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";
	const restrictions = province ? resolveRestrictions(province, null) : null;
	const samActive =
		restrictions?.aviation?.status === STATUS.DENIED &&
		restrictions?.aviation?.source === SOURCE.THREAT;

	return (
		<div style={{ position: "relative", width: "100%", height: "100%", background: "#050704", overflow: "hidden" }}>

			{/* ── Intel feed header ── */}
			<div style={{
				position: "absolute", top: 0, left: 0, right: 0, zIndex: 800,
				background: "rgba(5,8,4,0.88)", borderBottom: "1px solid rgba(143,184,64,0.2)",
				padding: "5px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
				pointerEvents: "none", fontFamily: "'Share Tech Mono', monospace",
				fontSize: "8.5px", letterSpacing: "0.14em", gap: "12px",
			}}>
				<span style={{ color: "rgba(255,68,68,0.6)" }}>// TOP SECRET //</span>
				<span style={{ color: "rgba(143,184,64,0.4)" }}>TACTICAL SATELLITE FEED</span>
				<span style={{ color: "rgba(143,184,64,0.35)" }}>
					GRID {gridRef} · {locationsInProvince?.length ?? 0} OBJ
				</span>
				<span style={{ color: "rgba(143,184,64,0.3)" }}>{timestamp}</span>
				{samActive && (
					<span style={{ color: "rgba(255,68,68,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
						<span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#FF4444", boxShadow: "0 0 5px #FF4444" }} />
						SAM ACTIVE
					</span>
				)}
				<span style={{ color: "rgba(193,255,114,0.5)", display: "flex", alignItems: "center", gap: 5 }}>
					<span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#c1ff72", boxShadow: "0 0 5px #c1ff72" }} />
					LIVE
				</span>
			</div>

			{/* ── Scanlines ── */}
			<div style={{
				position: "absolute", inset: 0, zIndex: 750, pointerEvents: "none",
				backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)",
				mixBlendMode: "multiply",
			}} />

			{/* ── Corner brackets ── */}
			{["tl", "tr", "bl", "br"].map((corner) => (
				<div key={corner} style={{
					position: "absolute", width: 28, height: 28, zIndex: 800, pointerEvents: "none",
					...(corner === "tl" ? { top: 8, left: 8, borderTop: "2px solid rgba(143,184,64,0.5)", borderLeft: "2px solid rgba(143,184,64,0.5)" } : {}),
					...(corner === "tr" ? { top: 8, right: 8, borderTop: "2px solid rgba(143,184,64,0.5)", borderRight: "2px solid rgba(143,184,64,0.5)" } : {}),
					...(corner === "bl" ? { bottom: 8, left: 8, borderBottom: "2px solid rgba(143,184,64,0.5)", borderLeft: "2px solid rgba(143,184,64,0.5)" } : {}),
					...(corner === "br" ? { bottom: 8, right: 8, borderBottom: "2px solid rgba(143,184,64,0.5)", borderRight: "2px solid rgba(143,184,64,0.5)" } : {}),
				}} />
			))}

			{/* ── Vignette ── */}
			<div style={{
				position: "absolute", inset: 0, zIndex: 700, pointerEvents: "none",
				background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
			}} />

			{/* ── Leaflet mount ── */}
			<div ref={mapRef} style={{ width: "100%", height: "100%", background: "#050704" }} />
		</div>
	);
};

NoneGeographicalMap.propTypes = {
	bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
	locationsInProvince: PropTypes.arrayOf(
		PropTypes.shape({
			coordinates: PropTypes.arrayOf(PropTypes.number),
			name: PropTypes.string,
			description: PropTypes.string,
		}),
	),
	imgURL: PropTypes.string.isRequired,
	infilPoint: PropTypes.array,
	exfilPoint: PropTypes.array,
	fallbackExfil: PropTypes.array,
	infilMethod: PropTypes.string,
	province: PropTypes.string,
};

export default NoneGeographicalMap;
