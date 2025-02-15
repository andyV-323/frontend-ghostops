/** @format */

import { useState, useEffect } from "react";
import { getOperators } from "../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightLeft, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const Roster = ({
	setClickedOperator,
	setSelectedClass,
	dataUpdated,
	refreshData,
}) => {
	const [operators, setOperators] = useState([]);
	const [activeClasses, setActiveClasses] = useState({}); // Track active class for each operator
	const [selectedOperator, setSelectedOperator] = useState(null); // Track clicked operator
	const navigate = useNavigate();
	useEffect(() => {
		const fetchOperators = async () => {
			try {
				const data = await getOperators();
				console.log("DEBUG: Operators fetched:", data);
				setOperators(data);
			} catch (error) {
				console.error("Error fetching operators:", error);
			}
		};

		fetchOperators();
	}, [dataUpdated]);

	// 🔀 Toggle between primary and secondary class
	const toggleClass = (operatorId, primaryClass, secondaryClass) => {
		setActiveClasses((prev) => ({
			...prev,
			[operatorId]:
				prev[operatorId] === primaryClass ? secondaryClass : primaryClass,
		}));

		setSelectedClass(
			activeClasses[operatorId] === primaryClass ? secondaryClass : primaryClass
		);
	};
	refreshData();

	return (
		<div className='relative  overflow-x-auto shadow-md sm:rounded-lg'>
			<table className='w-full text-md text-left text-gray-400 '>
				<thead className='text-md text-fontz uppercase  bg-linear-to-r/oklch from-blk to-neutral-800 '>
					<tr>
						<th className='px-4 md:px-6 py-3  flex flex-row'>
							&nbsp;
							<FontAwesomeIcon
								icon={faUserPlus}
								className='bg-btn rounded p-1 text-sm text-black hover:bg-highlight hover:text-white'
								onClick={(e) => {
									e.stopPropagation(); // Prevent row click from expanding
									navigate("/dashboard/new", {});
								}}
							/>
							&nbsp;Name
						</th>
						<th className='px-4 md:px-6 py-3 '>Class</th>
						<th className='px-4 md:px-6 py-3 '>Status</th>
					</tr>
				</thead>

				<tbody>
					{operators.length > 0 ? (
						operators.map((operator) => {
							const activeClass = activeClasses[operator._id] || operator.class;

							return (
								<tr
									key={operator._id}
									className='bg-transparent border-b hover:bg-highlight'
									onClick={() => {
										setClickedOperator(operator);
										setSelectedOperator(operator._id); // Track clicked operator
									}}>
									<th
										scope='row'
										className='flex items-center px-4 md:px-6 py-4 text-gray-400 hover:text-fontz whitespace-nowrap'>
										<img
											className='w-8 h-8 rounded-full border border-lines bg-highlight md:w-10 md:h-10'
											src={operator.image || "/ghost/Default.png"}
											alt={operator.name || "Operator"}
											onError={(e) => (e.target.src = "/ghost/Default.png")}
										/>
										<div className='pl-3'>
											<div className='text-sm md:text-base font-semibold'>
												{operator.callSign || "Unknown Operator"}
											</div>
										</div>
									</th>
									<td className='px-4 md:px-6 py-4'>
										{activeClass || "Unknown"}

										{/* Show Switch Button ONLY if the operator is selected */}
										{selectedOperator === operator._id && (
											<FontAwesomeIcon
												icon={faRightLeft}
												className='ml-3 px-3 py-1 text-xs bg-btn text-bckground rounded hover:bg-lines'
												onClick={(e) => {
													e.stopPropagation(); // Prevent row click from triggering
													toggleClass(
														operator._id,
														operator.class,
														operator.secondaryClass
													);
												}}
											/>
										)}
									</td>
									<td className='px-4 md:px-6 py-4'>
										<div className='flex items-center'>
											<div
												className={`h-2.5 w-2.5 rounded-full ${
													operator.status === "Active"
														? "bg-green-500"
														: operator.status === "Injured"
														? "bg-yellow-500"
														: "bg-red-500"
												} me-2`}></div>
											{operator.status || "KIA"}
										</div>
									</td>
								</tr>
							);
						})
					) : (
						<tr>
							<td
								colSpan='3'
								className='text-center py-4 text-gray-400'>
								Loading operators...
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default Roster;
