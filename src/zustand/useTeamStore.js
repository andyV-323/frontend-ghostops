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
import { memberOperatorId, activeMembers, reserveMembers } from "../utils/teamMembers";

import { toast } from "react-toastify";

// Safely extract a string ID from either a populated object or a bare ID string/value.
// Guards against `null` (typeof null === "object") and non-string primitives.
const toId = (v) => {
	if (v && typeof v === "object") return v._id ?? null;
	return v ?? null;
};

// Operator.class is [String] in the schema — take first element as a single class string.
const firstStr = (v) => Array.isArray(v) ? (v[0] || "") : (typeof v === "string" ? v : "");

// Splits a flat operator-id array into the dense 4-slot + reserves shape,
// carrying over each operator's existing class on this team (if any) so a
// re-save from the legacy OperatorPicker widget (NewTeamForm/EditTeamForm)
// doesn't clobber classes that were set through the slot control elsewhere.
function splitIntoSlotsAndReserves(operatorIds, existingTeam) {
	const existingClassById = {};
	[...activeMembers(existingTeam), ...reserveMembers(existingTeam)].forEach((m) => {
		const id = memberOperatorId(m);
		if (id) existingClassById[id] = m.class ?? null;
	});
	const activeSlots = [null, null, null, null];
	const reserves = [];
	operatorIds.forEach((id, i) => {
		const member = { operatorId: id, class: existingClassById[id] ?? null };
		if (i < 4) activeSlots[i] = member;
		else reserves.push(member);
	});
	return { activeSlots, reserves };
}

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

	// Fetches one team for the legacy edit form (EditTeamForm's OperatorPicker
	// widget wants a flat operator-id array, not the slot/reserve shape).
	fetchTeamById: async (teamId) => {
		try {
			const response = await TeamsApi.getTeamById(teamId);

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

			const operatorIds = [
				...activeMembers(teamData).map(memberOperatorId),
				...reserveMembers(teamData).map(memberOperatorId),
			].filter(Boolean);

			const assetIds = (teamData.assets || []).map((v) =>
				typeof v === "object" && v._id ? v._id : v,
			);

			set({
				team: {
					_id: teamData._id,
					createdBy: teamData.createdBy || "",
					name: teamData.name || "",
					AO: teamData.AO || null,
					activeSlots: teamData.activeSlots,
					reserves: teamData.reserves,
					operators: operatorIds,
					assets: assetIds,
				},
				teamName: teamData.name || "",
				teamAO: teamData.AO || "",
				operators: operatorIds,
				assets: assetIds,
			});
		} catch (error) {
			console.error("ERROR fetching team:", error);
			set({ team: null });
		}
	},

	// Set team name
	setTeamName: (name) => set({ teamName: name }),

	// Set team AO
	setTeamAO: (ao) => set({ teamAO: ao }),

	// Generic team update — used by the name/AO/asset form (EditTeamForm) and
	// the legacy OperatorPicker widget. A flat `operators` id array (from
	// OperatorPicker) is translated into activeSlots/reserves here; anything
	// doing slot-aware assignment should use assignSlot/addToTeam instead.
	updateTeam: async (teamData) => {
		try {
			if (!teamData._id) {
				console.error("ERROR: Missing team ID");
				return;
			}

			const payload = {
				createdBy: teamData.createdBy,
				name: teamData.name,
				AO: teamData.AO ?? null,
				assets: (teamData.assets || []).map(toId),
			};

			if (Array.isArray(teamData.operators)) {
				const existingTeam =
					get().teams.find((t) => t._id === teamData._id) || get().team;
				const ids = teamData.operators.map(toId).filter(Boolean);
				const { activeSlots, reserves } = splitIntoSlotsAndReserves(ids, existingTeam);
				payload.activeSlots = activeSlots;
				payload.reserves = reserves;
			}

			await TeamsApi.updateTeam(teamData._id, payload);

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

	// ── Slot / reserve management (server-authoritative — each call is a
	// single atomic backend write; the response replaces this team in state) ──
	assignSlot: async (teamId, operatorId, slot) => {
		try {
			const res = await TeamsApi.assignSlot(teamId, operatorId, slot);
			const team = res.data.team;
			set((state) => ({ teams: state.teams.map((t) => (t._id === teamId ? team : t)) }));
			return team;
		} catch (error) {
			console.error("ERROR assigning slot:", error);
			toast.error(error.response?.data?.error || "Failed to assign slot");
			get().fetchTeams();
		}
	},

	reorderReserve: async (teamId, operatorId, direction) => {
		try {
			const res = await TeamsApi.reorderReserve(teamId, operatorId, direction);
			const team = res.data.team;
			set((state) => ({ teams: state.teams.map((t) => (t._id === teamId ? team : t)) }));
			return team;
		} catch (error) {
			console.error("ERROR reordering reserve:", error);
			toast.error("Failed to reorder reserve");
			get().fetchTeams();
		}
	},

	promoteReserve: async (teamId, operatorId, slot) => {
		try {
			const res = await TeamsApi.promoteReserve(teamId, operatorId, slot);
			const team = res.data.team;
			set((state) => ({ teams: state.teams.map((t) => (t._id === teamId ? team : t)) }));
			return team;
		} catch (error) {
			console.error("ERROR promoting reserve:", error);
			toast.error("Failed to promote reserve");
			get().fetchTeams();
		}
	},

	// Fills the lowest-numbered empty slot, or reserves if full. Also the
	// cross-team "add/transfer" path used by the assign table and the
	// operator-centric AssignTeamSheet.
	addToTeam: async (teamId, operatorId, classUsed) => {
		try {
			const res = await TeamsApi.addToTeam(teamId, operatorId, classUsed);
			const { team, destination } = res.data;
			set((state) => ({ teams: state.teams.map((t) => (t._id === teamId ? team : t)) }));
			const opName =
				get().fullOperatorList.find((o) => o._id === operatorId)?.callSign || "Operator";
			toast.success(
				destination?.type === "slot" ?
					`${opName} added to Slot ${destination.slot}`
				:	`${opName} added to Reserves`,
			);
			await get().fetchOperators();
			return { team, destination };
		} catch (error) {
			console.error("ERROR adding operator to team:", error);
			toast.error(error.response?.data?.error || "Failed to add operator");
			get().fetchTeams();
		}
	},

	// Back-compat alias — Roster.jsx / AssignTeamSheet.jsx call this with
	// (operatorId, teamId, selectedClass); keep that call shape, delegate to addToTeam.
	addOperatorToTeam: async (operatorId, targetTeamId, selectedClass) =>
		get().addToTeam(targetTeamId, operatorId, selectedClass),

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
			if (!teamData.createdBy || !teamData.name) {
				toast.warn("Team name is required.");
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
			toast.error("Failed to create team.");
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
				const member = [...activeMembers(team), ...reserveMembers(team)].find(
					(m) => memberOperatorId(m) === operatorId,
				);
				if (member) {
					operator = typeof member.operatorId === "object" ? member.operatorId : null;
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

	// Remove all operators AND clear all AOs, roles, and lead from every team
	removeAllOperatorsFromTeams: async () => {
		try {
			const { teams } = get();

			set((state) => ({
				teams: state.teams.map((t) => ({
					...t,
					activeSlots: [null, null, null, null],
					reserves: [],
					AO: null,
					leadId: null,
				})),
			}));

			await Promise.all(
				teams.map((team) =>
					TeamsApi.updateTeam(team._id, {
						name: team.name,
						createdBy: team.createdBy,
						AO: null,
						activeSlots: [null, null, null, null],
						reserves: [],
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

	// Remove one operator from one team entirely (not to reserves — off the team)
	unassignOperatorFromTeam: async (operatorId, teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			const activeSlots = (team.activeSlots || []).map((m) =>
				m && memberOperatorId(m) === operatorId ? null : m,
			);
			const reserves = (team.reserves || []).filter(
				(m) => memberOperatorId(m) !== operatorId,
			);
			const casualties = (team.casualties || []).filter(
				(m) => memberOperatorId(m) !== operatorId,
			);
			const updatedLeadId = team.leadId === operatorId ? null : (team.leadId ?? null);

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, activeSlots, reserves, casualties, leadId: updatedLeadId } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				activeSlots,
				reserves,
				casualties,
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

			const patchMember = (m) =>
				m && memberOperatorId(m) === operatorId ? { ...m, class: slotClass || null } : m;
			const activeSlots = (team.activeSlots || []).map(patchMember);
			const reserves = (team.reserves || []).map(patchMember);

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, activeSlots, reserves } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, { activeSlots, reserves });
		} catch (error) {
			console.error("ERROR setting slot class:", error);
			toast.error("Failed to update class");
			get().fetchTeams();
		}
	},

	// Clear one team — operators, AO, and lead
	clearTeam: async (teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) return;

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ?
						{ ...t, activeSlots: [null, null, null, null], reserves: [], AO: null, leadId: null }
					:	t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				createdBy: team.createdBy,
				AO: null,
				activeSlots: [null, null, null, null],
				reserves: [],
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

			// Use the operator list already fetched by fetchOperators() in this store,
			// falling back to useOperatorsStore in case allOperators isn't populated yet.
			const storeOps = get().allOperators;
			const allOps = storeOps.length > 0
				? storeOps
				: useOperatorsStore.getState().operators.filter(
						(op) => (op.status || "").toLowerCase() === "active",
					);

			const lockedIds = new Set(
				teams
					.filter((t) => t._id !== teamId)
					.flatMap((t) => [...activeMembers(t), ...reserveMembers(t)].map(memberOperatorId)),
			);

			// Build a set of classes that are valid for this mission.
			// template.validClasses is the explicit list from the config.
			const validClassSet = new Set(
				(template.validClasses || template.classes).map(
					(c) => (typeof c === "string" ? c.toLowerCase() : ""),
				),
			);

			const hasValidClass = (op) => {
				const classes = Array.isArray(op.class) ? op.class : op.class ? [op.class] : [];
				return classes.some(
					(c) => typeof c === "string" && validClassSet.has(c.toLowerCase()),
				);
			};

			// Filter the pool to only operators with a valid class for this mission.
			// This guarantees no invalid class is ever added regardless of fallback path.
			const validPool = allOps.filter(
				(op) => !lockedIds.has(op._id) && hasValidClass(op),
			);

			const total = template.classes.length;

			if (validPool.length === 0) {
				toast.warning("No eligible operators with valid classes — auto-assign skipped");
				return;
			}

			const remaining = [...validPool];
			const assignments = [];

			// Pick an operator whose class exactly matches cls.
			const pickByClass = (cls) => {
				const clsLower = (typeof cls === "string" ? cls : "").toLowerCase();
				const idx = remaining.findIndex((op) => {
					const classes = Array.isArray(op.class) ? op.class : op.class ? [op.class] : [];
					return classes.some((c) => typeof c === "string" && c.toLowerCase() === clsLower);
				});
				return idx !== -1 ? remaining.splice(idx, 1)[0] : null;
			};

			// Pick any operator still in remaining (all are valid classes at this point).
			const pickAny = () =>
				remaining.length > 0 ? remaining.splice(0, 1)[0] : null;

			// Return the operator's class that is valid for this mission.
			// Avoids labeling a multi-class operator (e.g. ["Pathfinder","Sharpshooter"])
			// with an invalid class just because it happens to be first in the array.
			const validSlotClass = (op) => {
				const classes = Array.isArray(op.class) ? op.class : op.class ? [op.class] : [];
				return (
					classes.find((c) => typeof c === "string" && validClassSet.has(c.toLowerCase())) ||
					firstStr(op.class)
				);
			};

			// Remove one lead-class slot from the list so total count stays correct.
			const otherSlots = [...template.classes];
			const leadSlotIdx = otherSlots.findIndex(
				(c) => c.toLowerCase() === template.lead.toLowerCase(),
			);
			if (leadSlotIdx !== -1) otherSlots.splice(leadSlotIdx, 1);

			// Lead: exact lead class → any valid class → skip
			const leadMatch = pickByClass(template.lead);
			if (leadMatch) {
				assignments.push({ op: leadMatch, slotClass: template.lead });
			} else {
				const fallbackLead = pickAny();
				if (fallbackLead) {
					assignments.push({
						op: fallbackLead,
						slotClass: validSlotClass(fallbackLead),
					});
				}
			}

			// Fill each remaining slot: exact class match → any valid class → skip
			for (const cls of otherSlots) {
				const op = pickByClass(cls);
				if (op) {
					assignments.push({ op, slotClass: cls });
				} else {
					const fallback = pickAny();
					if (fallback) {
						assignments.push({
							op: fallback,
							slotClass: validSlotClass(fallback),
						});
					}
				}
			}

			const count = assignments.length;
			const activeSlots = [null, null, null, null];
			const reserves = [];
			assignments.forEach(({ op, slotClass }, i) => {
				const member = { operatorId: op._id, class: slotClass || null };
				if (i < 4) activeSlots[i] = member;
				else reserves.push(member);
			});
			const leadId = assignments[0]?.op._id ?? null;

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, activeSlots, reserves, leadId } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				activeSlots,
				reserves,
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
	// Assign 1–4 random available operators to a team (no class restrictions)
	autoAssignRandom: async (teamId) => {
		try {
			const { teams } = get();
			const team = teams.find((t) => t._id === teamId);
			if (!team) { toast.error("Team not found"); return; }

			const storeOps = get().allOperators;
			const allOps = storeOps.length > 0
				? storeOps
				: useOperatorsStore.getState().operators;

			const lockedIds = new Set(
				teams
					.filter((t) => t._id !== teamId)
					.flatMap((t) => [...activeMembers(t), ...reserveMembers(t)].map(memberOperatorId)),
			);

			const pool = allOps.filter(
				(op) => !lockedIds.has(op._id) && (op.status || "").toLowerCase() === "active",
			);

			if (pool.length === 0) {
				toast.warning("No available operators for random assignment");
				return;
			}

			const shuffled = [...pool].sort(() => Math.random() - 0.5);
			const count = Math.min(4, Math.max(1, Math.floor(Math.random() * 4) + 1), shuffled.length);
			const picked = shuffled.slice(0, count);
			const leadId = picked[0]._id;

			const activeSlots = [null, null, null, null];
			picked.forEach((op, i) => {
				const cls = Array.isArray(op.class) ? op.class[0] : op.class;
				activeSlots[i] = { operatorId: op._id, class: cls || null };
			});

			set((state) => ({
				teams: state.teams.map((t) =>
					t._id === teamId ? { ...t, activeSlots, reserves: [], leadId } : t,
				),
			}));

			await TeamsApi.updateTeam(teamId, {
				name: team.name,
				AO: team.AO,
				activeSlots,
				reserves: [],
				leadId,
				assets: (team.assets || []).map(toId),
			});

			toast.success(`Random team: ${count} operator${count !== 1 ? "s" : ""} assigned`);
		} catch (error) {
			console.error("ERROR random-assigning team:", error);
			toast.error("Random assign failed");
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
				assets: targetAssetIds,
			});

			if (sourceTeam) {
				const sourceAssetIds = (sourceTeam.assets || [])
					.filter((v) => (toId(v)) !== vehicleId)
					.map((v) => (toId(v)));

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
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
