// Desc: This component displays the list of operators in a table format.
//       It allows the user to toggle between primary and secondary classes for each operator.
//       It also allows the user to add a new operator.
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faRightLeft,
	faUserPlus,
	faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useOperatorsStore } from "@/zustand";
import { PropTypes } from "prop-types";
import { useEffect } from "react";
import { NewOperatorForm } from "@/components/forms";
import { useConfirmDialog } from "@/hooks";
import { ConfirmDialog } from "@/components";

const Roster = ({
	operators = [],
	setClickedOperator,
	dataUpdated,
	openSheet,
}) => {
	const {
		activeClasses,
		selectedOperator,
		setSelectedOperator,
		toggleClass,
		fetchOperators,
		deleteOperator,
	} = useOperatorsStore();
	const { isOpen, openDialog, closeDialog, confirmAction } = useConfirmDialog();
	const [removeOperator, setRemoveOperator] = useState(null);

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators, dataUpdated]);

	return (
		<div className='relative  overflow-x-auto shadow-md sm:rounded-lg'>
			<h1 className='flex flex-col items-center text-lg text-fontz font-bold'>
				Roster
			</h1>
			<table className='w-full text-md text-left text-gray-400 '>
				<thead className='text-md text-fontz uppercase  bg-linear-to-r/oklch from-blk to-neutral-800 '>
					<tr>
						<th className='px-4 md:px-6 py-3  flex flex-row'>
							<FontAwesomeIcon
								icon={faUserPlus}
								className='bg-btn rounded p-1 text-sm text-black hover:bg-highlight hover:text-white'
								onClick={() => {
									openSheet(
										"left",
										<NewOperatorForm />,
										"New Operator",
										"Customize an elite operator by selecting their background, class, loadout, and perks for optimal mission performance."
									);
								}}
							/>
							&nbsp;CallSign
						</th>
						<th className='px-4 md:px-6 py-3 '>Class</th>
						<th className='px-4 md:px-6 py-3 '>Status</th>
						<th className='px-4 md:px-6 py-3'></th>
					</tr>
				</thead>

				<tbody>
					{operators ?? [].length > 0 ? (
						operators.map((operator) => {
							const activeClass = activeClasses[operator._id] || operator.class;

							return (
								<tr
									key={operator._id}
									className='bg-transparent border-b hover:bg-highlight'
									onClick={() => {
										setClickedOperator(operator);
										setSelectedOperator(operator._id);
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
												className='ml-3 px-3 py-1 text-xs bg-btn text-background rounded hover:bg-lines'
												onClick={(e) => {
													e.stopPropagation();

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
									<td>
										<FontAwesomeIcon
											icon={faTrash}
											className='text-btn text-2xl cursor-pointer hover:text-blk/50'
											onClick={() => {
												setRemoveOperator(operator);
												openDialog(() => deleteOperator(operator._id));
											}}
											title={`Delete ${operator.callSign || operator.name}`}
										/>
									</td>
								</tr>
							);
						})
					) : (
						<tr>
							<td
								colSpan='3'
								className='text-center py-4 text-gray-400'>
								Click the UserPlus icon to add your first Operator
							</td>
						</tr>
					)}
				</tbody>
			</table>

			{removeOperator && (
				<ConfirmDialog
					isOpen={isOpen}
					closeDialog={() => {
						closeDialog();
						setRemoveOperator(null);
					}}
					confirmAction={() => {
						confirmAction();
						setRemoveOperator(null);
					}}
					title='Confirm Operator Deletion'
					description='This will permanently remove the operator and all associated data. This action cannot be undone.'
					message={`Are you sure you want to delete ${removeOperator.callSign}? Once deleted, all records of this operator will be lost forever.`}
				/>
			)}
		</div>
	);
};
Roster.propTypes = {
	operators: PropTypes.array,
	setClickedOperator: PropTypes.func,
	setSelectedClass: PropTypes.func,
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
	openSheet: PropTypes.func,
};

export default Roster;
