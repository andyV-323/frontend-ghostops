import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.js";
import { PROVINCES } from "@/config";
import { useTeamsStore } from "@/zustand";

const AuroraMap = ({ selectedAOs = [], currentTeamAO = null }) => {
	const mapRef = useRef(null);
	const markersRef = useRef([]);
	const mapInstanceRef = useRef(null);
	const bounds = [
		[0, 0],
		[768, 1366],
	];

	const { teams } = useTeamsStore();

	// Get the current team's name for exact matching
	const currentTeamName = useMemo(() => {
		const team = teams.find((t) => t.AO === currentTeamAO);
		return team ? team.name : null;
	}, [teams, currentTeamAO]);

	// Group teams by their AO
	const teamsByAO = useMemo(() => {
		const grouped = {};
		teams.forEach((team) => {
			if (team.AO) {
				if (!grouped[team.AO]) {
					grouped[team.AO] = [];
				}
				grouped[team.AO].push(team.name);
			}
		});
		return grouped;
	}, [teams]);

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

	// Update markers when selectedAOs or teamsByAO changes
	useEffect(() => {
		if (!mapInstanceRef.current) return;

		const addAOMarkers = () => {
			// Clear existing markers
			markersRef.current.forEach((marker) =>
				mapInstanceRef.current.removeLayer(marker),
			);
			markersRef.current = [];

			// First, add labels for ALL AOs (not just selected ones)
			Object.entries(PROVINCES).forEach(([aoKey, province]) => {
				if (!province.AOO) return;

				// Create a simple text label for the AO
				const aoLabelIcon = L.divIcon({
					className: "ao-label",
					html: `
						<div style="
						
							font-weight: bold;
							color: white;
							font-size: 10px;
							white-space: nowrap;
							pointer-events: none;
						">${aoKey}</div>
					`,
					iconSize: [40, 16],
					iconAnchor: [20, -5], // Position label above the point
				});

				const labelMarker = L.marker([province.AOO[0], province.AOO[1]], {
					icon: aoLabelIcon,
					interactive: false, // Labels don't respond to clicks
				}).addTo(mapInstanceRef.current);

				markersRef.current.push(labelMarker);
			});

			// Then add team markers for selected AOs
			selectedAOs.forEach((aoKey) => {
				const province = PROVINCES[aoKey];
				if (!province || !province.AOO) return;

				const teamsInAO = teamsByAO[aoKey] || [];

				// If multiple teams in same AO, create offset markers
				if (teamsInAO.length > 1) {
					// Calculate offset positions in a circle around the main AO point
					const radius = 30; // Distance from center point
					const angleStep = (2 * Math.PI) / teamsInAO.length;

					teamsInAO.forEach((teamName, index) => {
						const angle = angleStep * index;
						const offsetLat = province.AOO[0] + radius * Math.cos(angle);
						const offsetLng = province.AOO[1] + radius * Math.sin(angle);

						// Check if THIS SPECIFIC TEAM is the current team
						const isCurrentTeam = teamName === currentTeamName;
						const markerColor =
							isCurrentTeam ?
								"rgba(59, 130, 246, 0.8)"
							:	"rgba(169, 186, 180, 0.53)";
						const borderColor = isCurrentTeam ? "#2563eb" : "#000000ff";
						const borderWidth = isCurrentTeam ? "3px" : "2px";

						const markerIcon = L.divIcon({
							className: "ao-marker",
							html: `
								<div style="
									background: ${markerColor};
									border: ${borderWidth} solid ${borderColor};
									border-radius: 50%;
									width: 50px;
									height: 50px;
									display: flex;
									align-items: center;
									justify-content: center;
									font-weight: bold;
									color: white;
									font-size: 10px;
									box-shadow: 0 2px 4px rgba(0,0,0,0.5);
									text-align: center;
									padding: 2px;
								">${teamName}</div>
							`,
							iconSize: [50, 50],
							iconAnchor: [25, 25],
						});

						const marker = L.marker([offsetLat, offsetLng], {
							icon: markerIcon,
						}).addTo(mapInstanceRef.current).bindPopup(`
							<div style="color: black; font-weight: bold;">
								<strong>Area of Operations: ${aoKey}</strong><br>
								<strong>Team: ${teamName}</strong>${isCurrentTeam ? ' <span style="color: #2563eb;">(Current)</span>' : ""}<br/>
								<em>${province.biome}</em><br>
							</div>
						`);

						markersRef.current.push(marker);
					});
				} else {
					// Single team - use original marker placement
					const teamName = teamsInAO[0] || "No Team Assigned";

					// Check if THIS SPECIFIC TEAM is the current team
					const isCurrentTeam = teamName === currentTeamName;
					const markerColor =
						isCurrentTeam ?
							"rgba(59, 130, 246, 0.8)"
						:	"rgba(169, 186, 180, 0.53)";
					const borderColor = isCurrentTeam ? "#2563eb" : "#000000ff";
					const borderWidth = isCurrentTeam ? "3px" : "2px";

					const aoIcon = L.divIcon({
						className: "ao-marker",
						html: `
							<div style="
								background: ${markerColor};
								border: ${borderWidth} solid ${borderColor};
								border-radius: 50%;
								width: 60px;
								height: 60px;
								display: flex;
								align-items: center;
								justify-content: center;
								font-weight: bold;
								color: white;
								font-size: 11px;
								box-shadow: 0 2px 4px rgba(0,0,0,0.5);
								text-align: center;
								padding: 4px;
							">${teamName}</div>
						`,
						iconSize: [60, 60],
						iconAnchor: [30, 30],
					});

					const aoMarker = L.marker([province.AOO[0], province.AOO[1]], {
						icon: aoIcon,
					}).addTo(mapInstanceRef.current).bindPopup(`
						<div style="color: black; font-weight: bold;">
							<strong>Area of Operations: ${aoKey}</strong><br>
							<strong>Team: ${teamName}</strong>${isCurrentTeam ? ' <span style="color: #2563eb;">(Current)</span>' : ""}<br/>
							<em>${province.biome}</em><br>
						</div>
					`);

					markersRef.current.push(aoMarker);
				}
			});
		};

		addAOMarkers();
	}, [selectedAOs, teamsByAO, currentTeamName]);

	return (
		<div className='map w-full'>
			<div
				ref={mapRef}
				id='leaflet-map'
				style={{
					width: "100%",
					height: "clamp(250px, 40vw, 500px)",
					background: "black",
				}}
			/>
		</div>
	);
};

export default AuroraMap;
