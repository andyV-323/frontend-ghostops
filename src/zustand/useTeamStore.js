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

	// Fetch a single team by ID
	fetchTeamById: async (teamId) => {
		try {
			const response = await TeamsApi.getTeamById(teamId);
			const teamData = response.data;

			set({
				team: {
					_id: teamData._id,
					createdBy: teamData.createdBy || "",
					name: teamData.name || "",
					operators: teamData.operators.map((op) => op._id),
				},
				teamName: teamData.name || "",
				operators: teamData.operators.map((op) => op._id),
			});
		} catch (error) {
			console.error("ERROR fetching team:", error);
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
			const allTeams = await TeamsApi.getTeams();

			// Save the full list of operators for rendering names
			set({ fullOperatorList: data });

			// Filter only active + not assigned for the select dropdown
			const operatorsInTeams = allTeams.flatMap((team) =>
				team.operators.map((op) => op._id)
			);
			const availableOperators = data.filter(
				(op) => op.status === "Active" && !operatorsInTeams.includes(op._id)
			);

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
	// Add operator to the team
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

			if (response && response.Response) {
				const generatedTeam = response.Response;
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
			aiTeam: [],
			selectedTeamType: "",
			missionDescription: "",
		});
	},
}));

export default useTeamsStore;
