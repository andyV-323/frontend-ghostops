import { useEffect } from "react";
import { useTeamsStore, useSheetStore } from "@/zustand";
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";
import { PropTypes } from "prop-types";
import { toast } from "react-toastify";
import useSquadStore from "@/zustand/useSquadStore";
import OperatorPicker from "./OperatorPicker";
import AssetPicker from "./AssetPicker";

const EditTeamForm = ({ teamId }) => {
	const auth = useAuth();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();

	const teamName     = useTeamsStore((state) => state.teamName);
	const operators    = useTeamsStore((state) => state.operators);
	const allOperators = useTeamsStore((state) => state.allOperators);
	const assets       = useTeamsStore((state) => state.assets);
	const allVehicles  = useTeamsStore((state) => state.allVehicles);
	const fullVehicleList = useTeamsStore((state) => state.fullVehicleList);

	const { squads, fetchSquads } = useSquadStore();

	const {
		teams,
		fetchOperators,
		fetchTeamById,
		setTeamName,
		updateTeam,
		deleteTeam,
		resetStore,
		fetchTeams,
		addOperator,
		removeOperator,
		addAsset,
		removeAsset,
	} = useTeamsStore();

	const { closeSheet } = useSheetStore();

	useEffect(() => {
		resetStore();
		if (teamId) {
			fetchTeams();
			fetchTeamById(teamId);
			fetchOperators();
			fetchSquads();
		}
	}, [teamId, fetchTeams, fetchTeamById, fetchOperators, resetStore, fetchSquads]);

	useEffect(() => {
		if (auth.isAuthenticated && auth.user) {
			useTeamsStore.setState({ createdBy: auth.user.profile.sub });
		}
	}, [auth.isAuthenticated, auth.user]);

	const handleUpdateTeam = async (e) => {
		e.preventDefault();
		const storeState = useTeamsStore.getState();
		const teamData = {
			_id: teamId,
			createdBy: storeState.createdBy,
			name: teamName.trim(),
			operators: operators.length > 0 ? operators : [],
			assets: storeState.assets.length ? storeState.assets : [],
		};
		try {
			await updateTeam(teamData);
			await fetchTeams();
		} catch (error) {
			toast.error("Error updating team:", error);
		} finally {
			closeSheet();
		}
	};

	const handleDeleteTeam = () => {
		openDialog(async () => {
			await deleteTeam(teamId);
			await fetchTeams();
			await closeSheet();
		});
	};

	return (
		<section className="bg-transparent p-4">
			<div className="flex flex-col gap-6">
				<div className="flex justify-end">
					<button
						type="button"
						onClick={handleDeleteTeam}
						className="text-red-600/60 hover:text-red-500 transition-colors"
						title="Delete Team">
						<FontAwesomeIcon icon={faTrash} className="text-lg" />
					</button>
				</div>

				<form onSubmit={handleUpdateTeam} className="flex flex-col gap-6">
					{/* Team Name */}
					<div>
						<label className="block mb-1.5 font-mono text-[9px] tracking-[0.25em] text-lines/50 uppercase">
							Team Name
						</label>
						<input
							type="text"
							name="name"
							className="bg-blk/50 border border-lines/40 text-fontz font-mono text-sm rounded-sm outline-none focus:border-lines/70 block w-full px-3 py-2"
							value={teamName || ""}
							onChange={(e) => setTeamName(e.target.value)}
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
							teams={teams}
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
						Update Team
					</Button>
				</form>
			</div>

			<ConfirmDialog
				className="text-fontz"
				title="Confirm Team Deletion"
				description="This will permanently remove the team and unassign all its operators. This action cannot be undone."
				message={`Are you sure you want to delete ${teamName}? Once deleted, the team and its assignments will be lost forever.`}
				isOpen={isOpen}
				closeDialog={closeDialog}
				confirmAction={confirmAction}
			/>
		</section>
	);
};

EditTeamForm.propTypes = {
	teamId: PropTypes.string,
};

export default EditTeamForm;
