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
			{/*<img
                className='w-[140px] h-[140px] object-cover rounded-md '
                src={KITS[selectedGear]?.img}
                alt={KITS[selectedGear]?.name}
            />
            <h5 className='mb-2 text-2xl font-bold tracking-tight text-center'>
                {KITS[selectedGear]?.name}
            </h5>*/}
			<h1 className='mt-1 text-lg font-semibold text-center'>
				Perk: {KITS[selectedGear]?.perk}
			</h1>

			<div className='text-center'>
				<h1>{KITS[selectedGear]?.description}</h1>
			</div>

			<div className='p-5'>
				{(() => {
					const perkArray = [1, 2, 3]
						.map((i) => {
							const perk = KITS[selectedGear]?.[`perk${i}`];
							const percentage = KITS[selectedGear]?.[`percentage${i}`];
							if (!perk && !percentage) return null;
							return { perk, percentage, key: i };
						})
						.filter(Boolean); // remove null entries

					const layoutClass =
						perkArray.length < 3
							? "flex justify-center gap-4 flex-wrap"
							: "grid grid-cols-1 gap-4 lg:grid-cols-3";

					return (
						<div className={layoutClass}>
							{perkArray.map(({ perk, percentage, key }) => (
								<div
									key={key}
									className='flex flex-col items-center mb-3 font-normal text-fontz border border-lines rounded-lg bg-blk/50 p-4'>
									<h1 className='text-2xl font-bold text-gray-200'>
										{percentage}
									</h1>
									<h1 className='mt-1 text-sm font-semibold'>{perk}</h1>
								</div>
							))}
						</div>
					);
				})()}
			</div>
		</div>
	);
};

Gear.propTypes = {
	operator: OperatorPropTypes,
	selectedClass: PropTypes.string,
};

export default Gear;
