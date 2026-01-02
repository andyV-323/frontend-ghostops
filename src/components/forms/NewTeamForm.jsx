import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@material-tailwind/react";
import { useTeamsStore, useSheetStore } from "@/zustand";
import { AITeamGenerator } from "@/components/ai";
import { PROVINCES } from "@/config";

const NewTeamForm = () => {
	const auth = useAuth();
	const { closeSheet } = useSheetStore();

	const teamName = useTeamsStore((s) => s.teamName);
	const AO = useTeamsStore((s) => s.AO);
	const operators = useTeamsStore((s) => s.operators);
	const allOperators = useTeamsStore((s) => s.allOperators);

	const assets = useTeamsStore((s) => s.assets);
	const allVehicles = useTeamsStore((s) => s.allVehicles);
	const fullVehicleList = useTeamsStore((s) => s.fullVehicleList);

	// actions
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
		setTeamName, // if you have it, otherwise keep useTeamsStore.setState below
	} = useTeamsStore();

	useEffect(() => {
		resetStore();
		fetchOperators();
		fetchVehiclesForTeams();
	}, [fetchOperators, fetchVehiclesForTeams, resetStore]);

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
		<section className='bg-transparent'>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<form onSubmit={handleCreateTeam}>
					<div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
						{/* Team Name */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-xl font-bold text-fontz'>
								Team Name
							</label>
							<input
								type='text'
								name='name'
								className='bg-blk/50 border border-lines text-fontz text-lg rounded-lg outline-lines block w-full p-2.5'
								placeholder='Enter team name'
								value={teamName || ""}
								onChange={(e) =>
									setTeamName
										? setTeamName(e.target.value)
										: useTeamsStore.setState({ teamName: e.target.value })
								}
								required
							/>
						</div>

						{/* Assets */}
						<div className='sm:col-span-2'>
							<h2 className='mb-4 text-xl font-bold text-fontz'>
								Assets (Vehicles)
							</h2>

							<select
								className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz'
								onChange={(e) => {
									const vid = e.target.value;
									if (vid) {
										addAsset(vid);
										e.target.value = "";
									}
								}}>
								<option value=''>
									-- Select an Asset (Available Vehicles) --
								</option>
								{allVehicles
									.filter((v) => !assets.includes(v._id))
									.map((v) => (
										<option
											key={v._id}
											value={v._id}
											disabled={v.isRepairing}>
											{v.nickName && v.nickName !== "None"
												? `${v.nickName} - `
												: ""}
											{v.vehicle} • {v.condition} • Fuel {v.remainingFuel}%
											{v.isRepairing ? " • Repairing" : ""}
										</option>
									))}
							</select>

							{assets.length > 0 && (
								<ul className='list-disc pl-4 text-fontz text-lg bg-blk/50 border border-lines rounded-lg p-3 mt-3'>
									{assets.map((vehId) => {
										const v = fullVehicleList.find((x) => x._id === vehId);
										return (
											<li
												key={vehId}
												className='flex justify-between items-center py-1'>
												{v
													? `${
															v.nickName && v.nickName !== "None"
																? v.nickName + " - "
																: ""
													  }${v.vehicle}`
													: "Unknown Vehicle"}
												<FontAwesomeIcon
													icon={faXmark}
													className='text-2xl text-btn hover:text-white cursor-pointer'
													onClick={() => removeAsset(vehId)}
												/>
											</li>
										);
									})}
								</ul>
							)}
						</div>

						{/* AO */}
						<div className='sm:col-span-2'>
							<label className='block mb-2 text-xl font-bold text-fontz'>
								Area of Operations (AO)
							</label>
							<select
								className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz'
								value={AO || ""}
								onChange={(e) =>
									useTeamsStore.setState({ AO: e.target.value })
								}>
								<option value=''>-- Select Area of Operations --</option>
								{Object.entries(PROVINCES).map(([key, province]) => (
									<option
										key={key}
										value={key}>
										{key} - {province.biome}
									</option>
								))}
							</select>
						</div>

						{/* Operators */}
						<div className='sm:col-span-2'>
							<h2 className='mb-4 text-xl font-bold text-fontz'>Operators</h2>
							<select
								className='bg-blk/50 border border-lines outline-lines rounded-lg block w-full p-2.5 text-fontz'
								onChange={(e) => {
									const opId = e.target.value;
									if (opId) {
										addOperator(opId);
										e.target.value = "";
									}
								}}>
								<option value=''>-- Select an Operator --</option>
								{allOperators.map((operator) => (
									<option
										key={operator._id}
										value={operator._id}>
										{operator.callSign} - {operator.class} -{" "}
										{operator.secondaryClass}
									</option>
								))}
							</select>

							{operators.length > 0 && (
								<div className='sm:col-span-2 mt-3'>
									<h3 className='mb-2 text-lg font-semibold text-fontz'>
										Selected Operators:
									</h3>
									<ul className='list-disc pl-4 text-fontz text-lg bg-blk/50 border border-lines rounded-lg p-3'>
										{operators.map((opId) => {
											const op = allOperators.find((x) => x._id === opId);
											return (
												<li
													key={opId}
													className='flex justify-between items-center py-1'>
													{op ? op.callSign : "Unknown Operator"}
													<FontAwesomeIcon
														icon={faXmark}
														className='text-2xl text-btn hover:text-white cursor-pointer'
														onClick={() => removeOperator(opId)}
													/>
												</li>
											);
										})}
									</ul>
								</div>
							)}
						</div>
					</div>

					<br />
					<h1 className='text-lg font-bold flex flex-col items-center'>
						A.I Team Generator
					</h1>
					<AITeamGenerator />
					<br />

					<Button
						type='submit'
						className='btn'>
						Create Team
					</Button>
				</form>
			</div>
		</section>
	);
};

export default NewTeamForm;
