import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { useTeamsStore, useSheetStore } from "@/zustand";
import useSquadStore from "@/zustand/useSquadStore";
import OperatorPicker from "./OperatorPicker";
import AssetPicker from "./AssetPicker";

const NewTeamForm = () => {
	const auth = useAuth();
	const { closeSheet } = useSheetStore();

	const teamName    = useTeamsStore((s) => s.teamName);
	const operators   = useTeamsStore((s) => s.operators);
	const allOperators = useTeamsStore((s) => s.allOperators);
	const assets      = useTeamsStore((s) => s.assets);
	const allVehicles = useTeamsStore((s) => s.allVehicles);
	const fullVehicleList = useTeamsStore((s) => s.fullVehicleList);

	const { squads, fetchSquads } = useSquadStore();

	const {
		fetchOperators,
		fetchVehiclesForTeams,
		resetStore,
		createTeam,
		fetchTeams,
		addAsset,
		removeAsset,
		addOperator,
		removeOperator,
		setTeamName,
	} = useTeamsStore();

	useEffect(() => {
		resetStore();
		fetchOperators();
		fetchVehiclesForTeams();
		fetchSquads();
	}, [fetchOperators, fetchVehiclesForTeams, resetStore, fetchSquads]);

	useEffect(() => {
		if (auth.isAuthenticated && auth.user) {
			useTeamsStore.setState({ createdBy: auth.user.profile.sub });
		}
	}, [auth.isAuthenticated, auth.user]);

	const handleCreateTeam = async (e) => {
		e.preventDefault();
		const storeState = useTeamsStore.getState();
		const teamData = {
			createdBy: storeState.createdBy,
			name: storeState.teamName.trim(),
			AO: storeState.AO || "",
			operators: storeState.operators.length ? storeState.operators : [],
			assets: storeState.assets.length ? storeState.assets : [],
		};
		await createTeam(teamData);
		await fetchTeams();
		await closeSheet();
	};

	return (
		<section className="bg-transparent">
			<div className="py-6 px-4 mx-auto max-w-2xl">
				<form onSubmit={handleCreateTeam} className="flex flex-col gap-6">
					{/* Team Name */}
					<div>
						<label className="block mb-1.5 font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase">
							Team Name
						</label>
						<input
							type="text"
							name="name"
							className="bg-blk/50 border border-lines/40 text-fontz font-mono text-sm rounded-sm outline-none focus:border-lines/70 block w-full px-3 py-2"
							placeholder="Enter team name"
							value={teamName || ""}
							onChange={(e) =>
								setTeamName ?
									setTeamName(e.target.value)
								:	useTeamsStore.setState({ teamName: e.target.value })
							}
							required
						/>
					</div>

					{/* Operators */}
					<div>
						<label className="block mb-3 font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase">
							Operators
						</label>
						<OperatorPicker
							allOperators={allOperators}
							selected={operators}
							squads={squads}
							onAdd={addOperator}
							onRemove={removeOperator}
						/>
					</div>

					{/* Assets */}
					<div>
						<label className="block mb-2 font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase">
							Assets (Vehicles)
						</label>
						<AssetPicker
							allVehicles={allVehicles}
							fullVehicleList={fullVehicleList}
							selected={assets}
							onAdd={addAsset}
							onRemove={removeAsset}
						/>
					</div>

					<Button type="submit" className="btn">
						Create Team
					</Button>
				</form>
			</div>
		</section>
	);
};

export default NewTeamForm;
