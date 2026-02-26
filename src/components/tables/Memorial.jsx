// Memorial.jsx — redesigned to match UnifiedDashboard HUD aesthetic

import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCaretDown,
	faCaretUp,
	faBoltLightning,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { useToggleExpand } from "@/hooks";
import { useMemorialStore } from "@/zustand";

const Memorial = () => {
	const { KIAOperators, fetchKIAOperators, reviveOperator } =
		useMemorialStore();
	const [expandedOperator, toggleExpand] = useToggleExpand();

	useEffect(() => {
		fetchKIAOperators();
	}, [KIAOperators.length]);

	return (
		<div className='flex flex-col'>
			<table className='w-full text-left'>
				<thead className='sticky top-0 z-10 bg-blk/90 border-b border-lines/20'>
					<tr>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Operator
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
							Date
						</th>
						<th className='px-4 py-3 font-mono text-[10px] tracking-widest text-lines/50 uppercase text-right'>
							Action
						</th>
					</tr>
				</thead>

				<tbody>
					{KIAOperators.length > 0 ?
						KIAOperators.map((entry, index) => (
							<React.Fragment key={entry._id}>
								{/* Main row */}
								<tr
									onClick={() => toggleExpand(index)}
									className='border-b border-lines/10 hover:bg-red-900/10 cursor-pointer transition-colors duration-150 group'>
									{/* Operator */}
									<td className='px-4 py-3'>
										<div className='flex items-center gap-3'>
											<div className='relative shrink-0'>
												<img
													className='w-8 h-8 rounded-full border border-lines/30 bg-highlight object-cover grayscale opacity-60 group-hover:opacity-80 transition-all'
													src={entry.operator?.image || "/ghost/Default.png"}
													alt='Operator'
												/>
												{/* KIA red indicator */}
												<span className='absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-blk bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.65)]' />
											</div>
											<div className='flex flex-col gap-0.5 leading-none'>
												<span className='font-mono text-xs text-fontz/60 group-hover:text-fontz transition-colors'>
													{entry.operator?.callSign || "Unknown"}
												</span>
												<span className='font-mono text-[8px] tracking-widest text-red-500/50 uppercase'>
													KIA
												</span>
											</div>
										</div>
									</td>

									{/* Date of death */}
									<td className='px-4 py-3 font-mono text-[10px] text-lines/35 tracking-widest'>
										{new Date(entry.dateOfDeath).toISOString().split("T")[0]}
									</td>

									{/* Actions */}
									<td className='px-4 py-3'>
										<div className='flex items-center justify-end gap-3'>
											<button
												onClick={(e) => {
													e.stopPropagation();
													reviveOperator(entry._id);
												}}
												className='w-7 h-7 flex items-center justify-center bg-amber-500/10 hover:bg-amber-400 text-amber-500 hover:text-blk border border-amber-800/40 hover:border-amber-400 rounded transition-all'
												title='Revive operator'>
												<FontAwesomeIcon
													icon={faBoltLightning}
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

								{/* Expanded: cause of death */}
								{expandedOperator === index && (
									<tr>
										<td
											colSpan={3}
											className='px-4 py-3 bg-blk/50 border-b border-lines/10'>
											<p className='font-mono text-[9px] tracking-[0.18em] text-red-500/30 uppercase mb-1'>
												After Action Report
											</p>
											<p className='font-mono text-xs text-fontz/50 leading-relaxed'>
												{entry.name || "No additional details on file."}
											</p>
										</td>
									</tr>
								)}
							</React.Fragment>
						))
					:	<tr>
							<td
								colSpan={3}
								className='py-10 text-center'>
								<p className='font-mono text-[10px] tracking-widest text-lines/25 uppercase'>
									No Casualties
								</p>
							</td>
						</tr>
					}
				</tbody>
			</table>
		</div>
	);
};

Memorial.propTypes = {
	dataUpdated: PropTypes.bool,
	refreshData: PropTypes.func,
};

export default Memorial;
