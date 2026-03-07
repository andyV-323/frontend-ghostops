// SquadSelect.jsx
import { useEffect } from "react";
import { useSquadStore } from "@/zustand";
import PropTypes from "prop-types";

const SquadSelect = ({ value, onChange }) => {
	const { squads, fetchSquads } = useSquadStore();

	useEffect(() => {
		fetchSquads();
	}, [fetchSquads]);

	const resolvedValue =
		value && typeof value === "object" ? value._id : value || "";

	return (
		<div className='w-full'>
			<label className='block mb-2 font-medium text-fontz'>Squad</label>
			<select
				className='form'
				name='squad'
				value={resolvedValue}
				onChange={onChange}>
				<option value=''>— Unassigned —</option>
				{squads.map((sq) => (
					<option
						key={sq._id}
						value={sq._id}>
						{sq.name}
					</option>
				))}
			</select>
			<p className='mt-1 text-xs text-gray-400'>
				Assign this operator to a squad.
			</p>
		</div>
	);
};

SquadSelect.propTypes = {
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
	onChange: PropTypes.func.isRequired,
};

export default SquadSelect;
