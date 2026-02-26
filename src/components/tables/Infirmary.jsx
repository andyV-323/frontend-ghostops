// Infirmary.jsx — redesigned to match UnifiedDashboard HUD aesthetic

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

	useEffect(() => {
		fetchInjuredOperators();
	}, [injuredOperators.length]);

	return (
		<div className='flex flex-col'>
			<table className='w-full text-left'>
				<thead className='sticky top-0 z-10 bg-blk/90 border-b border-lines/20'>
					<tr>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Operator
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Recovery
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase text-right'>
							Action
						</th>
					</tr>
				</thead>

				<tbody>
					{injuredOperators.length > 0 ?
						injuredOperators.map((entry, index) => {
							const recoverySeconds = entry.recoveryHours * 3600;
							const elapsed = Math.floor(
								(Date.now() - new Date(entry.injuredAt)) / 1000,
							);
							const progress = Math.min(
								100,
								Math.floor((elapsed / recoverySeconds) * 100),
							);

							// Color the bar based on recovery progress
							const barColor =
								progress >= 75 ? "bg-green-500"
								: progress >= 40 ? "bg-amber-400"
								: "bg-red-500/70";

							return (
								<React.Fragment
									key={entry.operator?._id || entry.injuredAt || index}>
									{/* Main row */}
									<tr
										onClick={() => toggleExpand(index)}
										className='border-b border-lines/10 hover:bg-highlight/20 cursor-pointer transition-colors duration-150'>
										{/* Operator */}
										<td className='px-4 py-3'>
											<div className='flex items-center gap-3'>
												<div className='relative shrink-0'>
													<img
														className='w-8 h-8 rounded-full border border-lines/30 bg-highlight object-cover'
														src={entry.operator?.image || "/ghost/Default.png"}
														alt='Operator'
													/>
													{/* Amber injury indicator */}
													<span className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]' />
												</div>
												<span className='font-mono text-xs text-fontz'>
													{entry.operator?.callSign || "Unknown"}
												</span>
											</div>
										</td>

										{/* Recovery bar */}
										<td className='px-4 py-3'>
											<div className='flex flex-col gap-1.5 min-w-[100px]'>
												<div className='w-full h-1.5 bg-blk/60 rounded-full overflow-hidden border border-lines/10'>
													<div
														className={[
															"h-full rounded-full transition-all duration-500",
															barColor,
														].join(" ")}
														style={{ width: `${progress}%` }}
													/>
												</div>
												<div className='flex items-center justify-between'>
													<span className='font-mono text-[9px] text-lines/40 tracking-widest'>
														{entry.recoveryHours}h
													</span>
													<span
														className={[
															"font-mono text-[9px] tracking-widest",
															progress >= 75 ? "text-green-500"
															: progress >= 40 ? "text-amber-400"
															: "text-red-400",
														].join(" ")}>
														{progress}%
													</span>
												</div>
											</div>
										</td>

										{/* Actions */}
										<td className='px-4 py-3'>
											<div className='flex items-center justify-end gap-3'>
												<button
													onClick={(e) => {
														e.stopPropagation();
														recoverOperator(entry._id);
													}}
													className='w-7 h-7 flex items-center justify-center bg-btn/20 hover:bg-btn text-btn hover:text-blk border border-btn/30 rounded transition-all'
													title='Discharge operator'>
													<FontAwesomeIcon
														icon={faSyringe}
														className='text-[11px]'
													/>
												</button>
												<FontAwesomeIcon
													icon={
														expandedOperator === index ? faCaretUp : faCaretDown
													}
													className='text-lines/30 text-sm'
												/>
											</div>
										</td>
									</tr>

									{/* Expanded: injury details */}
									{expandedOperator === index && (
										<tr>
											<td
												colSpan={3}
												className='px-4 py-3 bg-blk/50 border-b border-lines/10'>
												<p className='font-mono text-[9px] tracking-[0.18em] text-lines/30 uppercase mb-1'>
													Injury Report
												</p>
												<p className='font-mono text-xs text-fontz/70 leading-relaxed'>
													{entry.injuryType || "Details unavailable."}
												</p>
											</td>
										</tr>
									)}
								</React.Fragment>
							);
						})
					:	<tr>
							<td
								colSpan={3}
								className='py-10 text-center'>
								<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase'>
									No Wounded
								</p>
							</td>
						</tr>
					}
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
