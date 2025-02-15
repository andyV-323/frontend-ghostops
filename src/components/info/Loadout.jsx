/** @format */

import { useState } from "react";
// Ensure WEAPONS is imported

const Loadout = ({ operator, selectedClass }) => {
	if (!operator) {
		return (
			<div className='text-gray-400 p-4 text-center'>
				Select an operator to view loadout
			</div>
		);
	}

	// 🔄 Determine if selectedClass is primary or secondary
	const isPrimary = selectedClass === operator.class;

	// 🔄 Extract correct weapon set based on selectedClass
	const loadoutData = [
		{
			name: isPrimary ? operator.primaryname : operator.primaryname2,
			img: isPrimary
				? operator.primaryWeapon1
				: operator.primaryWeapon2 || "/icons/empty.svg",
		},
		{
			name: isPrimary ? operator.secondaryname : operator.secondaryname2,
			img: isPrimary
				? operator.secondaryWeapon1
				: operator.secondaryWeapon2 || "/icons/empty.svg",
		},
		{
			name: isPrimary ? operator.sidearm1 : operator.sidearm2,
			img:
				operator.sidearm1 || operator.sidearm2
					? "/icons/Sidearm.svg"
					: "/icons/empty.svg",
		},
	];

	// 🔄 Split weapons into slides (Each slide contains 3 weapons)
	const slides = [loadoutData];

	// 🔄 State to manage active slide
	const [currentIndex, setCurrentIndex] = useState(0);

	return (
		<div className='relative flex flex-col items-center  text-fontz rounded-lg my-6 w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto overflow-hidden'>
			{/* Weapons Grid - Dynamic */}
			<h4 className='text-md font-bold text-gray-400'>
				{isPrimary
					? `${operator.class} Loadout`
					: `${operator.secondaryClass} Loadout`}
			</h4>
			<div className='flex flex-wrap justify-center gap-6 w-full p-4 transition-transform duration-300 ease-in-out'>
				{slides[currentIndex].map((weapon, idx) => (
					<div
						key={idx}
						className='flex flex-col items-center mt-10'>
						<img
							className='object-cover bg-blk/50 object-center w-auto rounded-lg h-10 md:h-8 lg:h-10 border border-lines'
							src={weapon.img}
							alt={weapon.name}
						/>
						<div className='text-sm font-semibold text-center text-gray-400'>
							{weapon.name}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Loadout;
