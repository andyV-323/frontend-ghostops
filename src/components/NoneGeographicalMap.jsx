import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PropTypes from "prop-types";
import "@fortawesome/fontawesome-free/css/all.min.css";

const NoneGeographicalMap = ({
	bounds,
	locationsInProvince,
	imgURL,
	infilPoint,
	exfilPoint,
	fallbackExfil,
}) => {
	const mapRef = useRef(null);
	const coordinatesRef = useRef(null);

	useEffect(() => {
		if (!bounds || !imgURL || !Array.isArray(locationsInProvince)) {
			console.warn("Map Data is Invalid. Skipping Update.");
			return;
		}

		// Remove existing map instance if it exists
		if (mapRef.current && mapRef.current._leaflet_id) {
			mapRef.current.remove();
		}

		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: -1,
			crs: L.CRS.Simple,
			dragging: true,
			zoomControl: false,
			scrollWheelZoom: false,
		});
		map.setMinZoom(map.getZoom());
		map.setMaxZoom(map.getZoom());
		L.imageOverlay(imgURL, bounds).addTo(map);

		locationsInProvince.forEach((mark) => {
			// Ensure coordinates exist
			if (!Array.isArray(mark.coordinates) || mark.coordinates.length !== 2) {
				console.warn("⚠️ Skipping invalid location:", mark);
				return;
			}

			// Add circle markers
			L.circleMarker(mark.coordinates, {
				radius: 50,
				fillColor: "#50665a",
				color: "red",
				weight: 5,
				opacity: 1,
				fillOpacity: 0.3,
			})
				.bindPopup(`<b>${mark.name}</b><br>${mark.description}.`, {
					maxWidth: 200,
					className: "custom-popup",
				})
				.addTo(map);
		});

		// Add Infil Point Marker
		if (Array.isArray(infilPoint) && infilPoint.length === 2) {
			/*const infilIcon = L.divIcon({
				className: "custom-marker",
				//html: '<i class="fas fa-plane-arrival fa-4x" style="color:#C1FF72;"></i>',
				iconUrl: "/icons/INSERTION.png",
				shadowUrl: "/icons/INSERT_SHADOW.png",
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});*/
			const infilIcon = L.icon({
				iconUrl: "/icons/INSERTION.png", // Ensure the path is correct
				shadowUrl: "/icons/INSERT_SHADOW.png", // Optional, can be removed if not needed
				iconSize: [150, 150], // Size of the icon
				shadowSize: [142, 122],
				shadowAnchor: [40, 102],
				iconAnchor: [0, 150], // Anchor point
			});

			L.marker(infilPoint, { icon: infilIcon })
				.bindPopup("<b>Infil Point</b>", { maxWidth: 200 })
				.addTo(map);
		}

		// Add Exfil Point Marker
		if (Array.isArray(exfilPoint) && exfilPoint.length === 2) {
			/*const exfilIcon = L.divIcon({
				className: "custom-marker",
				html: '<i class="fas fa-helicopter fa-4x" style="color: red;"></i>',
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});*/
			const exfilIcon = L.icon({
				iconUrl: "/icons/EXTRACTION.png", // Ensure the path is correct
				shadowUrl: "/icons/EXTRA_SHADOW.png", // Optional, can be removed if not needed
				iconSize: [150, 150], // Size of the icon
				shadowSize: [142, 122],
				shadowAnchor: [40, 102],
				iconAnchor: [0, 150], // Anchor point
			});
			L.marker(exfilPoint, { icon: exfilIcon })
				.bindPopup("<b>Exfil Point</b>", { maxWidth: 200 })
				.addTo(map);
		}

		// Add Fallback Exfil Marker
		if (Array.isArray(fallbackExfil) && fallbackExfil.length === 2) {
			/*const fallbackIcon = L.divIcon({
				className: "custom-marker",
				html: '<i class="fas fa-triangle-exclamation fa-4x" style="color: yellow;"></i>',
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});*/
			const fallbackIcon = L.icon({
				iconUrl: "/icons/Rallypoint.png", // Ensure the path is correct
				shadowUrl: "/icons/Rally_shadow.png", // Optional, can be removed if not needed
				iconSize: [150, 150], // Size of the icon
				shadowSize: [142, 122],
				shadowAnchor: [40, 102],
				iconAnchor: [0, 150], // Anchor point
			});

			L.marker(fallbackExfil, { icon: fallbackIcon })
				.bindPopup("<b>Fallback Exfil Point</b>", { maxWidth: 200 })
				.addTo(map);
		}

		// Draw Path from Infil - Mission - Exfil - Fallback
		if (
			Array.isArray(infilPoint) &&
			Array.isArray(exfilPoint) &&
			Array.isArray(fallbackExfil) &&
			locationsInProvince.length > 0
		) {
			if (
				Array.isArray(infilPoint) &&
				Array.isArray(exfilPoint) &&
				Array.isArray(fallbackExfil) &&
				locationsInProvince.length > 0
			) {
				const locCoords = locationsInProvince.map((loc) => loc.coordinates);

				// 1️⃣ Insertion Path (Solid Red) - From Infil Point to First Location
				L.polyline([infilPoint, locCoords[0]], {
					color: "red",
					weight: 4,
					opacity: 1,
				})
					.bindPopup("Insertion Path")
					.addTo(map);

				// 2️⃣ Mission Path (Dashed Red) - Between Locations
				L.polyline(locCoords, {
					color: "red",
					weight: 4,
					opacity: 1,
					dashArray: "10, 10", // Dashed line
				})
					.bindPopup("Mission Path")
					.addTo(map);

				// 3️⃣ Extraction Path (Solid Green) - From Last Location to Exfil
				L.polyline([locCoords[locCoords.length - 1], exfilPoint], {
					color: "blue",
					weight: 4,
					opacity: 1,
				})
					.bindPopup("Extraction Path")
					.addTo(map);

				// 4️⃣ Fallback Path (Dashed Yellow) - From Last Location to Fallback Exfil
				L.polyline([locCoords[locCoords.length - 1], fallbackExfil], {
					color: "yellow",
					weight: 4,
					opacity: 1,
					dashArray: "10, 10", // Dashed line
				})
					.bindPopup("Fallback Extraction Path")
					.addTo(map);
			}
		}

		const coordinatesControl = L.control({
			position: "bottomright",
		});

		coordinatesControl.onAdd = () => {
			const container = L.DomUtil.create("div", "coordinates-container");
			coordinatesRef.current = container;
			return container;
		};

		coordinatesControl.updateCoordinates = (latlng) => {
			if (coordinatesRef.current) {
				coordinatesRef.current.textContent = `Latitude: ${latlng.lat.toFixed(
					0
				)}, Longitude: ${latlng.lng.toFixed(0)}`;
			}
		};

		coordinatesControl.addTo(map);

		map.on("mousemove", (e) => {
			coordinatesControl.updateCoordinates(e.latlng);
		});

		return () => {
			map.remove();
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
		<div className='flex flex-col items-center'>
			<div
				ref={mapRef}
				id='leaflet-map'
				style={{
					background: "black",
					width: "1300px",
					height: "700px",
				}}></div>
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
		})
	),
	imgURL: PropTypes.string.isRequired,
	infilPoint: PropTypes.array,
	exfilPoint: PropTypes.array,
	fallbackExfil: PropTypes.array,
};

export default NoneGeographicalMap;
