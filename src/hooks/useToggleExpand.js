import { useState } from "react";

const useToggleExpand = () => {
	const [expandedIndex, setExpandedIndex] = useState(null);

	const toggleExpand = (index) => {
		setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
	};

	return [expandedIndex, toggleExpand];
};

export default useToggleExpand;
