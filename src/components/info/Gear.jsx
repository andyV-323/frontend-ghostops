/** @format */

import { KITS } from "../../config/kits";

const Gear = ({ operator, selectedClass }) => {
	if (!operator) {
		return (
			<div className='text-gray-400 p-4 text-center'>
				Select an operator to view gear
			</div>
		);
	}

	const gearKey = Object.keys(KITS).find(
		(key) => KITS[key].img === operator.gear
	);
	const secondaryGearKey = Object.keys(KITS).find(
		(key) => KITS[key].img === operator.secondaryGear
	);

	const isPrimary = selectedClass === operator.class;
	const selectedGear = isPrimary ? gearKey : secondaryGearKey;

	return (
		<div className='relative flex flex-col items-center  text-fontz rounded-lg  w-full mx-auto overflow-hidden'>
			<div className='flex justify-center items-center w-full  transition-transform duration-300 ease-in-out'>
				<img
					className='w-[300px] h-[300px]  object-cover rounded-md'
					src={KITS[selectedGear]?.img}
					alt={KITS[selectedGear]?.name}
				/>
			</div>
			<div className='text-sm font-semibold text-center text-gray-400 mt-2'>
				{KITS[selectedGear]?.name}
			</div>
		</div>
	);
};

export default Gear;
