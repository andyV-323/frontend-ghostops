import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";

/* ─────────────────────────────────────────────────────────
   TACTICAL OPERATIONS MAP
   - Military darker tint via CSS filter on image overlay
   - Numbered OBJ markers with sharp pulse (different from zones)
   - Zone rings (infil/exfil/rally) with slow radar pulse
   - Corner bracket vignette via DOM overlay
   - Grid coordinate labels on map edges
   - Tactical legend bottom-left
   - Styled popups — no default Leaflet chrome
───────────────────────────────────────────────────────── */

const ZONE_CONFIG = {
	infil: {
		color: "#C1FF72",
		pulse: "rgba(193,255,114,0.18)",
		label: "INSERTION ZONE",
		size: 110,
	},
	exfil: {
		color: "#4DA6FF",
		pulse: "rgba(77,166,255,0.15)",
		label: "EXTRACTION ZONE",
		size: 110,
	},
	rally: {
		color: "#FFD966",
		pulse: "rgba(255,217,102,0.15)",
		label: "RALLY ZONE",
		size: 90,
	},
};

const OBJ_COLOR = "#FF4444";
const OBJ_PULSE_COLOR = "rgba(255,68,68,0.2)";
const OBJ_SIZE = 36;

/* ── Inject all global styles once ── */
const injectStyles = () => {
	if (document.getElementById("tac-map-style")) return;
	const style = document.createElement("style");
	style.id = "tac-map-style";
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

		@keyframes obj-pulse {
			0%   { box-shadow: 0 0 0 0 ${OBJ_PULSE_COLOR}, inset 0 0 0 1px ${OBJ_COLOR}; transform: scale(1) rotate(0deg); }
			60%  { box-shadow: 0 0 0 10px rgba(255,68,68,0), inset 0 0 0 1px ${OBJ_COLOR}; transform: scale(1.08) rotate(0deg); }
			100% { box-shadow: 0 0 0 0 rgba(255,68,68,0), inset 0 0 0 1px ${OBJ_COLOR}; transform: scale(1) rotate(0deg); }
		}
		.obj-marker {
			width: ${OBJ_SIZE}px; height: ${OBJ_SIZE}px;
			border-radius: 2px;
			background: rgba(180,30,30,0.22);
			border: 1.5px solid ${OBJ_COLOR};
			display: flex; align-items: center; justify-content: center;
			animation: obj-pulse 1.8s ease-out infinite;
			box-sizing: border-box;
			position: relative;
			transform: rotate(45deg);
		}
		.obj-marker::before {
			content: '';
			position: absolute; inset: 0;
			background:
				linear-gradient(${OBJ_COLOR} 1px, transparent 1px) center / 1px 40%,
				linear-gradient(90deg, ${OBJ_COLOR} 1px, transparent 1px) center / 40% 1px;
			background-repeat: no-repeat;
			opacity: 0.5;
		}
		.obj-marker::after {
			content: '';
			position: absolute;
			inset: 3px;
			border: 1px solid rgba(255,68,68,0.3);
			border-radius: 1px;
		}
		.obj-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 9px; font-weight: 700;
			color: ${OBJ_COLOR}; letter-spacing: 0.05em;
			text-shadow: 0 0 6px rgba(255,68,68,0.8);
			position: relative; z-index: 1;
			line-height: 1;
			transform: rotate(-45deg);
		}

		@keyframes zone-pulse-infil {
			0%,100% { transform: scale(0.92); opacity:0.85; box-shadow: 0 0 0 0 rgba(193,255,114,0.18); }
			50%     { transform: scale(1.06); opacity:0.55; box-shadow: 0 0 0 18px rgba(193,255,114,0); }
		}
		@keyframes zone-pulse-exfil {
			0%,100% { transform: scale(0.92); opacity:0.85; box-shadow: 0 0 0 0 rgba(77,166,255,0.15); }
			50%     { transform: scale(1.06); opacity:0.55; box-shadow: 0 0 0 18px rgba(77,166,255,0); }
		}
		@keyframes zone-pulse-rally {
			0%,100% { transform: scale(0.92); opacity:0.85; box-shadow: 0 0 0 0 rgba(255,217,102,0.15); }
			50%     { transform: scale(1.06); opacity:0.55; box-shadow: 0 0 0 14px rgba(255,217,102,0); }
		}
		.zone-ring { border-radius:50%; box-sizing:border-box; position:relative; }
		.zone-ring-infil { animation: zone-pulse-infil 3s ease-in-out infinite; border:2px solid #C1FF72; background:rgba(193,255,114,0.1); }
		.zone-ring-exfil { animation: zone-pulse-exfil 3s ease-in-out infinite; border:2px solid #4DA6FF; background:rgba(77,166,255,0.08); }
		.zone-ring-rally { animation: zone-pulse-rally 3.4s ease-in-out infinite; border:2px dashed #FFD966; background:rgba(255,217,102,0.08); }

		.tac-popup .leaflet-popup-content-wrapper {
			background: rgba(8,10,6,0.97);
			border: 1px solid rgba(74,90,40,0.5);
			border-top: 2px solid rgba(143,184,64,0.6);
			border-radius: 2px;
			box-shadow: 0 6px 28px rgba(0,0,0,0.9);
			padding: 0;
		}
		.tac-popup .leaflet-popup-content { margin: 10px 14px; }
		.tac-popup .leaflet-popup-tip-container { display: none; }
		.tac-popup .leaflet-popup-close-button { color:#4a5535 !important; font-size:14px !important; top:5px !important; right:7px !important; }
		.tac-popup-obj .leaflet-popup-content-wrapper {
			background: rgba(10,5,5,0.97);
			border: 1px solid rgba(180,30,30,0.4);
			border-top: 2px solid rgba(255,68,68,0.5);
			border-radius: 2px;
			box-shadow: 0 6px 28px rgba(0,0,0,0.9);
			padding: 0;
		}
		.tac-popup-obj .leaflet-popup-content { margin: 10px 14px; }
		.tac-popup-obj .leaflet-popup-tip-container { display: none; }
		.tac-popup-obj .leaflet-popup-close-button { color:#7a3535 !important; top:5px !important; right:7px !important; }

		.map-grid-label {
			font-family: 'Share Tech Mono', monospace;
			font-size: 9px; color: rgba(143,184,64,0.45);
			letter-spacing: 0.08em; pointer-events: none;
			white-space: nowrap;
		}

		.coordinates-container {
			background: rgba(8,10,5,0.88);
			border: 1px solid rgba(74,90,40,0.3);
			color: #5a6a40; font-family:'Share Tech Mono',monospace;
			font-size:10px; letter-spacing:0.12em;
			padding: 3px 8px; border-radius:1px; pointer-events:none;
		}

		.leaflet-control-zoom {
			border: 1px solid rgba(74,90,40,0.35) !important;
			border-radius: 2px !important;
			box-shadow: none !important;
		}
		.leaflet-control-zoom a {
			background: rgba(8,10,6,0.92) !important;
			color: #7a9060 !important;
			border-bottom: 1px solid rgba(74,90,40,0.25) !important;
			font-family: 'Share Tech Mono', monospace !important;
			font-size: 14px !important;
			width: 26px !important; height: 26px !important;
			line-height: 26px !important;
		}
		.leaflet-control-zoom a:hover { background:rgba(60,75,40,0.4) !important; color:#c1ff72 !important; }
	`;
	document.head.appendChild(style);
};

const buildObjIcon = (index) =>
	L.divIcon({
		className: "",
		iconSize: [OBJ_SIZE, OBJ_SIZE],
		iconAnchor: [OBJ_SIZE / 2, OBJ_SIZE / 2],
		html: `<div class="obj-marker"><span class="obj-label">${String(index + 1).padStart(2, "0")}</span></div>`,
	});

const buildZoneIcon = (type) => {
	const cfg = ZONE_CONFIG[type];
	const size = cfg.size;
	return L.divIcon({
		className: "",
		iconSize: [size, size],
		iconAnchor: [size / 2, size / 2],
		html: `<div class="zone-ring zone-ring-${type}" style="width:${size}px;height:${size}px;"></div>`,
	});
};

const objPopupHTML = (mark, index) => `
	<div style="font-family:'Share Tech Mono',monospace;">
		<div style="font-size:0.58em;color:#7a3535;letter-spacing:0.15em;margin-bottom:4px;">
			OBJ-${String(index + 1).padStart(2, "0")} // CLASSIFIED
		</div>
		<div style="font-size:0.78em;font-weight:700;color:#e8b0b0;letter-spacing:0.06em;margin-bottom:5px;">
			${mark.name}
		</div>
		<div style="font-size:0.62em;color:#7a6060;line-height:1.5;border-top:1px solid rgba(120,50,50,0.3);padding-top:5px;">
			${mark.description || "No additional intel."}
		</div>
	</div>`;

const zonePopupHTML = (type) => {
	const cfg = ZONE_CONFIG[type];
	return `
	<div style="font-family:'Share Tech Mono',monospace;">
		<div style="font-size:0.58em;color:${cfg.color};letter-spacing:0.15em;margin-bottom:3px;opacity:0.6;">
			${type.toUpperCase()} // CONFIRMED
		</div>
		<div style="font-size:0.74em;font-weight:700;color:${cfg.color};letter-spacing:0.08em;">
			${cfg.label}
		</div>
	</div>`;
};

const addGridLabels = (map, bounds) => {
	const [[minY, minX], [maxY, maxX]] = bounds;
	const cols = 8;
	const rows = 6;
	const stepX = (maxX - minX) / cols;
	const stepY = (maxY - minY) / rows;

	for (let i = 0; i <= cols; i++) {
		const x = minX + i * stepX;
		L.marker([maxY, x], {
			icon: L.divIcon({
				className: "map-grid-label",
				html: String(Math.round(x)),
				iconAnchor: [14, -4],
			}),
			interactive: false,
		}).addTo(map);
	}

	for (let j = 0; j <= rows; j++) {
		const y = minY + j * stepY;
		L.marker([y, minX], {
			icon: L.divIcon({
				className: "map-grid-label",
				html: String(Math.round(y)),
				iconAnchor: [36, 6],
			}),
			interactive: false,
		}).addTo(map);
	}
};

const buildLegend = (hasInfil, hasExfil, hasRally) => {
	const control = L.control({ position: "bottomleft" });
	control.onAdd = () => {
		const div = L.DomUtil.create("div");
		const entries = [
			hasInfil &&
				`<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
				<div style="width:12px;height:12px;border-radius:50%;border:1.5px solid #C1FF72;background:rgba(193,255,114,0.15);flex-shrink:0;"></div>
				<span style="color:#7a9060;">INSERTION ZONE</span>
			</div>`,
			hasExfil &&
				`<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
				<div style="width:12px;height:12px;border-radius:50%;border:1.5px solid #4DA6FF;background:rgba(77,166,255,0.12);flex-shrink:0;"></div>
				<span style="color:#7a9060;">EXTRACTION ZONE</span>
			</div>`,
			hasRally &&
				`<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
				<div style="width:12px;height:12px;border-radius:50%;border:1.5px dashed #FFD966;background:rgba(255,217,102,0.1);flex-shrink:0;"></div>
				<span style="color:#7a9060;">RALLY ZONE</span>
			</div>`,
			`<div style="display:flex;align-items:center;gap:7px;">
				<div style="width:12px;height:12px;border-radius:2px;border:1.5px solid #FF4444;background:rgba(255,68,68,0.15);flex-shrink:0;transform:rotate(45deg);"></div>
				<span style="color:#7a9060;">OBJECTIVE</span>
			</div>`,
		]
			.filter(Boolean)
			.join("");

		div.innerHTML = `
			<div style="
				font-family:'Share Tech Mono',monospace;
				font-size:9.5px; letter-spacing:0.1em;
				background:rgba(8,10,6,0.92);
				border:1px solid rgba(74,90,40,0.35);
				border-top:2px solid rgba(143,184,64,0.4);
				padding:10px 12px; border-radius:1px;
				min-width:150px;
			">
				<div style="color:rgba(143,184,64,0.5);letter-spacing:0.18em;margin-bottom:8px;font-size:8.5px;">
					MAP LEGEND
				</div>
				${entries}
			</div>`;
		return div;
	};
	return control;
};

/* ════════════════════════════════════════════════════════ */
const NoneGeographicalMap = ({
	bounds,
	locationsInProvince,
	imgURL,
	infilPoint,
	exfilPoint,
	fallbackExfil,
}) => {
	const mapRef = useRef(null);
	const mapInst = useRef(null); // store the Leaflet instance so cleanup is reliable
	const coordsRef = useRef(null);

	useEffect(() => {
		if (!bounds || !imgURL || !Array.isArray(locationsInProvince)) {
			console.warn("Map Data is Invalid. Skipping Update.");
			return;
		}

		// Tear down any previous instance cleanly before building a new one
		if (mapInst.current) {
			try {
				// Stop any in-progress zoom animation before removing —
				// prevents "_leaflet_pos of undefined" when the transition
				// callback fires after the map DOM node is already gone.
				mapInst.current.stop();
				mapInst.current.remove();
			} catch (_) {
				/* already removed */
			}
			mapInst.current = null;
		}

		injectStyles();

		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: -1,
			crs: L.CRS.Simple,
			dragging: true,
			zoomControl: true,
			scrollWheelZoom: true,
			// Disable zoom animation — the animation is what races against unmount.
			// Without it the transition is instant so there's nothing in-flight
			// to hit a dead DOM node.
			zoomAnimation: false,
		});
		map.setMinZoom(-1);
		map.setMaxZoom(2);
		mapInst.current = map;

		/* ── Base image ── */
		const overlay = L.imageOverlay(imgURL, bounds, {
			className: "tac-map-img",
		}).addTo(map);

		overlay.on("load", () => {
			const el = overlay.getElement();
			if (el) {
				el.style.filter =
					"brightness(0.72) saturate(0.65) contrast(1.1) sepia(0.12)";
				el.style.transition = "filter 0.4s ease";
			}
		});

		/* ── Grid labels ── */
		addGridLabels(map, bounds);

		/* ── Objective markers ── */
		locationsInProvince.forEach((mark, i) => {
			if (!Array.isArray(mark.coordinates) || mark.coordinates.length !== 2)
				return;
			L.marker(mark.coordinates, { icon: buildObjIcon(i), interactive: true })
				.bindPopup(objPopupHTML(mark, i), {
					className: "tac-popup-obj",
					maxWidth: 220,
					offset: [0, -8],
				})
				.addTo(map);
		});

		/* ── Zone markers ── */
		const hasInfil = Array.isArray(infilPoint) && infilPoint.length === 2;
		const hasExfil = Array.isArray(exfilPoint) && exfilPoint.length === 2;
		const hasRally = Array.isArray(fallbackExfil) && fallbackExfil.length === 2;

		if (hasInfil)
			L.marker(infilPoint, { icon: buildZoneIcon("infil") })
				.bindPopup(zonePopupHTML("infil"), {
					className: "tac-popup",
					maxWidth: 180,
					offset: [0, -8],
				})
				.addTo(map);
		if (hasExfil)
			L.marker(exfilPoint, { icon: buildZoneIcon("exfil") })
				.bindPopup(zonePopupHTML("exfil"), {
					className: "tac-popup",
					maxWidth: 180,
					offset: [0, -8],
				})
				.addTo(map);
		if (hasRally)
			L.marker(fallbackExfil, { icon: buildZoneIcon("rally") })
				.bindPopup(zonePopupHTML("rally"), {
					className: "tac-popup",
					maxWidth: 180,
					offset: [0, -8],
				})
				.addTo(map);

		/* ── Legend ── */
		buildLegend(hasInfil, hasExfil, hasRally).addTo(map);

		/* ── Coordinates display ── */
		const coordControl = L.control({ position: "bottomright" });
		coordControl.onAdd = () => {
			const div = L.DomUtil.create("div", "coordinates-container");
			coordsRef.current = div;
			div.textContent = "0, 0";
			return div;
		};
		coordControl.addTo(map);
		map.on("mousemove", (e) => {
			if (coordsRef.current)
				coordsRef.current.textContent = `${e.latlng.lat.toFixed(0)}, ${e.latlng.lng.toFixed(0)}`;
		});

		map.setZoom(-1);

		return () => {
			coordsRef.current = null;
			if (mapInst.current) {
				try {
					mapInst.current.stop(); // cancel any in-flight animation
					mapInst.current.remove(); // destroy the instance + DOM listeners
				} catch (_) {
					/* already removed */
				}
				mapInst.current = null;
			}
		};
	}, [
		bounds,
		locationsInProvince,
		imgURL,
		infilPoint,
		exfilPoint,
		fallbackExfil,
	]);

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				background: "#050704",
				overflow: "hidden",
			}}>
			{/* Corner brackets */}
			{["tl", "tr", "bl", "br"].map((corner) => (
				<div
					key={corner}
					style={{
						position: "absolute",
						width: 28,
						height: 28,
						zIndex: 800,
						pointerEvents: "none",
						...(corner === "tl" ?
							{
								top: 8,
								left: 8,
								borderTop: "2px solid rgba(143,184,64,0.5)",
								borderLeft: "2px solid rgba(143,184,64,0.5)",
							}
						:	{}),
						...(corner === "tr" ?
							{
								top: 8,
								right: 8,
								borderTop: "2px solid rgba(143,184,64,0.5)",
								borderRight: "2px solid rgba(143,184,64,0.5)",
							}
						:	{}),
						...(corner === "bl" ?
							{
								bottom: 8,
								left: 8,
								borderBottom: "2px solid rgba(143,184,64,0.5)",
								borderLeft: "2px solid rgba(143,184,64,0.5)",
							}
						:	{}),
						...(corner === "br" ?
							{
								bottom: 8,
								right: 8,
								borderBottom: "2px solid rgba(143,184,64,0.5)",
								borderRight: "2px solid rgba(143,184,64,0.5)",
							}
						:	{}),
					}}
				/>
			))}

			{/* Vignette */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					zIndex: 700,
					background:
						"radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)",
					pointerEvents: "none",
				}}
			/>

			{/* Leaflet mount point */}
			<div
				ref={mapRef}
				style={{ width: "100%", height: "100%", background: "#050704" }}
			/>
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
};

export default NoneGeographicalMap;
