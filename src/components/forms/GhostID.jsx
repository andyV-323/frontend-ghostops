import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { ghostID } from "@/config";

const GhostID = () => {
	const handleChange = useHandleChange();
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();
	return (
		<div>
			<h2 className='mb-4 text-xl font-bold text-fontz'>I.D</h2>
			<div>
				{/* FULLNAME */}
				<div className='w-full'>
					<label className='block mb-2 font-medium '>Fullname</label>
					<input
						type='text'
						name='name'
						className='form'
						placeholder='Last name, First name'
						value={selectedOperator?.name || ""}
						onChange={handleChange}
					/>
				</div>
				<br />
				{/* I.D IMAGE */}
				<div className='w-full'>
					<label className='block mb-2 font-medium '>I.D Image</label>
					<select
						className='form'
						value={selectedOperator?.image || ""}
						name='image'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								image: e.target.value,
							})
						}>
						<option value=''>Select Ghost Image</option>
						{Object.keys(ghostID).map((key) => (
							<option
								key={key}
								value={ghostID[key].image}>
								{key}
							</option>
						))}
					</select>
				</div>
				<br />

				{/* CALL SIGN */}
				<div className='w-full'>
					<label className='block mb-2  font-medium '>
						Call Sign<span className='text-red-500'>*</span>
					</label>
					<input
						type='text'
						name='callSign'
						className='form'
						placeholder='Call Sign (e.g., Nomad, Fury)'
						value={selectedOperator?.callSign || ""}
						onChange={handleChange}
						required
					/>
				</div>
				<br />

				{/* ELITE UNIT NAME */}
				<div className='w-full'>
					<label className='block mb-2  font-medium'>Elite Unit Name</label>
					<input
						type='text'
						name='sf'
						className='form'
						placeholder='e.g., Ghost Recon, Navy Seal, SAS'
						value={selectedOperator?.sf || ""}
						onChange={handleChange}
					/>
				</div>
				<br />

				{/* NATIONALITY */}
				<div className='w-full'>
					<label className='block mb-2 font-medium'>Nationality</label>
					<input
						type='text'
						name='nationality'
						className='form'
						placeholder='Nationality (e.g., USA, Canada)'
						value={selectedOperator?.nationality || ""}
						onChange={handleChange}
					/>
				</div>
				<br />
				{/* RANK */}
				<div className='w-full'>
					<label className='block mb-2 font-medium '>Rank</label>
					<input
						type='text'
						name='rank'
						className='form'
						placeholder='Rank'
						value={selectedOperator?.rank || ""}
						onChange={handleChange}
					/>
				</div>
			</div>
		</div>
	);
};

export default GhostID;
