import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.js";
import { PROVINCES } from "@/config";
import { useTeamsStore } from "@/zustand";

const AuroraMap = ({ selectedAOs = [] }) => {
	const mapRef = useRef(null);

	const markersRef = useRef([]);
	const mapInstanceRef = useRef(null);
	const bounds = [
		[0, 0],
		[768, 1366],
	];

	const { teams } = useTeamsStore();

	// Memoize the team-AO mapping to prevent infinite re-renders
	const teamAOMap = useMemo(() => {
		const map = {};
		teams.forEach((team) => {
			if (team.AO) {
				map[team.AO] = team.name;
			}
		});
		return map;
	}, [teams]);

	// Function to get team name by AO
	const getTeamNameByAO = (aoKey) => {
		return teamAOMap[aoKey] || "No Team Assigned";
	};

	// Initialize map once
	useEffect(() => {
		if (!bounds || mapInstanceRef.current) {
			return;
		}

		const map = L.map(mapRef.current, {
			center: [bounds[1][0] / 2, bounds[1][1] / 2],
			zoom: -1,
			crs: L.CRS.Simple,
			dragging: true,
			zoomControl: true,
			scrollWheelZoom: true,
		});

		mapInstanceRef.current = map;

		map.setMinZoom(-1);
		map.setMaxZoom(1);
		map.setZoom(-1);

		L.imageOverlay("/maps/AuroaMap.png", bounds).addTo(map);

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, []);

	// Update markers when selectedAOs or teamAOMap changes
	useEffect(() => {
		if (!mapInstanceRef.current) return;

		const addAOMarkers = () => {
			// Clear existing markers
			markersRef.current.forEach((marker) =>
				mapInstanceRef.current.removeLayer(marker)
			);
			markersRef.current = [];

			selectedAOs.forEach((aoKey) => {
				const province = PROVINCES[aoKey];
				if (!province) return;

				// Add AO marker only
				if (province.AOO) {
					const teamName = getTeamNameByAO(aoKey);
					// Create custom marker icon for AO only
					const aoIcon = L.divIcon({
						className: "ao-marker",
						html: `
          <div style="
            background:rgba(169, 186, 180, 0.53);
            border: 1px solid #000000ff;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          ">${teamName}</div>
        `,
						iconSize: [24, 24],
						iconAnchor: [12, 12],
					});
					const aoMarker = L.marker([province.AOO[0], province.AOO[1]], {
						icon: aoIcon,
					}).addTo(mapInstanceRef.current).bindPopup(`
              <div style="color: black; font-weight: bold;">
                <strong>Area of Operations: ${aoKey}</strong><br>
                <strong>Team: ${teamName}</strong><br/>
                <em>${province.biome}</em><br>
              </div>
            `);
					markersRef.current.push(aoMarker);
				}
			});
		};

		addAOMarkers();
	}, [selectedAOs, teamAOMap, getTeamNameByAO]);

	return (
		<div className='map'>
			<div
				ref={mapRef}
				id='leaflet-map'
				style={{
					width: "700px",
					height: "450px",
					background: "black",
				}}
			/>
		</div>
	);
};

export default AuroraMap;
