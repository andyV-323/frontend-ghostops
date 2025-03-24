import { KITS } from "../config";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import PropTypes from "prop-types";

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

	const isPrimary =
		selectedClass === operator.class ||
		selectedClass === `${operator.class}-Primary`;

	const selectedGear = isPrimary ? gearKey : secondaryGearKey;

	return (
		<div className='  rounded-lg  flex flex-col items-center text-fontz '>
			<img
				className='w-[140px] h-[140px] object-cover rounded-md '
				src={KITS[selectedGear]?.img}
				alt={KITS[selectedGear]?.name}
			/>
			<h5 className='mb-2 text-2xl font-bold tracking-tight'>
				{KITS[selectedGear]?.name}
			</h5>
			<h1 className='mt-1 text-lg font-semibold'>
				Perk: {KITS[selectedGear]?.perk}
			</h1>
			<h1>{KITS[selectedGear]?.description}</h1>
			<div className='p-5'>
				<div className='grid grid-cols-1 gap-4 lg:grid-cols-3 flex-grow '>
					<div className='flex flex-col items-center mb-3 font-normal text-fontz border border-lines rounded-lg bg-blk/50 p-4'>
						<h1 className='text-2xl font-bold text-gray-200'>
							{KITS[selectedGear]?.percentage1}
						</h1>
						<h1 className='mt-1 text-sm font-semibold'>
							{KITS[selectedGear]?.perk1}
						</h1>
					</div>
					<div className='flex flex-col items-center mb-3 font-normal text-fontz border border-lines rounded-lg bg-blk/50 p-4'>
						<h1 className='text-2xl font-bold text-gray-200'>
							{KITS[selectedGear]?.percentage2}
						</h1>
						<h1 className='mt-1 text-sm font-semibold'>
							{KITS[selectedGear]?.perk2}
						</h1>
					</div>
					<div className='flex flex-col items-center mb-3 font-normal text-fontz border border-lines rounded-lg bg-blk/50 p-4'>
						<h1 className='text-2xl font-bold text-gray-200'>
							{KITS[selectedGear]?.percentage3}
						</h1>
						<h1 className='mt-1 text-md font-semibold'>
							{KITS[selectedGear]?.perk3}
						</h1>
					</div>
				</div>
			</div>
		</div>
	);
};

Gear.propTypes = {
	operator: OperatorPropTypes,
	selectedClass: PropTypes.string,
};

export default Gear;
