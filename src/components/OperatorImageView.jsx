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

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ label }) {
	return (
		<div className='flex items-center gap-3 mb-3'>
			<div className='w-1 h-3 bg-btn shrink-0' />
			<span className='font-mono text-[10px] tracking-[0.22em] text-lines/50 uppercase'>
				{label}
			</span>
			<div className='flex-1 h-px bg-lines/10' />
		</div>
	);
}

/* ─── Stat pill ─────────────────────────────────────────────── */
function StatPill({ label, value }) {
	if (!value) return null;
	return (
		<div className='flex flex-col gap-0.5 bg-blk/40 border border-lines/15 rounded-sm px-3 py-1.5 min-w-0'>
			<span className='font-mono text-[8px] tracking-[0.2em] text-lines/30 uppercase'>
				{label}
			</span>
			<span className='font-mono text-[11px] text-fontz/90 truncate'>{value}</span>
		</div>
	);
}

/* ─── Gear card ──────────────────────────────────────────────── */
function GearCard({ imgSrc, name, invert }) {
	return (
		<div className='flex flex-col items-center gap-1.5 bg-blk/50 border border-lines/15 rounded-sm p-2.5 hover:border-lines/30 transition-colors'>
			{imgSrc ? (
				<img src={imgSrc} alt={name} className='w-10 h-10 object-contain' style={invert ? { filter: "invert(1) opacity(0.8)" } : undefined} />
			) : (
				<div className='w-10 h-10 border border-lines/15 rounded-sm bg-lines/5 flex items-center justify-center'>
					<span className='font-mono text-[8px] text-lines/20'>N/A</span>
				</div>
			)}
			<span className='font-mono text-[8px] text-lines/50 text-center leading-tight truncate w-full'>
				{name}
			</span>
		</div>
	);
}

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
	const hasItems = Array.isArray(selectedOperator.items) && selectedOperator.items.length > 0;
	const hasPerks = Array.isArray(selectedOperator.perks) && selectedOperator.perks.length > 0;

	return (
		<section className='text-fontz bg-transparent'>

			{/* ── Hero — full body image + identity overlay ── */}
			<div className='relative overflow-hidden bg-blk/80' style={{ maxHeight: 480 }}>
				{/* Corner brackets */}
				{["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r",
				  "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((cls, i) => (
					<div key={i} className={`absolute w-5 h-5 border-lines/30 z-20 pointer-events-none ${cls}`} />
				))}

				{/* Classification stamp */}
				<div className='absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none'>
					<span className='font-mono text-[8px] tracking-[0.35em] text-red-500/25 uppercase'>
						// TOP SECRET //
					</span>
				</div>

				<img
					src={displayImage}
					alt={selectedOperator.callSign}
					className={[
						"w-full object-contain object-top relative z-0",
						isKIA ? "grayscale opacity-50" : "",
					].join(" ")}
					style={{ maxHeight: 480 }}
					onError={(e) => { e.currentTarget.src = "/ghost/Default.png"; }}
				/>

				{/* Gradient overlay — bottom */}
				<div className='absolute bottom-0 left-0 right-0 z-10'
					style={{ background: "linear-gradient(to top, rgba(5,10,8,0.97) 0%, rgba(5,10,8,0.6) 40%, transparent 100%)" }}>
					<div className='px-4 pb-4 pt-8'>
						{/* Callsign */}
						<h2 className='font-mono text-xl font-bold text-white tracking-wide truncate leading-none'>
							{selectedOperator.callSign || "Unknown"}
						</h2>
						<p className='font-mono text-[9px] tracking-[0.22em] text-lines/50 uppercase mt-1'>
							{selectedOperator.class || "No Class"}{selectedOperator.role ? ` · ${selectedOperator.role}` : ""}
						</p>

						{/* Status + tags row */}
						<div className='flex flex-wrap items-center gap-2 mt-2.5'>
							<span className={`inline-flex items-center gap-1.5 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border ${status.badge}`}>
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
									<FontAwesomeIcon icon={faShieldHalved} className='text-[7px]' />
									Enabler
								</span>
							)}
							{selectedOperator.aviator && (
								<span className='inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-sm border text-sky-400/80 border-sky-800/40 bg-sky-900/20'>
									<FontAwesomeIcon icon={faStar} className='text-[7px]' />
									Aviator
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Edit button — top right */}
				<button
					onClick={(e) => {
						e.stopPropagation();
						openSheet("right", <EditOperatorForm operator={operator} />);
					}}
					className='absolute top-3 right-10 z-30 flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn border border-btn/30 hover:border-btn/60 bg-blk/70 hover:bg-btn/15 px-2.5 py-1.5 rounded-sm transition-all'>
					<FontAwesomeIcon icon={faUserPen} className='text-[9px]' />
					Edit
				</button>
			</div>

			{/* ── Content body ── */}
			<div className='p-4 flex flex-col gap-5'>

				{/* QUICK STATS ── 2-col grid */}
				<div className='grid grid-cols-2 gap-2'>
					<StatPill label='Call Sign' value={selectedOperator.callSign} />
					<StatPill label='Status' value={selectedOperator.status} />
					<StatPill label='Class' value={selectedOperator.class} />
					<StatPill label='Role' value={selectedOperator.role} />
					{teamName && <StatPill label='Team' value={teamName} />}
					{squadName && <StatPill label='Squad' value={squadName} />}
				</div>

				{/* LOADOUT ── */}
				{(selectedOperator.weaponType || selectedOperator.sideArm) && (
					<div>
						<SectionHeader label='Loadout' />
						<div className='flex flex-col gap-2'>
							{selectedOperator.weaponType && (
								<div className='flex items-center gap-4 bg-blk/40 border border-lines/15 rounded-sm p-3'>
									{WEAPONS[selectedOperator.weaponType]?.imgUrl && (
										<img
											src={WEAPONS[selectedOperator.weaponType].imgUrl}
											alt='Primary'
											className='w-20 h-14 object-contain shrink-0'
								style={{ filter: "invert(1) opacity(0.85)" }}
										/>
									)}
									<div className='flex flex-col gap-0.5 min-w-0'>
										<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>Primary</span>
										<span className='font-mono text-xs text-fontz/85 truncate'>
											{selectedOperator.weapon || WEAPONS[selectedOperator.weaponType]?.name || "Unknown"}
										</span>
									</div>
								</div>
							)}
							{selectedOperator.sideArm && (
								<div className='flex items-center gap-4 bg-blk/40 border border-lines/15 rounded-sm p-3'>
									{WEAPONS.Sidearm?.imgUrl && (
										<img src={WEAPONS.Sidearm.imgUrl} alt='Sidearm' className='w-20 h-14 object-contain shrink-0' style={{ filter: "invert(1) opacity(0.85)" }} />
									)}
									<div className='flex flex-col gap-0.5 min-w-0'>
										<span className='font-mono text-[8px] tracking-widest text-lines/30 uppercase'>Sidearm</span>
										<span className='font-mono text-xs text-fontz/85 truncate'>{selectedOperator.sideArm}</span>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* EQUIPMENT ── */}
				{hasItems && (
					<div>
						<SectionHeader label='Equipment' />
						<div className='grid grid-cols-4 gap-2'>
							{selectedOperator.items.map((item) => (
								<GearCard key={item} imgSrc={ITEMS[item]} name={item} invert />
							))}
						</div>
					</div>
				)}

				{/* PERKS ── */}
				{hasPerks && (
					<div>
						<SectionHeader label='Perks' />
						<div className='grid grid-cols-4 gap-2'>
							{selectedOperator.perks.map((perk) => (
								<GearCard key={perk} imgSrc={PERKS[perk]} name={perk} />
							))}
						</div>
					</div>
				)}

				{/* BIO ── */}
				{selectedOperator.bio && (
					<div>
						<SectionHeader label='Operator Bio' />
						<div className='bg-blk/40 border border-lines/15 rounded-sm p-3 border-l-2 border-l-btn/30'>
							<p className='font-mono text-xs text-fontz/65 leading-[1.9] whitespace-pre-wrap'>
								{selectedOperator.bio}
							</p>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

SectionHeader.propTypes = { label: PropTypes.string };
StatPill.propTypes = { label: PropTypes.string, value: PropTypes.string };
GearCard.propTypes = { imgSrc: PropTypes.string, name: PropTypes.string };
OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func,
};

export default OperatorImageView;
