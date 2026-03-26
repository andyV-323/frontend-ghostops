import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useOperatorsStore, useTeamsStore } from "@/zustand";
import { useEffect, useMemo } from "react";
import { WEAPONS, ITEMS, PERKS } from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faUserPen,
	faShieldHalved,
	faStar,
} from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";
import { EditOperatorForm } from "./forms";

/* ─── Status config ──────────────────────────────────────────── */
const STATUS = {
	Active: {
		dot: "bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.6)]",
		text: "text-green-400",
		badge: "text-green-400 border-green-900/50 bg-green-900/20",
		label: "ACTIVE",
	},
	Injured: {
		dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
		text: "text-amber-400",
		badge: "text-amber-400 border-amber-900/50 bg-amber-900/20",
		label: "WIA",
	},
	KIA: {
		dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]",
		text: "text-red-400",
		badge: "text-red-400 border-red-900/50 bg-red-900/20",
		label: "KIA",
	},
};

/* ═══════════════════════════════════════════════════════════════ */
const OperatorImageView = ({ operator, openSheet }) => {
	const { selectedOperator, fetchOperatorById } = useOperatorsStore();
	const { teams, fetchTeams } = useTeamsStore();

	useEffect(() => {
		fetchTeams();
	}, [fetchTeams]);

	useEffect(() => {
		if (operator?._id) fetchOperatorById(operator._id);
	}, [operator?._id, fetchOperatorById]);

	const teamName = useMemo(() => {
		const team = teams.find((t) =>
			t.operators?.some((op) => op?._id === operator?._id),
		);
		return team ? team.name : null;
	}, [teams, operator?._id]);

	const squadName =
		selectedOperator?.squad?.name ||
		(typeof selectedOperator?.squad === "string" && selectedOperator.squad) ||
		null;

	if (!selectedOperator) {
		return (
			<div className='flex flex-col items-center justify-center p-12 gap-3'>
				<div className='w-8 h-8 border border-lines/20 rotate-45' />
				<p className='font-mono text-[10px] tracking-[0.2em] text-lines/25 uppercase'>
					Loading Operator Profile
				</p>
			</div>
		);
	}
	const displayImage =
		selectedOperator.imageKey || selectedOperator.image || "/ghost/Default.png";
	const status = STATUS[selectedOperator.status] ?? STATUS.Active;
	const isKIA = selectedOperator.status === "KIA";
	const hasItems =
		Array.isArray(selectedOperator.items) && selectedOperator.items.length > 0;
	const hasPerks =
		Array.isArray(selectedOperator.perks) && selectedOperator.perks.length > 0;
	const primaryWeapon =
		selectedOperator.weaponType ? WEAPONS[selectedOperator.weaponType] : null;

	return (
		<div
			className='relative overflow-hidden bg-blk'
			style={{ minHeight: "100%" }}>
			{/* Corner brackets */}
			{[
				"top-3 left-3 border-t border-l",
				"top-3 right-3 border-t border-r",
				"bottom-3 left-3 border-b border-l",
				"bottom-3 right-3 border-b border-r",
			].map((cls, i) => (
				<div
					key={i}
					className={`absolute w-5 h-5 border-lines/25 z-20 pointer-events-none ${cls}`}
				/>
			))}

			{/* Classification stamp */}
			<div className='absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none'>
				<span className='font-mono text-[7px] tracking-[0.35em] text-red-500/20 uppercase'>
					// TOP SECRET //
				</span>
			</div>

			{/* Operator image */}
			<img
				src={displayImage}
				alt={selectedOperator.callSign}
				className={[
					"w-full object-cover object-top",
					isKIA ? "grayscale opacity-40" : "",
				].join(" ")}
				style={{ minHeight: 420, maxHeight: "100vh" }}
				onError={(e) => {
					e.currentTarget.src = "/ghost/Default.png";
				}}
			/>

			{/* Full overlay — all info lives here */}
			<div
				className='absolute bottom-0 left-0 right-0 z-10'
				style={{
					background:
						"linear-gradient(to top, rgba(5,10,8,1) 0%, rgba(5,10,8,0.92) 30%, rgba(5,10,8,0.6) 55%, rgba(5,10,8,0.15) 75%, transparent 100%)",
				}}>
				<div className='px-4 pb-4 pt-28 flex flex-col gap-3'>
					{/* IDENTITY */}
					<div>
						<h2 className='font-mono text-2xl font-bold text-white tracking-wide truncate leading-none'>
							{selectedOperator.callSign || "Unknown"}
						</h2>
						<p className='font-mono text-[9px] tracking-[0.22em] text-lines/50 uppercase mt-1'>
							{selectedOperator.class || "No Class"}
							{selectedOperator.role ? ` · ${selectedOperator.role}` : ""}
						</p>
						<div className='flex flex-wrap items-center gap-1.5 mt-2'>
							<span
								className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${status.badge}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
								{status.label}
							</span>
							{teamName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines/60 border-lines/20 bg-blk/40'>
									{teamName}
								</span>
							)}
							{squadName && (
								<span className='font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-lines/60 border-lines/20 bg-blk/40'>
									{squadName}
								</span>
							)}
							{selectedOperator.support && (
								<span className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-blue-400/80 border-blue-800/40 bg-blue-900/20'>
									<FontAwesomeIcon
										icon={faShieldHalved}
										className='text-[7px]'
									/>{" "}
									Enabler
								</span>
							)}
							{selectedOperator.aviator && (
								<span className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-sky-400/80 border-sky-800/40 bg-sky-900/20'>
									<FontAwesomeIcon
										icon={faStar}
										className='text-[7px]'
									/>{" "}
									Aviator
								</span>
							)}
						</div>
					</div>
					{/* WEAPON ROW */}
					{(primaryWeapon || selectedOperator.sideArm) && (
						<div className='flex items-center gap-3 pb-2.5 border-b border-lines/10'>
							{primaryWeapon?.imgUrl && (
								<img
									src={primaryWeapon.imgUrl}
									alt='Primary'
									className='w-20 h-10 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.75)" }}
								/>
							)}
							<div className='flex flex-col gap-0.5 min-w-0 flex-1'>
								<span className='font-mono text-[7px] tracking-widest text-lines/30 uppercase'>
									Primary
								</span>
								<span className='font-mono text-[10px] text-fontz/85 truncate'>
									{selectedOperator.weapon || primaryWeapon?.name || "Unknown"}
								</span>
							</div>
							{selectedOperator.sideArm && (
								<div className='flex flex-col gap-0.5 items-end shrink-0'>
									<span className='font-mono text-[7px] tracking-widest text-lines/30 uppercase'>
										Sidearm
									</span>
									<span className='font-mono text-[9px] text-fontz/70 truncate max-w-[100px]'>
										{selectedOperator.sideArm}
									</span>
								</div>
							)}
						</div>
					)}

					{/* ITEMS + PERKS ROW */}
					{(hasItems || hasPerks) && (
						<div className='flex gap-4 pb-2.5 border-b border-lines/10'>
							{hasItems && (
								<div className='flex flex-col gap-1 flex-1 min-w-0'>
									<span className='font-mono text-[7px] tracking-widest text-lines/30 uppercase'>
										Equipment
									</span>
									<div className='flex flex-wrap gap-1.5'>
										{selectedOperator.items.map((item) => (
											<div
												key={item}
												title={item}
												className='flex flex-col items-center gap-0.5'>
												{ITEMS[item] ?
													<img
														src={ITEMS[item]}
														alt={item}
														className='w-7 h-7 object-contain'
														style={{ filter: "invert(1) opacity(0.7)" }}
													/>
												:	<div className='w-7 h-7 border border-lines/15 rounded-sm bg-lines/5 flex items-center justify-center'>
														<span className='font-mono text-[6px] text-lines/20'>
															?
														</span>
													</div>
												}
											</div>
										))}
									</div>
								</div>
							)}
							{hasPerks && (
								<div className='flex flex-col gap-1 flex-1 min-w-0'>
									<span className='font-mono text-[7px] tracking-widest text-lines/30 uppercase'>
										Perks
									</span>
									<div className='flex flex-wrap gap-1.5'>
										{selectedOperator.perks.map((perk) => (
											<div
												key={perk}
												title={perk}
												className='flex flex-col items-center gap-0.5'>
												{PERKS[perk] ?
													<img
														src={PERKS[perk]}
														alt={perk}
														className='w-7 h-7 object-contain'
													/>
												:	<div className='w-7 h-7 border border-lines/15 rounded-sm bg-lines/5 flex items-center justify-center'>
														<span className='font-mono text-[6px] text-lines/20'>
															?
														</span>
													</div>
												}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* BIO */}
					{selectedOperator.bio && (
						<p className='font-mono text-[8px] text-fontz/40 leading-relaxed line-clamp-2 pb-1 border-b border-lines/10'>
							{selectedOperator.bio}
						</p>
					)}
				</div>
			</div>

			{/* Edit button */}
			<button
				onClick={(e) => {
					e.stopPropagation();
					openSheet("right", <EditOperatorForm operator={operator} />);
				}}
				className='absolute top-3 right-10 z-30 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-blk/70 hover:bg-btn/15 px-2.5 py-1.5 rounded-sm transition-all'>
				<FontAwesomeIcon
					icon={faUserPen}
					className='text-[9px]'
				/>
				Edit
			</button>
		</div>
	);
};

OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func,
};

export default OperatorImageView;
