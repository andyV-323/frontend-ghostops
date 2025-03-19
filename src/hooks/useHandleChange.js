import { KITS, WEAPONS } from "@/config";
import { useOperatorsStore } from "@/zustand";

const useHandleChange = () => {
	const { selectedOperator, setSelectedOperator } = useOperatorsStore();

	const handleChange = (e) => {
		if (!e || !e.target) {
			console.error("useChangeLoadout called without an event.");
			return;
		}

		const { name, value } = e.target;

		let updatedValue = value;

		// Handle gear selection (store image URL)
		if (name === "gear" || name === "secondaryGear") {
			updatedValue = KITS[value]?.img || "/gear/default.png";
		}

		// Handle weapon selection (store image URL)
		if (
			name === "primaryWeapon1" ||
			name === "secondaryWeapon1" ||
			name === "primaryWeapon2" ||
			name === "secondaryWeapon2"
		) {
			updatedValue = WEAPONS[value]?.imgUrl || "/icons/default_weapon.svg";
		}

		setSelectedOperator({ ...selectedOperator, [name]: updatedValue });
	};

	return handleChange;
};

export default useHandleChange;
