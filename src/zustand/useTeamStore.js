import { create } from "zustand";

import {
	TeamsApi,
	OperatorsApi,
	InfirmaryApi,
	MemorialApi,
	VehicleAPI,
} from "../api";
import { INJURIES } from "../config";
import useInfirmaryStore from "./useInfirmaryStore";
import useMemorialStore from "./useMemorialStore";
import useOperatorsStore from "./useOperatorStore";

import { toast } from "react-toastify";
const useTeamsStore = create((set, get) => ({
	teams: [],
	team: null,
	operators: [],
	loading: false,
	allOperators: [],
	aiTeam: [],
	selectedTeamType: "",
	missionDescription: "",
	teamName: "",
	fullOperatorList: [],
	assets: [],
	allVehicles: [],
	fullVehicleList: [],

	// Fetch all teams
	fetchTeams: async () => {
		set({ loading: true });
		try {
			const teamsData = await TeamsApi.getTeams();
			const filteredTeams = teamsData.map((team) => ({
				...team,
				operators: team.operators.filter(
					(op) => op.status !== "Injured" && op.status !== "KIA",
				),
			}));
			set({ teams: filteredTeams });
			await get().fetchVehiclesForTeams();
		} catch (error) {
			console.error("ERROR fetching teams:", error);
		} finally {
			set({ loading: false });
		}
	},
	fetchVehiclesForTeams: async () => {
		try {
			const all = await VehicleAPI.getVehicles();
			set({ fullVehicleList: all });

			const teams = get().teams || [];
			const assignedIds = new Set(
				teams.flatMap((t) =>
					(t.assets || []).map((v) => (typeof v === "object" ? v._id : v)),
				),
			);

			const available = all.filter((v) => !assignedIds.has(v._id));
			set({ allVehicles: available });
		} catch (error) {
			console.error("ERROR fetching vehicles for teams:", error);
			set({ allVehicles: [], fullVehicleList: [] });
		}
	},

	fetchTeamById: async (teamId) => {
		try {
			const response = await TeamsApi.getTeamById(teamId);

			// The API returns { data: { data: actualTeamData } }
			let teamData = null;

			if (response.data && response.data.data) {
				teamData = response.data.data;
			} else if (response.data) {
				teamData = response.data;
			} else {
				teamData = response;
			}

			if (!teamData || !teamData._id) {
				return;
			}

			let operatorIds = [];
			if (teamData.operators && Array.isArray(teamData.operators)) {
				operatorIds = teamData.operators.map((op) => {
					// If operator is an object with _id, extract the _id
					if (typeof op === "object" && op._id) {
						return op._id;
					}
					// If operator is already a string ID, use it directly
					return op;
				});
			}

			let assetIds = [];
			if (teamData.assets && Array.isArray(teamData.assets)) {
				assetIds = teamData.assets.map((v) =>
					typeof v === "object" && v._id ? v._id : v,
				);
			}

			const stateUpdate = {
				team: {
					_id: teamData._id,
					createdBy: teamData.createdBy || "",
					name: teamData.name || "",
					operators: operatorIds,
					assets: assetIds,
				},
				teamName: teamData.name || "",
				operators: operatorIds,
				assets: assetIds,
			};

			set(stateUpdate);

			// Verify state was set correctly
			setTimeout(() => {
				const currentState = get();
				console.log("Verified teamName:", currentState.teamName);
				console.log("Verified operators:", currentState.operators);
			}, 100);
		} catch (error) {
			console.error("ERROR fetching team:", error);
			console.error("Error message:", error.message);
			console.error("Error response:", error.response?.data);
			set({ team: null });
		}
	},

	// Set team name
	setTeamName: (name) => set({ teamName: name }),

	updateTeam: async (teamData) => {
		try {
			if (!teamData._id) {
				console.error("ERROR: Missing team ID");

				return;
			}

			await TeamsApi.updateTeam(teamData._id, {
				createdBy: teamData.createdBy,
				name: teamData.name,
				operators: teamData.operators,
				assets: teamData.assets,
			});

			toast.success("Team updated successfully!");
		} catch (error) {
			console.error(
				"ERROR updating team:",
				error.response?.data || error.message,
			);
			toast.error("Failed to update team.");
		}
	},
	fetchOperators: async () => {
		try {
			const data = await OperatorsApi.getOperators();

			// Save the full list of operators for rendering names
			set({ fullOperatorList: data });

			// Show ALL active operators in dropdown (including those in teams)
			// This allows users to transfer operators between teams
			const availableOperators = data.filter((op) => op.status === "Active");

			set({ allOperators: availableOperators });
		} catch (error) {
			console.error("ERROR fetching operators:", error);
			set({ allOperators: [], fullOperatorList: [] });
		}
	},

	addOperatorToTeam: async (operatorId, targetTeamId) => {
		try {
			const { teams, fullOperatorList } = get();

			// Find the target team
			const targetTeam = teams.find((team) => team._id === targetTeamId);
			if (!targetTeam) {
				toast.error("Target team not found");
				return;
			}

			// Check if operator is already in the target team
			const operatorAlreadyInTarget = targetTeam.operators.some(
				(op) => op._id === operatorId,
			);
			if (operatorAlreadyInTarget) {
				toast.warning("Operator is already in this team");
				return;
			}

			// Find if operator is currently in another team
			const sourceTeam = teams.find(
				(team) =>
					team._id !== targetTeamId &&
					team.operators.some((op) => op._id === operatorId),
			);

			// Get the operator details
			const operatorToMove = fullOperatorList.find(
				(op) => op._id === operatorId,
			);
			if (!operatorToMove) {
				toast.error("Operator not found");
				return;
			}

			// Optimistic update - update UI immediately
			set((state) => ({
				teams: state.teams.map((team) => {
					// Remove operator from source team (if exists)
					if (sourceTeam && team._id === sourceTeam._id) {
						return {
							...team,
							operators: team.operators.filter((op) => op._id !== operatorId),
						};
					}
					// Add operator to target team
					if (team._id === targetTeamId) {
						return {
							...team,
							operators: [...team.operators, operatorToMove],
						};
					}
					return team;
				}),
			}));

			// Update target team on server
			const updatedTargetOperatorIds = [
				...targetTeam.operators.map((op) => op._id),
				operatorId,
			];
			await TeamsApi.updateTeam(targetTeamId, {
				name: targetTeam.name,
				operators: updatedTargetOperatorIds,
			});

			// Update source team on server (if operator was in another team)
			if (sourceTeam) {
				const updatedSourceOperatorIds = sourceTeam.operators
					.filter((op) => op._id !== operatorId)
					.map((op) => op._id);

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
					operators: updatedSourceOperatorIds,
				});

				toast.success(
					`${operatorToMove.callSign} transferred from ${sourceTeam.name} to ${targetTeam.name}!`,
				);
			} else {
				toast.success(
					`${operatorToMove.callSign} added to ${targetTeam.name}!`,
				);
			}

			// Refresh operators list to update availability
			await get().fetchOperators();
		} catch (error) {
			console.error("ERROR adding/transferring operator:", error);
			toast.error("Failed to transfer operator");

			// Revert optimistic update on error
			get().fetchTeams();
		}
	},

	// Also update your existing addOperator function to be more clear about its purpose
	// This one is for the form state (EditTeamForm)
	addOperator: (operatorId) => {
		const { operators } = get();
		if (!operators.includes(operatorId)) {
			set({ operators: [...operators, operatorId] });
		}
	},

	// Remove operator from the team
	removeOperator: (operatorId) => {
		set({ operators: get().operators.filter((id) => id !== operatorId) });
	},

	// ─────────────────────────────────────────────────────────────────────────────

	generateAITeam: async () => {
		set({ loading: true });
		try {
			const { selectedTeamType, missionDescription, allOperators } = get();

			if (!selectedTeamType && !missionDescription.trim()) {
				toast.warn("Select a team type or describe the mission.");
				return;
			}

			const key = import.meta.env.VITE_GROQ_KEY;
			if (!key) throw new Error("VITE_GROQ_KEY is not set");

			// ── Build full operator context ─────────────────────────────────────
			// Keep payload slim to avoid truncation — only what the AI needs to decide
			const operatorContext = allOperators.map((op) => ({
				id: op._id,
				callSign: op.callSign,
				class: op.class || "",
				role: op.role || "",
				weaponType: op.weaponType || "",
				support: !!op.support,
				aviator: !!op.aviator,
			}));

			// ── System prompt ───────────────────────────────────────────────────
			const system = `You are a Ghost Recon special operations team commander selecting operators for a mission. \
You will receive a list of available operators with their class, role, weapon type, perks, and special flags. \
Select the best 2–4 operators for the given mission type or description. \
Respond ONLY with a valid JSON array. No markdown, no explanation outside the JSON. \
Each element must have exactly these fields: id (string), callSign (string), justification (string — one tactical sentence explaining why this operator fits). \
Example: [{"id":"abc123","callSign":"NOMAD","justification":"Assault class with silenced SMG loadout ideal for close-quarters direct action."}]`;

			// ── User prompt ─────────────────────────────────────────────────────
			const missionContext = [
				selectedTeamType ? `Team type: ${selectedTeamType}` : null,
				missionDescription?.trim() ? `Mission: ${missionDescription}` : null,
			]
				.filter(Boolean)
				.join("\n");

			const user = `${missionContext}

Available operators:
${JSON.stringify(operatorContext, null, 2)}

Select the best 2–4 operators. Return only the JSON array.`;

			// ── Groq call ───────────────────────────────────────────────────────
			const response = await fetch(
				"https://api.groq.com/openai/v1/chat/completions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${key}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: "llama-3.3-70b-versatile",
						max_tokens: 800,
						temperature: 0.5,
						messages: [
							{ role: "system", content: system },
							{ role: "user", content: user },
						],
					}),
				},
			);

			if (!response.ok) {
				const err = await response.text();
				throw new Error(`Groq ${response.status}: ${err}`);
			}

			const data = await response.json();
			const raw = data.choices?.[0]?.message?.content ?? "";

			// ── Parse JSON — robustly extract array from anywhere in the response
			// Model sometimes wraps in markdown, adds preamble, or truncates
			let parsed;
			try {
				// First try: strip fences and parse directly
				const clean = raw.replace(/```json|```/gi, "").trim();
				parsed = JSON.parse(clean);
			} catch {
				// Second try: extract just the [...] portion with regex
				const match = raw.match(/\[\s*\{[\s\S]*?\}\s*\]/);
				if (!match)
					throw new Error("Could not extract JSON array from AI response.");
				parsed = JSON.parse(match[0]);
			}

			if (!Array.isArray(parsed) || parsed.length === 0) {
				throw new Error("AI returned empty or invalid team.");
			}

			// ── Match back to full operator objects, attach justification ───────
			const suggested = parsed
				.map((item) => {
					const op = allOperators.find(
						(o) => o._id === item.id || o.callSign === item.callSign,
					);
					if (!op) return null;
					return { ...op, justification: item.justification || "" };
				})
				.filter(Boolean);

			if (suggested.length === 0) {
				throw new Error("AI suggested operators not found in roster.");
			}

			set({
				aiTeam: suggested,
				operators: suggested.map((op) => op._id),
			});

			toast.success(
				`AI selected ${suggested.length} operator${suggested.length > 1 ? "s" : ""}.`,
			);
		} catch (error) {
			console.error("ERROR generating AI team:", error);
			toast.error(error.message || "Failed to generate team.");
		} finally {
			set({ loading: false });
		}
	},
	// Create a new team
	createTeam: async (teamData) => {
		try {
			if (
				!teamData.createdBy ||
				!teamData.name ||
				teamData.operators.length === 0
			) {
				toast.warn("Please fill in all required fields before submitting.");
				return;
			}

			await TeamsApi.createTeam(teamData);
			toast.success("Team created successfully!");
			get().fetchTeams();
		} catch (error) {
			console.error(
				"ERROR creating team:",
				error.response?.data || error.message,
			);
			alert("Failed to create team. Check console for details.");
		}
	},

	// Assign a random injury to an operator
	assignRandomInjury: async (operatorId, userId) => {
		const injury = INJURIES[Math.floor(Math.random() * INJURIES.length)];
		const status = injury.recoveryHours === "KIA" ? "KIA" : "Injured";

		const infirmaryEntry = {
			createdBy: userId,
			operator: operatorId,
			injuryType: injury.injury,
			recoveryHours: status === "KIA" ? 0 : injury.recoveryHours,
			injuredAt: new Date(),
		};

		const memorialEntry = {
			createdBy: userId,
			operator: operatorId,
			name: injury.injury,
			dateOfDeath: new Date(),
		};

		try {
			await OperatorsApi.updateOperatorStatus(operatorId, status);
			await TeamsApi.removeOperatorFromTeams(operatorId);

			if (status === "Injured") {
				await InfirmaryApi.addInfirmaryEntry(infirmaryEntry);
				toast.info("Operator was wounded in action");
				useInfirmaryStore.getState().addInjuredOperator(infirmaryEntry);
			} else if (status === "KIA") {
				await MemorialApi.addMemorialEntry(memorialEntry);
				toast.info("Operator was killed in action");
				useMemorialStore.getState().addKIAOperator(memorialEntry);
			}

			get().fetchTeams();
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR processing injury:", error);
		}
	},

	assignRandomKIAInjury: async (operatorId, userId) => {
		// Filter to only get KIA injuries
		const kiaInjuries = INJURIES.filter(
			(injury) => injury.recoveryHours === "KIA",
		);

		const injury = kiaInjuries[Math.floor(Math.random() * kiaInjuries.length)];

		const status = "KIA";

		// Get the full operator data before creating memorial entry
		const state = get();
		let operator = null;

		if (state.allOperators && state.allOperators.length > 0) {
			operator = state.allOperators.find((op) => op._id === operatorId);
		}

		if (!operator && state.teams) {
			for (const team of state.teams) {
				if (team.operators) {
					operator = team.operators.find((op) => op._id === operatorId);
					if (operator) break;
				}
			}
		}

		const memorialEntry = {
			createdBy: userId,
			operator: operator || {
				_id: operatorId,
				callSign: "Unknown Operator",
				image: "/ghost/Default.png",
			},
			name: injury.injury,
			dateOfDeath: new Date(),
		};

		try {
			await OperatorsApi.updateOperatorStatus(operatorId, status);
			await TeamsApi.removeOperatorFromTeams(operatorId);

			await MemorialApi.addMemorialEntry(memorialEntry);
			toast.info("Operator was killed in action");
			useMemorialStore.getState().addKIAOperator(memorialEntry);

			state.fetchTeams();
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR processing injury:", error);
		}
	},

	assignUnknownFate: async (operatorId, userId) => {
		const roll = Math.random();

		// 30% chance of survival — tune this number
		if (roll < 0.3) {
			toast.success("Operator extracted safe — no injuries sustained");
			return; // Nothing happens, operator stays Active and on team
		}

		// Otherwise fall through to full injury pool including KIA
		const injury = INJURIES[Math.floor(Math.random() * INJURIES.length)];
		const status = injury.recoveryHours === "KIA" ? "KIA" : "Injured";

		const infirmaryEntry = {
			createdBy: userId,
			operator: operatorId,
			injuryType: injury.injury,
			recoveryHours: status === "KIA" ? 0 : injury.recoveryHours,
			injuredAt: new Date(),
		};

		const memorialEntry = {
			createdBy: userId,
			operator: operatorId,
			name: injury.injury,
			dateOfDeath: new Date(),
		};

		try {
			await OperatorsApi.updateOperatorStatus(operatorId, status);
			await TeamsApi.removeOperatorFromTeams(operatorId);

			if (status === "Injured") {
				await InfirmaryApi.addInfirmaryEntry(infirmaryEntry);
				toast.info("Operator was wounded in action");
				useInfirmaryStore.getState().addInjuredOperator(infirmaryEntry);
			} else if (status === "KIA") {
				await MemorialApi.addMemorialEntry(memorialEntry);
				toast.info("Operator was killed in action");
				useMemorialStore.getState().addKIAOperator(memorialEntry);
			}

			get().fetchTeams();
			useOperatorsStore.getState().fetchOperators();
		} catch (error) {
			console.error("ERROR processing unknown fate:", error);
		}
	},

	// Transfer operator between teams via drag and drop
	transferOperator: async (operatorId, sourceTeamId, targetTeamId) => {
		try {
			// Store the original state for potential rollback
			const originalTeams = get().teams;

			// Find the operator to transfer from the current state
			const sourceTeam = originalTeams.find(
				(team) => team._id === sourceTeamId,
			);
			const operatorToTransfer = sourceTeam?.operators.find(
				(op) => op._id === operatorId,
			);

			if (!operatorToTransfer) {
				toast.error("Operator not found");
				return;
			}

			// Optimistic update - update UI immediately
			set((state) => ({
				teams: state.teams.map((team) => {
					if (team._id === sourceTeamId) {
						// Remove operator from source team
						return {
							...team,
							operators: team.operators.filter((op) => op._id !== operatorId),
						};
					}
					if (team._id === targetTeamId) {
						// Check if operator is already in target team
						const operatorExists = team.operators.some(
							(op) => op._id === operatorId,
						);
						if (!operatorExists) {
							// Add operator to target team
							return {
								...team,
								operators: [...team.operators, operatorToTransfer],
							};
						}
					}
					return team;
				}),
			}));

			// Get the updated teams state for API calls
			const currentState = get();
			const updatedSourceTeam = currentState.teams.find(
				(team) => team._id === sourceTeamId,
			);
			const updatedTargetTeam = currentState.teams.find(
				(team) => team._id === targetTeamId,
			);

			if (updatedSourceTeam && updatedTargetTeam) {
				// Update source team (remove operator) - send only operator IDs
				const sourceOperatorIds = updatedSourceTeam.operators.map((op) =>
					typeof op === "object" ? op._id : op,
				);

				await TeamsApi.updateTeam(sourceTeamId, {
					name: updatedSourceTeam.name,
					AO: updatedSourceTeam.AO,
					operators: sourceOperatorIds,
				});

				// Update target team (add operator) - send only operator IDs
				const targetOperatorIds = updatedTargetTeam.operators.map((op) =>
					typeof op === "object" ? op._id : op,
				);

				await TeamsApi.updateTeam(targetTeamId, {
					name: updatedTargetTeam.name,
					AO: updatedTargetTeam.AO,
					operators: targetOperatorIds,
				});

				toast.success("Operator transferred successfully!");
			}
		} catch (error) {
			console.error("ERROR transferring operator:", error);
			toast.error("Failed to transfer operator");

			// Revert optimistic update on error by fetching fresh data
			get().fetchTeams();
		}
	},
	// Remove all operators from all teams
	removeAllOperatorsFromTeams: async () => {
		try {
			const { teams, updateTeam, fetchTeams } = get();

			// Update each team to have empty operators array
			await Promise.all(
				teams.map((team) => updateTeam({ ...team, operators: [] })),
			);

			await fetchTeams();
			toast.success("All operators removed from teams!");
		} catch (error) {
			console.error("Error removing operators:", error);
			toast.error("Failed to remove operators from teams.");
		}
	},
	addVehicleToTeam: async (vehicleId, targetTeamId) => {
		try {
			const { teams, fullVehicleList } = get();

			const targetTeam = teams.find((t) => t._id === targetTeamId);
			if (!targetTeam) return toast.error("Target team not found");

			const alreadyInTarget = (targetTeam.assets || []).some(
				(v) => (typeof v === "object" ? v._id : v) === vehicleId,
			);
			if (alreadyInTarget) return toast.warning("Vehicle already in this team");

			const sourceTeam = teams.find(
				(t) =>
					t._id !== targetTeamId &&
					(t.assets || []).some(
						(v) => (typeof v === "object" ? v._id : v) === vehicleId,
					),
			);

			const vehicleObj = fullVehicleList.find((v) => v._id === vehicleId);
			if (!vehicleObj) return toast.error("Vehicle not found");

			// optimistic UI
			set((state) => ({
				teams: state.teams.map((t) => {
					if (sourceTeam && t._id === sourceTeam._id) {
						return {
							...t,
							assets: (t.assets || []).filter(
								(v) => (typeof v === "object" ? v._id : v) !== vehicleId,
							),
						};
					}
					if (t._id === targetTeamId) {
						return { ...t, assets: [...(t.assets || []), vehicleObj] };
					}
					return t;
				}),
			}));

			// IDs only for backend
			const targetAssetIds = [
				...(targetTeam.assets || []).map((v) =>
					typeof v === "object" ? v._id : v,
				),
				vehicleId,
			];

			await TeamsApi.updateTeam(targetTeamId, {
				name: targetTeam.name,
				AO: targetTeam.AO,
				operators: (targetTeam.operators || []).map((op) =>
					typeof op === "object" ? op._id : op,
				),
				assets: targetAssetIds,
			});

			if (sourceTeam) {
				const sourceAssetIds = (sourceTeam.assets || [])
					.filter((v) => (typeof v === "object" ? v._id : v) !== vehicleId)
					.map((v) => (typeof v === "object" ? v._id : v));

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
					operators: (sourceTeam.operators || []).map((op) =>
						typeof op === "object" ? op._id : op,
					),
					assets: sourceAssetIds,
				});

				toast.success(
					`Vehicle transferred from ${sourceTeam.name} to ${targetTeam.name}!`,
				);
			} else {
				toast.success(`Vehicle added to ${targetTeam.name}!`);
			}

			await get().fetchVehiclesForTeams();
		} catch (error) {
			console.error("ERROR assigning vehicle:", error);
			toast.error("Failed to assign vehicle");
			get().fetchTeams(); // rollback
		}
	},

	removeVehicleFromTeam: async (vehicleId, teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return toast.error("Team not found");

			// optimistic
			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ?
						{
							...t,
							assets: (t.assets || []).filter(
								(v) => (typeof v === "object" ? v._id : v) !== vehicleId,
							),
						}
					:	t,
				),
			}));

			const assetIds = (team.assets || [])
				.filter((v) => (typeof v === "object" ? v._id : v) !== vehicleId)
				.map((v) => (typeof v === "object" ? v._id : v));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				operators: (team.operators || []).map((op) =>
					typeof op === "object" ? op._id : op,
				),
				assets: assetIds,
			});

			toast.success("Vehicle removed from team!");
			await get().fetchVehiclesForTeams();
		} catch (error) {
			console.error("ERROR removing vehicle:", error);
			toast.error("Failed to remove vehicle");
			get().fetchTeams();
		}
	},
	// Form state: add/remove assets (NewTeamForm/EditTeamForm)
	addAsset: (vehicleId) => {
		set((state) => {
			if (!vehicleId) return state;
			if (state.assets.includes(vehicleId)) return state;
			return { assets: [...state.assets, vehicleId] };
		});
	},

	removeAsset: (vehicleId) => {
		set((state) => ({
			assets: state.assets.filter((id) => id !== vehicleId),
		}));
	},

	// Delete a team
	deleteTeam: async (teamId) => {
		if (!teamId) {
			return;
		}

		try {
			await TeamsApi.deleteTeam(teamId);
			toast.success("Team deleted successfully.");
		} catch (error) {
			toast.error("ERROR deleting team:", error);
		}
	},

	// Reset store when opening form
	resetStore: () => {
		set({
			teamName: "",
			operators: [],
			assets: [],
			aiTeam: [],
			selectedTeamType: "",
			missionDescription: "",
			team: null,
		});
	},
}));

export default useTeamsStore;
