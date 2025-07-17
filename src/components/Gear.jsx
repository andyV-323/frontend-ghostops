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

	const gearKey = operator.gear;
	const secondaryGearKey = operator.secondaryGear;

	const isPrimary =
		selectedClass === operator.class || selectedClass === `${operator.class}-1`;

	const selectedGear = isPrimary ? gearKey : secondaryGearKey;

	return (
		<div className='  rounded-lg  flex flex-col items-center text-fontz '>
			<img
				className='w-[120px] h-[120px] object-cover rounded-md '
				src={KITS[selectedGear]?.img}
				alt={KITS[selectedGear]?.name}
			/>
			<h5 className='mb-2 text-md font-bold tracking-tight text-center'>
				{KITS[selectedGear]?.name}
			</h5>
		</div>
	);
};

Gear.propTypes = {
	operator: OperatorPropTypes,
	selectedClass: PropTypes.string,
};

export default Gear;
