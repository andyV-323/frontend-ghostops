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

// Safely extract a string ID from either a populated object or a bare ID string/value.
// Guards against `null` (typeof null === "object") and non-string primitives.
const toId = (v) => {
	if (v && typeof v === "object") return v._id ?? null;
	return v ?? null;
};

// Operator.class is [String] in the schema — take first element as a single class string.
const firstStr = (v) => Array.isArray(v) ? (v[0] || "") : (typeof v === "string" ? v : "");

// Serialize a Mongoose Map or plain object of operatorRoles to a plain object.
const rolesObj = (roles) => {
	if (!roles) return {};
	if (roles instanceof Map) {
		const out = {};
		roles.forEach((v, k) => { if (v) out[String(k)] = v; });
		return out;
	}
	const out = {};
	Object.entries(roles).forEach(([k, v]) => { if (v) out[String(k)] = v; });
	return out;
};

const useTeamsStore = create((set, get) => ({
	teams: [],
	team: null,
	operators: [],
	loading: false,
	allOperators: [],
	teamName: "",
	teamAO: "",
	fullOperatorList: [],
	assets: [],
	allVehicles: [],
	fullVehicleList: [],

	// Fetch all teams
	fetchTeams: async () => {
		set({ loading: true });
		try {
			const teamsData = await TeamsApi.getTeams();
			set({ teams: teamsData });
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
					(t.assets || []).map((v) => (toId(v))),
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
					AO: teamData.AO || null,
					operators: operatorIds,
					assets: assetIds,
				},
				teamName: teamData.name || "",
				teamAO: teamData.AO || "",
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

	// Set team AO
	setTeamAO: (ao) => set({ teamAO: ao }),

	updateTeam: async (teamData) => {
		try {
			if (!teamData._id) {
				console.error("ERROR: Missing team ID");

				return;
			}

			await TeamsApi.updateTeam(teamData._id, {
				createdBy: teamData.createdBy,
				name: teamData.name,
				AO: teamData.AO ?? null,
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

			const targetTeam = teams.find((team) => team._id === targetTeamId);
			if (!targetTeam) { toast.error("Target team not found"); return; }

			const operatorAlreadyInTarget = targetTeam.operators.some(
				(op) => toId(op) === operatorId,
			);
			if (operatorAlreadyInTarget) { toast.warning("Operator is already in this team"); return; }

			const sourceTeam = teams.find(
				(team) =>
					team._id !== targetTeamId &&
					team.operators.some((op) => toId(op) === operatorId),
			);

			const operatorToMove = fullOperatorList.find((op) => op._id === operatorId);
			if (!operatorToMove) { toast.error("Operator not found"); return; }

			// Default slot class: current active class or primary class
			const { activeClasses } = useOperatorsStore.getState();
			const defaultSlotClass =
				activeClasses[operatorId] || firstStr(operatorToMove.class) || "";

			// Build updated operatorRoles for target
			const targetRoles = {
				...rolesObj(targetTeam.operatorRoles),
				[operatorId]: defaultSlotClass,
			};
			// Remove from source roles if transferring
			const sourceRoles = sourceTeam ?
				Object.fromEntries(
					Object.entries(rolesObj(sourceTeam.operatorRoles)).filter(
						([k]) => k !== operatorId,
					),
				)
			:	null;

			// Optimistic update
			set((state) => ({
				teams: state.teams.map((team) => {
					if (sourceTeam && team._id === sourceTeam._id) {
						return {
							...team,
							operators: team.operators.filter((op) => toId(op) !== operatorId),
							operatorRoles: sourceRoles,
							leadId: team.leadId === operatorId ? null : team.leadId,
						};
					}
					if (team._id === targetTeamId) {
						return {
							...team,
							operators: [...team.operators, operatorToMove],
							operatorRoles: targetRoles,
						};
					}
					return team;
				}),
			}));

			const updatedTargetOperatorIds = [
				...targetTeam.operators.map(toId),
				operatorId,
			];
			await TeamsApi.updateTeam(targetTeamId, {
				name: targetTeam.name,
				operators: updatedTargetOperatorIds,
				operatorRoles: targetRoles,
			});

			if (sourceTeam) {
				const updatedSourceOperatorIds = sourceTeam.operators
					.filter((op) => toId(op) !== operatorId)
					.map(toId);

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
					operators: updatedSourceOperatorIds,
					operatorRoles: sourceRoles,
					leadId: sourceTeam.leadId === operatorId ? null : (sourceTeam.leadId ?? null),
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
		const survivalThreshold = 0.3;
		const roll = Math.random();

		if (roll < survivalThreshold) {
			toast.success("Operator extracted safe — no injuries sustained");
			return;
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
					toId(op),
				);

				await TeamsApi.updateTeam(sourceTeamId, {
					name: updatedSourceTeam.name,
					AO: updatedSourceTeam.AO,
					operators: sourceOperatorIds,
				});

				// Update target team (add operator) - send only operator IDs
				const targetOperatorIds = updatedTargetTeam.operators.map((op) =>
					toId(op),
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
	// Remove all operators AND clear all AOs, roles, and lead from every team
	removeAllOperatorsFromTeams: async () => {
		try {
			const { teams } = get();

			set((state) => ({
				teams: state.teams.map((t) => ({
					...t,
					operators: [],
					AO: null,
					operatorRoles: {},
					leadId: null,
				})),
			}));

			await Promise.all(
				teams.map((team) =>
					TeamsApi.updateTeam(team._id, {
						name: team.name,
						createdBy: team.createdBy,
						AO: null,
						operators: [],
						operatorRoles: {},
						leadId: null,
						assets: (team.assets || []).map(toId),
					}),
				),
			);

			await get().fetchTeams();
			toast.success("All teams cleared!");
		} catch (error) {
			console.error("Error clearing teams:", error);
			toast.error("Failed to clear teams.");
			get().fetchTeams();
		}
	},

	// Remove one operator from one team
	unassignOperatorFromTeam: async (operatorId, teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			const updatedRoles = Object.fromEntries(
				Object.entries(rolesObj(team.operatorRoles)).filter(([k]) => k !== operatorId),
			);
			const updatedLeadId = team.leadId === operatorId ? null : (team.leadId ?? null);

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ?
						{
							...t,
							operators: t.operators.filter((op) => toId(op) !== operatorId),
							operatorRoles: updatedRoles,
							leadId: updatedLeadId,
						}
					:	t,
				),
			}));

			const updatedIds = team.operators.filter((op) => toId(op) !== operatorId).map(toId);

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				operators: updatedIds,
				operatorRoles: updatedRoles,
				leadId: updatedLeadId,
			});

			toast.success("Operator unassigned");
		} catch (error) {
			console.error("ERROR unassigning operator:", error);
			toast.error("Failed to unassign operator");
			get().fetchTeams();
		}
	},

	// Update just the slot class for one operator on one team
	setOperatorSlotClass: async (operatorId, teamId, slotClass) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			const updatedRoles = {
				...rolesObj(team.operatorRoles),
				[operatorId]: slotClass || undefined,
			};
			if (!slotClass) delete updatedRoles[operatorId];

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, operatorRoles: updatedRoles } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, { operatorRoles: updatedRoles });
		} catch (error) {
			console.error("ERROR setting slot class:", error);
			toast.error("Failed to update class");
			get().fetchTeams();
		}
	},

	// Clear one team — operators, AO, roles, and lead
	clearTeam: async (teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ?
						{ ...t, operators: [], AO: null, operatorRoles: {}, leadId: null }
					:	t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				createdBy: team.createdBy,
				AO: null,
				operators: [],
				operatorRoles: {},
				leadId: null,
				assets: (team.assets || []).map(toId),
			});

			toast.success(`${team.name} cleared`);
		} catch (error) {
			console.error("ERROR clearing team:", error);
			toast.error("Failed to clear team");
			get().fetchTeams();
		}
	},

	// Remove all assets from one team
	clearTeamAssets: async (teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, assets: [] } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				operators: (team.operators || []).map(toId),
				assets: [],
			});

			toast.success("Assets cleared");
			await get().fetchVehiclesForTeams();
		} catch (error) {
			console.error("ERROR clearing assets:", error);
			toast.error("Failed to clear assets");
			get().fetchTeams();
		}
	},

	// Detach every attached team from a main team in one shot
	detachAllTeams: async (mainTeamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === mainTeamId);
			if (!team) return;

			const attachedIds = (team.attachedTeams || []).map(toId).filter(Boolean);
			if (attachedIds.length === 0) return;

			await Promise.all(
				attachedIds.map((id) => TeamsApi.detachTeam(mainTeamId, id)),
			);

			toast.success("All attached teams detached");
			await get().fetchTeams();
		} catch (error) {
			console.error("ERROR detaching all teams:", error);
			toast.error("Failed to detach all teams");
			get().fetchTeams();
		}
	},

	// Auto-assign operators to a team by mission-type template
	// template = { name, lead, classes }
	// Eligible pool: Active status + not locked on another team
	autoAssignTeam: async (teamId, template) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) {
				toast.error("Team not found");
				return;
			}

			const { operators: allOps, activeClasses } =
				useOperatorsStore.getState();

			const lockedIds = new Set(
				teams
					.filter((t) => t._id !== teamId)
					.flatMap((t) =>
						t.operators.map((op) => (toId(op))),
					),
			);

			const pool = allOps.filter((op) => {
				const s = (op.status || "").toLowerCase();
				return s === "active" && !lockedIds.has(op._id);
			});

			const total = template.classes.length;

			if (pool.length === 0) {
				toast.warning("0 eligible operators available — auto-assign skipped");
				return;
			}

			const remaining = [...pool];
			// Track { op, slotClass } to build operatorRoles after picking
			const assignments = [];

			// Operator.class is [String] — check if any of the operator's classes match cls.
			const pickByClass = (cls) => {
				const clsLower = (typeof cls === "string" ? cls : "").toLowerCase();
				const idx = remaining.findIndex((op) => {
					const classes = Array.isArray(op.class)
						? op.class
						: op.class ? [op.class] : [];
					return classes.some(
						(c) => typeof c === "string" && c.toLowerCase() === clsLower,
					);
				});
				return idx !== -1 ? remaining.splice(idx, 1)[0] : null;
			};

			// Remove one instance of lead class from the remaining slots list
			const otherSlots = [...template.classes];
			const leadSlotIdx = otherSlots.findIndex(
				(c) => c.toLowerCase() === template.lead.toLowerCase(),
			);
			if (leadSlotIdx !== -1) otherSlots.splice(leadSlotIdx, 1);

			// Pick lead: try lead class first; fall back to first match among other slot
			// classes — never assign an operator of a completely unrelated class as lead.
			const leadMatch = pickByClass(template.lead);
			if (leadMatch) {
				assignments.push({ op: leadMatch, slotClass: template.lead });
			} else {
				for (let i = 0; i < otherSlots.length; i++) {
					const fallbackLead = pickByClass(otherSlots[i]);
					if (fallbackLead) {
						assignments.push({ op: fallbackLead, slotClass: otherSlots[i] });
						otherSlots.splice(i, 1);
						break;
					}
				}
			}

			// Fill remaining slots — strict class match only, no random fallback
			for (const cls of otherSlots) {
				const op = pickByClass(cls);
				if (op) assignments.push({ op, slotClass: cls });
			}

			const picked = assignments.map((a) => a.op);
			const pickedIds = picked.map((op) => op._id);
			const leadId = assignments[0]?.op._id ?? null;
			const operatorRoles = {};
			assignments.forEach(({ op, slotClass }) => {
				operatorRoles[op._id] = slotClass;
			});

			const count = picked.length;

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ?
						{ ...t, operators: picked, operatorRoles, leadId }
					:	t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				operators: pickedIds,
				operatorRoles,
				leadId,
				assets: (team.assets || []).map(toId),
			});

			if (count === 0) {
				toast.warning(`0 of ${total} slots filled — no eligible operators`);
			} else if (count < total) {
				toast.info(`Partial fill: ${count} of ${total} slots assigned`);
			} else {
				toast.success(`Auto-assigned ${count} of ${total} operators`);
			}
		} catch (error) {
			console.error("ERROR auto-assigning team:", error);
			toast.error("Auto-assign failed");
			get().fetchTeams();
		}
	},
	addVehicleToTeam: async (vehicleId, targetTeamId) => {
		try {
			const { teams, fullVehicleList } = get();

			const targetTeam = teams.find((t) => t._id === targetTeamId);
			if (!targetTeam) return toast.error("Target team not found");

			const alreadyInTarget = (targetTeam.assets || []).some(
				(v) => (toId(v)) === vehicleId,
			);
			if (alreadyInTarget) return toast.warning("Vehicle already in this team");

			const sourceTeam = teams.find(
				(t) =>
					t._id !== targetTeamId &&
					(t.assets || []).some(
						(v) => (toId(v)) === vehicleId,
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
								(v) => (toId(v)) !== vehicleId,
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
					toId(v),
				),
				vehicleId,
			];

			await TeamsApi.updateTeam(targetTeamId, {
				name: targetTeam.name,
				AO: targetTeam.AO,
				operators: (targetTeam.operators || []).map((op) =>
					toId(op),
				),
				assets: targetAssetIds,
			});

			if (sourceTeam) {
				const sourceAssetIds = (sourceTeam.assets || [])
					.filter((v) => (toId(v)) !== vehicleId)
					.map((v) => (toId(v)));

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
					operators: (sourceTeam.operators || []).map((op) =>
						toId(op),
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
								(v) => (toId(v)) !== vehicleId,
							),
						}
					:	t,
				),
			}));

			const assetIds = (team.assets || [])
				.filter((v) => (toId(v)) !== vehicleId)
				.map((v) => (toId(v)));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				operators: (team.operators || []).map((op) =>
					toId(op),
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

	// Attach a team to a main team
	attachTeamTo: async (mainTeamId, teamId) => {
		try {
			const { teams } = get();
			const mainTeam = teams.find((t) => t._id === mainTeamId);
			const alreadyAttached = (mainTeam?.attachedTeams || []).some(
				(t) => (toId(t)) === teamId,
			);
			if (alreadyAttached) {
				toast.warning("Team is already attached");
				return;
			}
			await TeamsApi.attachTeam(mainTeamId, teamId);
			toast.success("Team attached!");
			await get().fetchTeams();
		} catch (error) {
			console.error("ERROR attaching team:", error);
			toast.error("Failed to attach team");
		}
	},

	// Detach a team from a main team
	detachTeamFrom: async (mainTeamId, attachedTeamId) => {
		try {
			await TeamsApi.detachTeam(mainTeamId, attachedTeamId);
			toast.success("Team detached");
			await get().fetchTeams();
		} catch (error) {
			console.error("ERROR detaching team:", error);
			toast.error("Failed to detach team");
		}
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

	// Find a team by ID (always resolves to the top-level entry)
	_findTeam: (teams, teamId) => {
		const team = teams.find((t) => t._id === teamId);
		if (team) return { team };
		for (const t of teams) {
			const at = (t.attachedTeams || []).find(
				(a) => typeof a === "object" && a._id === teamId,
			);
			if (at) return { team: at };
		}
		return null;
	},

	// Patch a team in the store — always updates the top-level entry AND any
	// nested copies inside parent attachedTeams arrays.
	_patchTeam: (state, teamId, patch) => ({
		teams: state.teams.map((t) => {
			if (t._id === teamId) return { ...t, ...patch };
			if ((t.attachedTeams || []).some((at) => typeof at === "object" && at._id === teamId)) {
				return {
					...t,
					attachedTeams: (t.attachedTeams || []).map((at) =>
						typeof at === "object" && at._id === teamId ? { ...at, ...patch } : at,
					),
				};
			}
			return t;
		}),
	}),

	// Reset store when opening form
	resetStore: () => {
		set({
			teamName: "",
			teamAO: "",
			operators: [],
			assets: [],
			team: null,
		});
	},
}));

export default useTeamsStore;
