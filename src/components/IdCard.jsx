import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen } from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { EditOperatorForm } from "@/components/forms";
import { KITS } from "@/config";

const IdCard = ({ operator, openSheet, selectedClass }) => {
	if (!operator) {
		return (
			<div className='text-center text-gray-400'>
				Select an operator to view details
			</div>
		);
	}
	// Determine if the selected class is primary or secondary
	const isPrimary =
		selectedClass === operator.class || selectedClass === `${operator.class}-1`;
	const gearKey = operator.gear;
	const secondaryGearKey = operator.secondaryGear;
	const selectedGear = isPrimary ? gearKey : secondaryGearKey;

	return (
		<div className='relative w-[300px] sm:w-[325px] md:w-[325px] lg:w-[295px]  xl:w-[400px] mx-auto mb-4'>
			<div className='flex items-center rounded-lg  overflow-hidden relative'>
				<img
					className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover rounded-lg bg-highlight'
					src={operator.image}
					alt={operator?.name || "Ghost Operator"}
				/>
				<div className='flex flex-col justify-center p-3 w-full'>
					<h5 className='text-lg font-bold text-gray-400'>{operator.sf}</h5>
					<ul className='text-xs sm:text-sm text-gray-400 dark:text-gray-400'>
						<li>
							<strong>Call sign:</strong> {operator.callSign}
						</li>
						<li>
							<strong>Class:</strong>{" "}
							{isPrimary ? `${operator.class} ` : `${operator.secondaryClass}`}
						</li>

						<li>
							<strong>Perk:</strong>
							{KITS[selectedGear]?.perk}
						</li>
						<li>
							<strong>Role:</strong> {KITS[selectedGear]?.name}
						</li>
					</ul>
				</div>

				{/* Edit Button */}
				<FontAwesomeIcon
					className='absolute top-2 right-2 text-xl text-btn cursor-pointer hover:text-white'
					icon={faUserPen}
					onClick={() =>
						openSheet(
							"right",
							<EditOperatorForm operator={operator} />,
							"Edit Operator",
							"Edit the operator's info ."
						)
					}
				/>
			</div>
		</div>
	);
};
IdCard.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func.isRequired,
	selectedClass: PropTypes.string,
};

export default IdCard;
