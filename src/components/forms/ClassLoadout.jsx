import { useHandleChange } from "@/hooks";
import useOperatorsStore from "@/zustand/useOperatorStore";
import { CLASS, KITS, WEAPONS } from "@/config";

const ClassLoadout = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();
	const handleChange = useHandleChange();
	return (
		<div>
			<h2 className='text-xl font-bold  mt-4'>Class Loadout Setup</h2>
			<br />
			{/* CLASS */}
			<div>
				<label className='block mb-2 font-medium '>Class</label>
				<select
					className='form'
					value={selectedOperator?.class || ""}
					onChange={handleChange}
					name='class'
					required>
					<option value=''>Select Class</option>
					{CLASS.map((type) => (
						<option
							key={type}
							value={type}>
							{type}
						</option>
					))}
				</select>
			</div>
			<br />
			{/* ROLE */}

			{selectedOperator?.class && (
				<div>
					<label className='block mb-2 font-medium'>Select Role</label>

					<select
						name='gear'
						className='form w-full min-w-[320px]'
						value={selectedOperator?.gear || ""}
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								gear: e.target.value,
							})
						}>
						<option value=''>Select Role</option>
						{Object.entries(KITS)
							.filter(([, kit]) => kit.class.includes(selectedOperator.class))
							.map(([key, kit]) => (
								<option
									key={key}
									value={key}>
									{kit.name}
								</option>
							))}
					</select>
				</div>
			)}

			<br />

			{/* PRIMARY WEAPON */}
			<div>
				<label className='block mb-2 font-medium '>Primary Weapon Type</label>
				<select
					className='form'
					name='primaryWeapon1'
					onChange={(e) =>
						setSelectedOperator({
							...selectedOperator,
							primaryWeapon1: e.target.value,
						})
					}
					value={selectedOperator?.primaryWeapon1 || ""}>
					<option value=''>Select Weapon Type</option>
					{Object.keys(WEAPONS).map((key) => (
						<option
							key={key}
							value={WEAPONS[key].imgUrl}>
							{key}
						</option>
					))}
				</select>
			</div>
			<br />

			{/* PRIMARY WEAPON NAME */}
			<div className='w-full'>
				<label className='block mb-2  font-medium '>Primary Weapon</label>
				<input
					type='text'
					name='primaryname'
					className='form'
					placeholder='Weapon name (e.g., AK-47, M4A1)'
					value={selectedOperator?.primaryname || ""}
					onChange={handleChange}
				/>
			</div>
			<br />

			{/* SECONDARY WEAPON */}
			<div>
				<label className='block mb-2  font-medium'>Secondary Weapon Type</label>
				<select
					className='form'
					name='secondaryWeapon1'
					onChange={(e) =>
						setSelectedOperator({
							...selectedOperator,
							secondaryWeapon1: e.target.value,
						})
					}
					value={selectedOperator?.secondaryWeapon1 || ""}>
					<option value=''>Select Weapon Type</option>
					{Object.keys(WEAPONS).map((key) => (
						<option
							key={key}
							value={WEAPONS[key].imgUrl}>
							{key}
						</option>
					))}
				</select>
			</div>
			<br />

			{/* SECONDARY WEAPON NAME */}
			<div className='w-full'>
				<label className='block mb-2 font-medium '>Secondary Weapon</label>
				<input
					type='text'
					className='form'
					placeholder='Weapon name (e.g., AK-47, M4A1)'
					name='secondaryname'
					value={selectedOperator?.secondaryname || ""}
					onChange={handleChange}
				/>
			</div>
			<br />

			{/* SIDE ARM */}
			<div className='w-full'>
				<label className='block mb-2 font-medium '>Side Arm</label>
				<input
					type='text'
					className='form'
					placeholder='Side Arm (e.g., Pistol Name)'
					name='sidearm1'
					value={selectedOperator?.sidearm1 || ""}
					onChange={handleChange}
				/>
			</div>
		</div>
	);
};

export default ClassLoadout;
