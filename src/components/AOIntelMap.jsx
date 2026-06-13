import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import { PROVINCE_LOC_CONFIG, getProvinceLocType } from "@/utils/locationTypes";

/* ─────────────────────────────────────────────────────────
   AO INTEL MAP  —  Satellite image + location markers only
───────────────────────────────────────────────────────── */

const injectStyles = () => {
	if (document.getElementById("ao-intel-map-style")) return;
	const style = document.createElement("style");
	style.id = "ao-intel-map-style";
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
		.ao-loc-marker {
			transition: transform 0.12s ease, box-shadow 0.12s ease;
			cursor: pointer !important;
		}
		.ao-loc-marker:hover {
			transform: scale(1.4) !important;
		}
		.leaflet-div-icon {
			background: transparent !important;
			border: none !important;
		}
	`;
	document.head.appendChild(style);
};

const AOIntelMap = ({ bounds, imgURL, locations, onLocationSelect }) => {
	const mapRef = useRef(null);
	const mapInst = useRef(null);
	const onSelectRef = useRef(onLocationSelect);

	useEffect(() => {
		onSelectRef.current = onLocationSelect;
	}, [onLocationSelect]);

	useEffect(() => {
		if (!bounds || !imgURL) return;

		if (mapInst.current) {
			try { mapInst.current.stop(); mapInst.current.remove(); } catch { /* removed */ }
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

		/* ── Satellite image ── */
		const overlay = L.imageOverlay(imgURL, bounds, {}).addTo(map);
		overlay.on("load", () => {
			const el = overlay.getElement();
			if (el) {
				el.style.filter = "brightness(0.62) saturate(0.52) contrast(1.18) sepia(0.08)";
				el.style.transition = "filter 0.4s ease";
			}
		});

		/* ── Location markers ── */
		(locations || []).forEach((loc) => {
			const type = getProvinceLocType(loc.name, loc.description);
			const config = PROVINCE_LOC_CONFIG[type] || PROVINCE_LOC_CONFIG.poi;
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
							border:1px solid ${config.color}80;
							display:flex;align-items:center;justify-content:center;
							font-size:${Math.round(size * 0.58)}px;
							color:${config.color};
							border-radius:2px;
							box-shadow:0 0 10px ${config.color}30,inset 0 0 4px ${config.color}15;
							font-family:'Share Tech Mono',monospace;
						">${config.symbol}</div>`,
				}),
			}).addTo(map);

			marker.on("click", () => {
				onSelectRef.current?.({ ...loc, type, locConfig: config });
			});
		});

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
				try { mapInst.current.stop(); mapInst.current.remove(); } catch { /* removed */ }
				mapInst.current = null;
			}
		};
	}, [bounds, imgURL, locations]);

	return (
		<div style={{ position: "relative", width: "100%", height: "100%", background: "#050704", overflow: "hidden" }}>
			<div ref={mapRef} style={{ width: "100%", height: "100%", background: "#050704" }} />
		</div>
	);
};

AOIntelMap.propTypes = {
	bounds: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
	imgURL: PropTypes.string.isRequired,
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
