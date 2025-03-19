import React, { useEffect } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faSyringe,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useToggleExpand } from "@/hooks";
import { useInfirmaryStore } from "@/zustand";

const Infirmary = () => {
	const { injuredOperators, fetchInjuredOperators, recoverOperator } =
		useInfirmaryStore();
	const [expandedOperator, toggleExpand] = useToggleExpand();

	// Fetch injured operators
	useEffect(() => {
		fetchInjuredOperators();
	}, [injuredOperators.length]);

	return (
		<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold'>
				Infirmary
			</h1>
			<table className='w-full text-sm text-left text-gray-400'>
				<thead className='text-md text-fontz uppercase bg-linear-to-r/oklch from-blk to-neutral-800 '>
					<tr>
						<th className='px-4 md:px-6 py-3'>Name</th>
						<th className='px-4 md:px-6 py-3'>Recovery</th>
						<th className='px-4 md:px-6 py-3'>Action</th>
					</tr>
				</thead>
				<tbody>
					{injuredOperators.length > 0 ? (
						injuredOperators.map((entry, index) => (
							<React.Fragment
								key={entry.operator?._id || entry.injuredAt || index}>
								{/* Main Row */}
								<tr
									key={`main-${entry.operator?._id || index}`}
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
										{entry.recoveryDays} days
									</td>
									<td className='px-4 md:px-6 py-4 flex justify-between items-center'>
										<button
											onClick={(e) => {
												e.stopPropagation(); // Prevent row expansion
												recoverOperator(entry._id);
											}}
											className='text-xl text-fontz hover:text-white'>
											<FontAwesomeIcon icon={faSyringe} />
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
									<tr key={`expanded-${entry.operator?._id || index}`}>
										<td
											colSpan='3'
											className='p-4 bg-blk/50 text-gray-400'>
											<div className='flex flex-col gap-2'>
												<h3 className='text-sm font-semibold'>
													Injury Details
												</h3>
												<p className='text-xs md:text-sm'>{entry.injuryType}</p>
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
								No Wounded...
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};
Infirmary.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
};

export default Infirmary;
