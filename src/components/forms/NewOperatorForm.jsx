/** @format */

import { Button } from "@material-tailwind/react";
import { useState, useEffect } from "react";
import { createOperator } from "../../services/api";
import { WEAPONS } from "../../config/weapons";
import { KITS } from "../../config/kits";
import { useNavigate } from "react-router-dom";
import { ghostID } from "../../config/ghostID";
import { useAuth } from "react-oidc-context"; // Import Cognito auth
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeftLong } from "@fortawesome/free-solid-svg-icons";

const classNames = [
	"Assault",
	"Sharpshooter",
	"Medic",
	"Engineer",
	"Echelon",
	"Pathfinder",
	"Panther",
	"Pilot",
];

const NewOperatorForm = () => {
	const navigate = useNavigate();

	const auth = useAuth(); // Get auth context
	const [operator, setOperator] = useState({
		createdBy: "", // Should be set from authentication
		name: "",
		callSign: "",
		sf: "",
		nationality: "",
		rank: "",
		class: "",
		gear: "",
		secondaryClass: "",
		secondaryGear: "",
		status: "Active",
		primaryWeapon1: "",
		primaryname: "",
		sidearm1: "",
		secondaryWeapon1: "",
		secondaryname: "",
		primaryWeapon2: "",
		primaryname2: "",
		sidearm2: "",
		secondaryWeapon2: "",
		secondaryname2: "",
		image: "",
		bio: "",
	});
	useEffect(() => {
		if (auth.isAuthenticated && auth.user?.access_token) {
			localStorage.setItem("authToken", auth.user.access_token); // ✅ Store token in localStorage
			console.log(
				"DEBUG: Token stored in localStorage:",
				auth.user.access_token
			);
		} else {
			console.warn("WARNING: User is not authenticated, token not stored.");
		}
	}, [auth.isAuthenticated]);

	const handleChange = (e) => {
		const { name, value } = e.target;

		let updatedValue = value;

		// 🔹 Handle gear selection (store image URL)
		if (name === "gear" || name === "secondaryGear") {
			updatedValue = KITS[value]?.img || "/gear/default.png"; // ✅ Store image URL
		}

		// 🔹 Handle weapon selection (store image URL)
		if (
			name === "primaryWeapon1" ||
			name === "secondaryWeapon1" ||
			name === "primaryWeapon2" ||
			name === "secondaryWeapon2"
		) {
			updatedValue = WEAPONS[value]?.imgUrl || "/icons/default_weapon.svg"; // ✅ Store image URL
		}

		console.log(`DEBUG: Setting ${name} to ${updatedValue}`);

		setOperator((prevOperator) => ({
			...prevOperator,
			[name]: updatedValue,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			await createOperator(operator);
			alert("Operator created successfully!");
			navigate("/dashboard");
		} catch (error) {
			console.error("Error creating operator:", error);
			alert("Failed to create operator.");
		}
	};
	const backBtn = () => {
		navigate("/dashboard");
	};
	const cancelBtn = () => {
		navigate("/dashboard");
	};

	return (
		<section className='bg-linear-45 from-blk via-bckground to-neutral-800  '>
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<br />
				<h2 className='mb-4 text-xl font-bold text-fontz'>
					<FontAwesomeIcon
						icon={faArrowLeftLong}
						className='text-2xl text-btn text-black hover:text-white '
						onClick={backBtn}
					/>
					&nbsp;Add a new Operator
				</h2>
				<form>
					<h2 className='mb-4 text-xl font-bold text-fontz'>I.D</h2>
					{/*FULLNAME*/}
					<div className='grid gap-4 sm:grid-cols-2 sm:gap-6'>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Fullname
							</label>
							<input
								type='text'
								name='name'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Last name, First name'
								value={operator.name}
								onChange={handleChange}></input>
						</div>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								I.D Image
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
        focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 '
								value={operator.image || ""}
								name='image'
								onChange={(e) =>
									setOperator({ ...operator, image: e.target.value })
								}>
								<option value=''>Select Ghost</option>
								{Object.keys(ghostID).map((key) => (
									<option
										key={key}
										value={ghostID[key].image}>
										{key}
									</option>
								))}
							</select>
						</div>

						{/*CALL SIGN*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Call Sign<span className='text-red-500'>*</span>
							</label>
							<input
								type='text'
								name='callSign'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Call Sign (e.g., Nomad, Fury)'
								value={operator.callSign}
								onChange={handleChange}
								required></input>
						</div>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Elite Unit Name
							</label>
							<input
								type='text'
								name='sf'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='sf (e.g., Ghost Recon, Navy Seal, SAS)'
								value={operator.sf}
								onChange={handleChange}></input>
						</div>
						{/*NATIONALITY*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Nationality
							</label>
							<input
								type='text'
								name='nationality'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Nationality (e.g., USA, Canada)'
								value={operator.nationality}
								onChange={handleChange}></input>
						</div>

						{/*RANK*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Rank
							</label>
							<input
								type='text'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Rank'
								name='rank'
								value={operator.rank}
								onChange={handleChange}></input>
						</div>

						<h2 className=' text-xl font-bold text-fontz'>
							1. Class Loadout Setup{" "}
						</h2>
						<div></div>
						{/*CLASS*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Class<span className='text-red-500'>*</span>
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 '
								value={operator.class}
								onChange={handleChange}
								name='class'
								required>
								<option value=''>Select Class</option>
								{classNames.map((className) => (
									<option
										key={className}
										value={className}>
										{className}
									</option>
								))}
							</select>
						</div>
						{/*GEAR*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Gear Kit
							</label>
							<select
								name='gear'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
								onChange={handleChange}
								value={operator.gear}>
								<option value=''>Select Kit</option>
								{Object.keys(KITS).map((key) => (
									<option
										key={key}
										value={key}>
										{KITS[key].name}
									</option>
								))}
							</select>
						</div>

						{/*WEAPONS*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Primary Weapon Type
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 '
								name='primaryWeapon1'
								onChange={handleChange}
								value={operator.primaryWeapon1}>
								<option value=''>Select Weapon Type</option>
								{Object.keys(WEAPONS).map((key) => (
									<option
										key={key}
										value={key}>
										{WEAPONS[key].name}
									</option>
								))}
							</select>
						</div>
						{/*PRIMARY*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Primary Weapon
							</label>
							<input
								type='text'
								name='primaryname'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 gray-400'
								placeholder='Weapon name (e.g., AK-47, M4A1)'
								value={operator.primaryname}
								onChange={handleChange}></input>
						</div>
						{/*WEAPONS Cont.*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Seconday Weapon Type
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
								name='secondaryWeapon1'
								onChange={handleChange}
								value={operator.secondaryWeapon1}>
								<option value=''>Select Weapon Type</option>
								{Object.keys(WEAPONS).map((key) => (
									<option
										key={key}
										value={key}>
										{WEAPONS[key].name}
									</option>
								))}
							</select>
						</div>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz '>
								Secondary Weapon
							</label>
							<input
								type='text'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 '
								placeholder='Weapon name (e.g., AK-47, M4A1)'
								name='secondaryname'
								value={operator.secondaryname}
								onChange={handleChange}></input>
						</div>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Side Arm
							</label>
							<input
								type='text'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Side Arm (e.g., Pistol Name)'
								name='sidearm1'
								value={operator.sidearm1}
								onChange={handleChange}></input>
						</div>
						<div></div>
						<h2 className=' text-xl font-bold text-fontz'>
							2. Class Loadout Setup
						</h2>
						<div></div>
						{/*CLASS 2*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Class 2
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
								value={operator.secondaryClass}
								name='secondaryClass'
								onChange={handleChange}>
								<option value=''>Select Class</option>
								{classNames.map((className) => (
									<option
										key={className}
										value={className}>
										{className}
									</option>
								))}
							</select>
						</div>
						{/*GEAR 2*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Gear Kit 2
							</label>
							<select
								name='secondaryGear'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 '
								onChange={handleChange}
								value={operator.secondaryGear}>
								<option value=''>Select Kit</option>
								{Object.keys(KITS).map((key) => (
									<option
										key={key}
										value={key}>
										{KITS[key].name}
									</option>
								))}
							</select>
						</div>

						{/*WEAPON 2*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Primary Weapon Type
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
								name='primaryWeapon2'
								onChange={handleChange}
								value={operator.primaryWeapon2}>
								<option value=''>Select Weapon Type</option>
								{Object.keys(WEAPONS).map((key) => (
									<option
										key={key}
										value={key}>
										{WEAPONS[key].name}
									</option>
								))}
							</select>
						</div>
						{/*PRIMARY 2*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Primary Weapon
							</label>
							<input
								type='text'
								name='primaryname2'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Weapon name (e.g., AK-47, M4A1)'
								value={operator.primaryname2}
								onChange={handleChange}></input>
						</div>
						{/*WEAPONS 2*/}
						<div>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Secondary Weapon Type
							</label>
							<select
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5'
								name='secondaryWeapon2'
								onChange={handleChange}
								value={operator.secondaryWeapon2}>
								<option value=''>Select Weapon Type</option>
								{Object.keys(WEAPONS).map((key) => (
									<option
										key={key}
										value={key}>
										{WEAPONS[key].name}
									</option>
								))}
							</select>
						</div>
						{/*SECONDARY 2*/}
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Secondary Weapon
							</label>
							<input
								type='text'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Weapon name (e.g., AK-47, M4A1)'
								name='secondaryname2'
								value={operator.secondaryname2}
								onChange={handleChange}></input>
						</div>
						<div className='w-full'>
							<label className='block mb-2 text-sm font-medium text-fontz'>
								Side Arm
							</label>
							<input
								type='text'
								className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5'
								placeholder='Side Arm (e.g., Pistol Name)'
								name='sidearm2'
								value={operator.sidearm2}
								onChange={handleChange}></input>
							<div></div>
						</div>
						<div></div>

						<Button
							type='submit'
							className='btn'
							onClick={handleSubmit}>
							Submit
						</Button>

						<Button
							className='btn'
							onClick={cancelBtn}>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</section>
	);
};

export default NewOperatorForm;
