import { useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { useHandleChange, useFormActions } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import { WEAPONS, KITS, CLASS } from "@/config";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";

const EditLoadout = ({ operator }) => {
	const handleChange = useHandleChange();
	const { handleUpdateOperator } = useFormActions();
	const { selectedOperator, fetchOperatorById, setSelectedOperator, loading } =
		useOperatorsStore();
	// Ensure we have an operator ID
	const operatorId = operator._id;
	useEffect(() => {
		if (operator) {
			fetchOperatorById(operatorId);
		}
	}, [operatorId]);
	// Show loading state if data is still being fetched
	if (loading || !selectedOperator) {
		return (
			<div className='text-center text-gray-400 p-4'>
				Loading operator data...
			</div>
		);
	}
	return (
		<section className='bg-transparent text-md text-fontz'>
			<form>
				<h2 className=' text-xl font-bold '>1. Class Loadout Setup </h2>
				<br />
				{/*CLASS*/}
				<div>
					<label className='block mb-2 font-medium'>Class</label>
					<select
						className='form '
						value={selectedOperator.class || ""}
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
				{/*ROLE*/}
				<div>
					<label className='block mb-2 font-medium '>Role</label>
					<select
						name='gear'
						className='form'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								gear: e.target.value,
							})
						}
						value={selectedOperator.gear || ""}>
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
				<br />
				{/*WEAPONS*/}
				<div>
					<label className='block mb-2 font-medium'>Primary Weapon Type</label>
					<select
						className='form '
						name='primaryWeapon1'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								primaryWeapon1: e.target.value,
							})
						}
						value={selectedOperator.primaryWeapon1 || ""}>
						<option value=''>select Weapon Type</option>
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
				{/*PRIMARY*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium'>Primary Weapon</label>
					<input
						type='text'
						name='primaryname'
						className='form'
						placeholder='Weapon name (e.g., AK-47, M4A1)'
						value={selectedOperator.primaryname || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				{/*WEAPONS Cont.*/}
				<div>
					<label className='block mb-2 font-medium'>Seconday Weapon Type</label>
					<select
						className='form'
						name='secondaryWeapon1'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								secondaryWeapon1: e.target.value,
							})
						}
						value={selectedOperator.secondaryWeapon1 || ""}>
						<option value=''>select Weapon Type</option>
						{Object.keys(WEAPONS).map((key) => (
							<option
								key={key}
								value={WEAPONS[key].imgUrl}>
								{key}
							</option>
						))}
					</select>
				</div>
				<div className='w-full'>
					<label className='block mb-2 font-medium'>Secondary Weapon</label>
					<input
						type='text'
						className='form '
						placeholder='Weapon name (e.g., AK-47, M4A1)'
						name='secondaryname'
						value={selectedOperator.secondaryname || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				{/*SIDE ARM*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium'>Side Arm</label>
					<input
						type='text'
						className='form'
						placeholder='Side Arm (e.g., Pistol Name)'
						name='sidearm1'
						value={selectedOperator.sidearm1 || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				<h2 className=' text-xl font-bold'>2. Class Loadout Setup</h2>
				<br />
				{/*CLASS 2*/}
				<div>
					<label className='block mb-2 font-medium'>Class 2</label>
					<select
						className='form'
						value={selectedOperator.secondaryClass || ""}
						name='secondaryClass'
						onChange={handleChange}>
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
				{/*ROLE 2*/}
				<div>
					<label className='block mb-2 font-medium'>Role 2</label>
					<select
						name='secondaryGear'
						className='form '
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								secondaryGear: e.target.value,
							})
						}
						value={selectedOperator.secondaryGear || ""}>
						<option value=''>select Role</option>
						{Object.entries(KITS)
							.filter(([, kit]) =>
								kit.class.includes(selectedOperator.secondaryClass)
							)
							.map(([key, kit]) => (
								<option
									key={key}
									value={key}>
									{kit.name}
								</option>
							))}
					</select>
				</div>
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
						value={selectedOperator.primaryWeapon2 || ""}>
						<option value=''>select Weapon Type</option>
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
						value={selectedOperator.primaryname2 || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				{/*WEAPONS 2*/}
				<div>
					<label className='block mb-2 font-medium'>
						Secondary Weapon Type
					</label>
					<select
						className='form'
						name='secondaryWeapon2'
						onChange={(e) =>
							setSelectedOperator({
								...selectedOperator,
								secondaryWeapon2: e.target.value,
							})
						}
						value={selectedOperator.secondaryWeapon2 || ""}>
						<option value=''>select Weapon Type</option>
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
						value={selectedOperator.secondaryname2 || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				{/*SIDE ARM*/}
				<div className='w-full'>
					<label className='block mb-2 font-medium'>Side Arm</label>
					<input
						type='text'
						className='form'
						placeholder='Side Arm (e.g., Pistol Name)'
						name='sidearm2'
						value={selectedOperator.sidearm2 || ""}
						onChange={handleChange}></input>
				</div>
				<br />
				<div className='flex flex-col items-center'>
					<Button
						type='submit'
						className='btn '
						onClick={(e) => handleUpdateOperator(e, operatorId)}>
						Update
					</Button>
				</div>
			</form>
		</section>
	);
};
EditLoadout.propTypes = {
	operator: OperatorPropTypes.isRequired,
};
export default EditLoadout;
