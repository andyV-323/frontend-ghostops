import { create } from "zustand";

import {
	TeamsApi,
	OperatorsApi,
	InfirmaryApi,
	MemorialApi,
	chatGPTApi,
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
	AO: "",
	fullOperatorList: [],

	// Fetch all teams
	fetchTeams: async () => {
		set({ loading: true });
		try {
			const teamsData = await TeamsApi.getTeams();
			const filteredTeams = teamsData.map((team) => ({
				...team,
				operators: team.operators.filter(
					(op) => op.status !== "Injured" && op.status !== "KIA"
				),
			}));
			set({ teams: filteredTeams });
		} catch (error) {
			console.error("ERROR fetching teams:", error);
		} finally {
			set({ loading: false });
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

			const stateUpdate = {
				team: {
					_id: teamData._id,
					createdBy: teamData.createdBy || "",
					name: teamData.name || "",
					AO: teamData.AO || "",
					operators: operatorIds,
				},
				teamName: teamData.name || "",
				AO: teamData.AO || "",
				operators: operatorIds,
			};

			set(stateUpdate);

			// Verify state was set correctly
			setTimeout(() => {
				const currentState = get();
				console.log("Verified teamName:", currentState.teamName);
				console.log("Verified AO:", currentState.AO);
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
	setAO: (ao) => set({ AO: ao }),

	updateTeam: async (teamData) => {
		try {
			if (!teamData._id) {
				console.error("ERROR: Missing team ID");

				return;
			}

			await TeamsApi.updateTeam(teamData._id, {
				createdBy: teamData.createdBy,
				name: teamData.name,
				AO: teamData.AO,
				operators: teamData.operators,
			});

			toast.success("Team updated successfully!");
		} catch (error) {
			console.error(
				"ERROR updating team:",
				error.response?.data || error.message
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
	/*fetchOperators: async () => {
		try {
			const data = await OperatorsApi.getOperators();
			const allTeams = await TeamsApi.getTeams();

			// Save the full list of operators for rendering names
			set({ fullOperatorList: data });

			// Filter only active + not assigned for the select dropdown
			/*	const operatorsInTeams = allTeams.flatMap((team) =>
				team.operators.map((op) => op._id)
			);
			const availableOperators = data.filter(
				(op) => op.status === "Active"
				//&& !operatorsInTeams.includes(op._id)
			);

			set({ allOperators: availableOperators });
		} catch (error) {
			console.error("ERROR fetching operators:", error);
			set({ allOperators: [], fullOperatorList: [] });
		}
	},*/
	/*fetchOperators: async () => {
		try {
			const data = await OperatorsApi.getOperators();
			const allTeams = await TeamsApi.getTeams();

			// Get IDs of operators already in teams
			const operatorsInTeams = allTeams.flatMap((team) =>
				team.operators.map((op) => op._id)
			);

			// Only keep active operators who are NOT already assigned
			const availableOperators = data.filter(
				(op) => op.status === "Active" && !operatorsInTeams.includes(op._id)
			);

			set({ allOperators: availableOperators });
		} catch (error) {
			console.error("ERROR fetching operators:", error);
			set({ allOperators: [] });
		}
	},*/
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
				(op) => op._id === operatorId
			);
			if (operatorAlreadyInTarget) {
				toast.warning("Operator is already in this team");
				return;
			}

			// Find if operator is currently in another team
			const sourceTeam = teams.find(
				(team) =>
					team._id !== targetTeamId &&
					team.operators.some((op) => op._id === operatorId)
			);

			// Get the operator details
			const operatorToMove = fullOperatorList.find(
				(op) => op._id === operatorId
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
				AO: targetTeam.AO,
				operators: updatedTargetOperatorIds,
			});

			// Update source team on server (if operator was in another team)
			if (sourceTeam) {
				const updatedSourceOperatorIds = sourceTeam.operators
					.filter((op) => op._id !== operatorId)
					.map((op) => op._id);

				await TeamsApi.updateTeam(sourceTeam._id, {
					name: sourceTeam.name,
					AO: sourceTeam.AO,
					operators: updatedSourceOperatorIds,
				});

				toast.success(
					`${operatorToMove.callSign} transferred from ${sourceTeam.name} to ${targetTeam.name}!`
				);
			} else {
				toast.success(
					`${operatorToMove.callSign} added to ${targetTeam.name}!`
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

	// Generate an AI-recommended team
	generateAITeam: async () => {
		set({ loading: true });
		try {
			const { selectedTeamType, missionDescription, allOperators } = get();

			if (!selectedTeamType && !missionDescription.trim()) {
				toast.warn(
					"Please select a team type or provide a mission description."
				);
				return;
			}

			const response = await chatGPTApi("team", {
				teamType: selectedTeamType || null,
				missionDescription: missionDescription || null,
				availableOperators: allOperators.map((op) => ({
					id: op._id,
					name: op.callSign,
					role: op.class,
					secondaryRole: op.secondaryClass,
				})),
			});

			if (response && response.result) {
				const generatedTeam = response.result;
				const suggestedOperators = allOperators.filter((op) =>
					generatedTeam.includes(op.callSign)
				);

				set({
					aiTeam: suggestedOperators,
					operators: suggestedOperators.map((op) => op._id), // Store operator IDs
				});
			} else {
				throw new Error("Invalid AI response format");
			}
		} catch (error) {
			console.error("ERROR generating team:", error);
			toast.error("Failed to generate team.");
		} finally {
			set({ loading: false });
		}
	},

	// Set selected team type
	setSelectedTeamType: (type) => set({ selectedTeamType: type }),

	// Set mission description
	setMissionDescription: (desc) => set({ missionDescription: desc }),

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
				error.response?.data || error.message
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
			(injury) => injury.recoveryHours === "KIA"
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

	// Transfer operator between teams via drag and drop
	transferOperator: async (operatorId, sourceTeamId, targetTeamId) => {
		try {
			// Store the original state for potential rollback
			const originalTeams = get().teams;

			// Find the operator to transfer from the current state
			const sourceTeam = originalTeams.find(
				(team) => team._id === sourceTeamId
			);
			const operatorToTransfer = sourceTeam?.operators.find(
				(op) => op._id === operatorId
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
							(op) => op._id === operatorId
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
				(team) => team._id === sourceTeamId
			);
			const updatedTargetTeam = currentState.teams.find(
				(team) => team._id === targetTeamId
			);

			if (updatedSourceTeam && updatedTargetTeam) {
				// Update source team (remove operator) - send only operator IDs
				const sourceOperatorIds = updatedSourceTeam.operators.map((op) =>
					typeof op === "object" ? op._id : op
				);

				await TeamsApi.updateTeam(sourceTeamId, {
					name: updatedSourceTeam.name,
					AO: updatedSourceTeam.AO,
					operators: sourceOperatorIds,
				});

				// Update target team (add operator) - send only operator IDs
				const targetOperatorIds = updatedTargetTeam.operators.map((op) =>
					typeof op === "object" ? op._id : op
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
			AO: "",
			aiTeam: [],
			selectedTeamType: "",
			missionDescription: "",
			team: null,
		});
	},
}));

export default useTeamsStore;
