/** @format */

import React, { useState, useEffect } from "react";
import { getMemorialOperators, reviveOperator } from "../../services/api"; // ✅ Import recovery function
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faBoltLightning,
} from "@fortawesome/free-solid-svg-icons";

const Memorial = ({ dataUpdated, refreshData }) => {
	const [KIAOperators, setKIAOperators] = useState([]);
	const [expandedOperator, setExpandedOperator] = useState(null);

	// Fetch injured operators
	useEffect(() => {
		const fetchKIAOperators = async () => {
			try {
				const data = await getMemorialOperators();
				console.log("DEBUG: Injured Operators Data:", data);
				setKIAOperators(data);
			} catch (error) {
				console.error("❌ ERROR fetching injured operators:", error);
			}
		};

		fetchKIAOperators();
	}, [dataUpdated]);

	// Toggle expand/collapse
	const toggleExpand = (index) => {
		setExpandedOperator(expandedOperator === index ? null : index);
	};

	// Handle Recovery
	const handleRevive = async (id) => {
		try {
			await reviveOperator(id);
			// Remove the recovered operator from the UI
			setKIAOperators((prev) => prev.filter((op) => op._id !== id));
			refreshData();
		} catch (error) {
			console.error("❌ ERROR recovering operator:", error);
		}
	};

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<table className='w-full text-sm text-left text-gray-400'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800 '>
					<tr>
						<th className='px-4 md:px-6 py-3'>Name</th>
						<th className='px-4 md:px-6 py-3'>Date</th>
						<th className='px-4 md:px-6 py-3'>Action</th>
					</tr>
				</thead>
				<tbody>
					{KIAOperators.length > 0 ? (
						KIAOperators.map((entry, index) => (
							<React.Fragment key={entry._id}>
								{/* Main Row */}
								<tr
									onClick={() => toggleExpand(index)}
									className='cursor-pointer bg-transparent border-b hover:bg-highlight transition-all duration-300'>
									<th
										scope='row'
										className='flex items-center px-4 md:px-6 py-4 text-gray-400 hover:text-fontz whitespace-nowrap'>
										<img
											className='w-8 h-8 rounded-full border border-lines bg-highlight md:w-10 md:h-10'
											src={entry.operator?.image || "/ghost/Default.png"}
											alt='Profile'
										/>
										<div className='pl-3'>
											<div className='text-sm md:text-base font-semibold'>
												{entry.operator?.callSign || "Unknown Operator"}
											</div>
										</div>
									</th>
									<td className='px-4 md:px-6 py-4'>
										{entry.dateOfDeath} date
									</td>
									<td className='px-4 md:px-6 py-4 flex justify-between items-center'>
										<button
											onClick={(e) => {
												e.stopPropagation(); // Prevent row expansion
												handleRevive(entry._id);
											}}
											className='text-lg text-fontz hover:text-white'>
											<FontAwesomeIcon
												icon={faBoltLightning}
												alt='Revive'
											/>
										</button>
										{/* Expand/Collapse Icon */}
										<FontAwesomeIcon
											icon={
												expandedOperator === index ? faCaretUp : faCaretDown
											}
											className='text-gray-400 text-lg hover:text-white transition-all'
										/>
									</td>
								</tr>

								{/* Expanded Row (Injury Details) */}
								{expandedOperator === index && (
									<tr>
										<td
											colSpan='3'
											className='p-4 bg-blk/50 text-gray-400'>
											<div className='flex flex-col gap-2'>
												<h3 className='text-sm font-semibold'>
													Injury Details
												</h3>
												<p className='text-xs md:text-sm'>{entry.name}</p>
											</div>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					) : (
						<tr>
							<td
								colSpan='3'
								className='text-center py-4 text-gray-400'>
								No Dead Operators.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default Memorial;
