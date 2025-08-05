import { useHandleChange } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { CLASS, KITS, WEAPONS } from "@/config";

const SecondaryClassLoadout = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();
	const handleChange = useHandleChange();

	return (
		<div>
			<h2 className=' text-xl font-bold'>Class 2 Loadout Setup</h2>
			<br />
			{/*CLASS 2*/}
			<div>
				<label className='block mb-2 font-medium'>Class 2</label>
				<select
					className='form'
					value={selectedOperator?.secondaryClass || ""}
					name='secondaryClass'
					onChange={handleChange}>
					<option value=''>select Class</option>
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
			{/*GEAR 2*/}
			{selectedOperator?.secondaryClass && (
				<div>
					<label className='block mb-2 font-medium'>Select Perk</label>
					<select
						name='secondaryGear'
						className='form w-full min-w-[320px]'
						value={selectedOperator?.secondaryGear || ""}
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								secondaryGear: e.target.value,
							})
						}>
						<option value=''>Select Perk </option>
						{Object.entries(KITS)
							.filter(([, kit]) =>
								kit.class.includes(selectedOperator.secondaryClass)
							)
							.map(([key, kit]) => (
								<option
									key={key}
									value={key}>
									{kit.perk}
								</option>
							))}
					</select>
				</div>
			)}
			<br />

			{/*WEAPON 2*/}
			<div>
				<label className='block mb-2 font-medium'>Primary Weapon Type</label>
				<select
					className='form'
					name='primaryWeapon2'
					onChange={(e) =>
						setSelectedOperator({
							...selectedOperator,
							primaryWeapon2: e.target.value,
						})
					}
					value={selectedOperator?.primaryWeapon2 || ""}>
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
			{/*PRIMARY 2*/}
			<div className='w-full'>
				<label className='block mb-2 font-medium'>Primary Weapon</label>
				<input
					type='text'
					name='primaryname2'
					className='form'
					placeholder='Weapon name (e.g., AK-47, M4A1)'
					value={selectedOperator?.primaryname2 || ""}
					onChange={handleChange}></input>
			</div>
			<br />
			{/*WEAPONS 2*/}
			<div>
				<label className='block mb-2 font-medium'>Secondary Weapon Type</label>
				<select
					className='form'
					name='secondaryWeapon2'
					onChange={(e) =>
						setSelectedOperator({
							...selectedOperator,
							secondaryWeapon2: e.target.value,
						})
					}
					value={selectedOperator?.secondaryWeapon2 || ""}>
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
			{/*SECONDARY 2*/}
			<div className='w-full'>
				<label className='block mb-2 font-medium'>Secondary Weapon</label>
				<input
					type='text'
					className='form'
					placeholder='Weapon name (e.g., AK-47, M4A1)'
					name='secondaryname2'
					value={selectedOperator?.secondaryname2 || ""}
					onChange={handleChange}></input>
			</div>
			<br />
			{/*Sidearm*/}
			<div className='w-full'>
				<label className='block mb-2 font-medium '>Side Arm</label>
				<input
					type='text'
					className='form'
					placeholder='Side Arm (e.g., Pistol Name)'
					name='sidearm2'
					value={selectedOperator?.sidearm2 || ""}
					onChange={handleChange}></input>
			</div>
		</div>
	);
};

export default SecondaryClassLoadout;
