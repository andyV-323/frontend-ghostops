import PropTypes from "prop-types";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPersonRifle } from "@fortawesome/free-solid-svg-icons";
import { EditLoadout } from "@/components/forms";
import { KITS } from "@/config";

const Loadout = ({ operator, selectedClass, openSheet }) => {
	if (!operator) {
		return <div className='text-gray-400 p-4 text-center'></div>;
	}
	const gearKey = operator.gear;
	const secondaryGearKey = operator.secondaryGear;

	// Determine if the selected class is primary or secondary
	const isPrimary =
		selectedClass === operator.class || selectedClass === `${operator.class}-1`;

	// Extract correct weapon set based on selectedClass
	const loadoutData = [
		{
			name: isPrimary
				? operator.primaryname ?? "Unknown"
				: operator.primaryname2 ?? "Unknown",
			img: isPrimary
				? operator.primaryWeapon1 && operator.primaryWeapon1 !== ""
					? operator.primaryWeapon1
					: "/icons/empty.svg"
				: operator.primaryWeapon2 && operator.primaryWeapon2 !== ""
				? operator.primaryWeapon2
				: "/icons/empty.svg",
		},
		{
			name: isPrimary
				? operator.secondaryname ?? ""
				: operator.secondaryname2 ?? "",
			img: isPrimary
				? operator.secondaryWeapon1 && operator.secondaryWeapon1 !== ""
					? operator.secondaryWeapon1
					: "/icons/empty.svg"
				: operator.secondaryWeapon2 && operator.secondaryWeapon2 !== ""
				? operator.secondaryWeapon2
				: "/icons/empty.svg",
		},
		{
			name: isPrimary ? operator.sidearm1 ?? "" : operator.sidearm2 ?? "",
			img: isPrimary
				? operator.sidearm1 && operator.sidearm1 !== ""
					? "/icons/Sidearm.svg"
					: "/icons/empty.svg"
				: operator.sidearm2 && operator.sidearm2 !== ""
				? "/icons/Sidearm.svg"
				: "/icons/empty.svg",
		},
	];

	const selectedGear = isPrimary ? gearKey : secondaryGearKey;
	const selectedKit = KITS[selectedGear];

	const getKitItems = (kit) => {
		if (!kit) return [];
		const items = [];

		let itemIndex = 1;
		while (kit[`item${itemIndex == 1 ? "" : itemIndex}`]) {
			items.push(kit[`item${itemIndex == 1 ? "" : itemIndex}`]);
			itemIndex++;
		}

		return items;
	};
	const kitItems = getKitItems(selectedKit);

	return (
		<div className='relative flex flex-col items-center text-fontz rounded-lg my-6 w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto overflow-hidden'>
			{/* Weapons Grid - Dynamic */}

			<FontAwesomeIcon
				className='absolute top-2 right-2 text-xl text-btn cursor-pointer hover:text-white'
				icon={faPersonRifle}
				onClick={() =>
					openSheet(
						"right",
						<EditLoadout operator={operator} />,
						"Edit Loadout",
						"Customize the operators loadout and gear."
					)
				}
			/>
			<h5 className='text-md font-semibold text-fontz'>Loadout</h5>
			<div className='flex flex-wrap justify-center gap-6 w-full p-4'>
				{loadoutData.map((weapon, idx) => (
					<div
						key={idx}
						className='flex flex-col items-center'>
						<img
							className='object-cover bg-highlight/50 object-center w-auto rounded-lg h-10 md:h-8 lg:h-10 border border-lines'
							src={weapon.img}
							alt={weapon.name}
						/>
						<div className='text-sm font-semibold text-center text-gray-400'>
							{weapon.name}
						</div>
					</div>
				))}
			</div>
			{/** Dynamic Kit Items Rendering **/}
			{kitItems.length > 0 && (
				<div className='flex flex-col items-center gap-2 mt-4'>
					<h5 className='text-md font-semibold text-fontz'>Items</h5>
					<div className='flex flex-wrap justify-center gap-2'>
						{kitItems.map((item, index) => (
							<div
								key={index}
								className='text-md text-gray-400 flex flex-col items-center'>
								<img
									className='object-cover bg-highlight/50 object-center w-auto rounded-lg h-10 md:h-8 lg:h-10 border border-lines'
									src={item.img}
									alt={item.name}
								/>
								<span className='p-1 text-xs'>{item.name}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

Loadout.propTypes = {
	operator: OperatorPropTypes,
	selectedClass: PropTypes.string,
	openSheet: PropTypes.func.isRequired,
};

export default Loadout;
