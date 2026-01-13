import { KITS, WEAPONS } from "@/config";
import { useOperatorsStore } from "@/zustand";

const useHandleChange = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (!selectedOperator) return;

		if (["support", "aviator"].includes(name)) {
			setSelectedOperator({
				...selectedOperator,
				support: false,
				aviator: false,
				[name]: checked,
			});
			return;
		}

		// Gear images
		if (name === "gear" || name === "secondaryGear") {
			setSelectedOperator({
				...selectedOperator,
				[name]: KITS[value]?.img || "/gear/default.png",
			});
			return;
		}

		// Weapon images
		if (
			name === "primaryWeapon1" ||
			name === "secondaryWeapon1" ||
			name === "primaryWeapon2" ||
			name === "secondaryWeapon2"
		) {
			setSelectedOperator({
				...selectedOperator,
				[name]: WEAPONS[value]?.imgUrl || "/icons/default_weapon.svg",
			});
			return;
		}

		// Default handler
		setSelectedOperator({
			...selectedOperator,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	return handleChange;
};

export default useHandleChange;
