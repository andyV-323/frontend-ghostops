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
		label: "ACTIVE",
	},
	Injured: {
		dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
		text: "text-amber-400",
		label: "WIA",
	},
	KIA: {
		dot: "bg-red-500   shadow-[0_0_6px_rgba(239,68,68,0.6)]",
		text: "text-red-400",
		label: "KIA",
	},
};

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ label }) {
	return (
		<div className='flex items-center gap-3 mb-3'>
			<div className='w-1 h-3 bg-btn' />
			<span className='font-mono text-[10px] tracking-[0.22em] text-lines/50 uppercase'>
				{label}
			</span>
			<div className='flex-1 h-px bg-lines/10' />
		</div>
	);
}

/* ─── Info row ───────────────────────────────────────────────── */
function InfoRow({ label, value }) {
	if (!value) return null;
	return (
		<div className='flex items-baseline gap-2 py-1.5 border-b border-lines/10 last:border-0'>
			<span className='font-mono text-[9px] tracking-widest text-lines/35 uppercase w-20 shrink-0'>
				{label}
			</span>
			<span className='font-mono text-xs text-fontz/80'>{value}</span>
		</div>
	);
}

/* ─── Gear card ──────────────────────────────────────────────── */
function GearCard({ imgSrc, name, sub }) {
	return (
		<div className='flex flex-col items-center gap-1.5 bg-blk/50 border border-lines/15 rounded-sm p-2.5 hover:border-lines/30 transition-colors'>
			{imgSrc ?
				<img
					src={imgSrc}
					alt={name}
					className='w-10 h-10 object-contain'
				/>
			:	<div className='w-10 h-10 border border-lines/15 rounded-sm bg-lines/5 flex items-center justify-center'>
					<span className='font-mono text-[8px] text-lines/20'>N/A</span>
				</div>
			}
			<span className='font-mono text-[9px] text-lines/50 text-center leading-tight'>
				{name}
			</span>
			{sub && (
				<span className='font-mono text-[8px] text-lines/25 text-center'>
					{sub}
				</span>
			)}
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

	const teamName = useMemo(() => {
		const team = teams.find((t) =>
			t.operators?.some((op) => op?._id === operator?._id),
		);
		return team ? team.name : "Unassigned";
	}, [teams, operator?._id]);

	useEffect(() => {
		if (operator?._id) fetchOperatorById(operator._id);
	}, [operator?._id, fetchOperatorById]);

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
	const status = STATUS[selectedOperator.status] || STATUS.Active;
	const hasItems =
		Array.isArray(selectedOperator.items) && selectedOperator.items.length > 0;
	const hasPerks =
		Array.isArray(selectedOperator.perks) && selectedOperator.perks.length > 0;

	return (
		<section className='text-fontz bg-transparent'>
			{/* ── Dossier header strip ── */}
			<div className='relative overflow-hidden bg-blk/80 border-b border-lines/20 px-5 py-4'>
				{/* Classification watermark */}
				<div className='absolute inset-0 flex items-center justify-center pointer-events-none select-none'>
					<span className='font-mono text-[9px] tracking-[0.4em] text-lines/5 uppercase rotate-[-20deg] text-nowrap scale-150'>
						GHOST RECON // CLASSIFIED
					</span>
				</div>

				<div className='relative flex items-start gap-4'>
					{/* Avatar */}
					<div className='relative shrink-0'>
						<div className='w-16 h-16 rounded-full border-2 border-lines/30 overflow-hidden bg-highlight'>
							<img
								src={displayImage}
								alt={selectedOperator.callSign}
								className={[
									"w-full h-full object-cover object-top",
									selectedOperator.status === "KIA" ?
										"grayscale opacity-60"
									:	"",
								].join(" ")}
								onError={(e) => {
									e.currentTarget.src = "/ghost/Default.png";
								}}
							/>
						</div>
						{/* Status dot */}
						<span
							className={[
								"absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-blk",
								status.dot,
							].join(" ")}
						/>
					</div>

					{/* Identity block */}
					<div className='flex-1 min-w-0'>
						<div className='flex items-start justify-between gap-2'>
							<div>
								<h2 className='font-mono text-base font-bold text-fontz tracking-wide truncate'>
									{selectedOperator.callSign || "Unknown"}
								</h2>
								<p className='font-mono text-[9px] tracking-[0.22em] text-lines/40 uppercase mt-0.5'>
									{selectedOperator.class || "No Class"} ·{" "}
									{selectedOperator.role || "No Role"}
								</p>
							</div>
							{/* Edit button */}
							<button
								onClick={(e) => {
									e.stopPropagation();
									openSheet("right", <EditOperatorForm operator={operator} />);
								}}
								className='flex items-center gap-1.5 font-mono text-[9px] tracking-widest uppercase text-btn hover:text-white border border-btn/30 hover:border-btn/60 bg-btn/5 hover:bg-btn/15 px-2.5 py-1.5 rounded-sm transition-all shrink-0'>
								<FontAwesomeIcon
									icon={faUserPen}
									className='text-[10px]'
								/>
								Edit
							</button>
						</div>

						{/* Status + team tags */}
						<div className='flex flex-wrap gap-2 mt-2.5'>
							<div className='flex items-center gap-1.5'>
								<span
									className={["w-1.5 h-1.5 rounded-full", status.dot].join(" ")}
								/>
								<span
									className={[
										"font-mono text-[9px] tracking-widest uppercase",
										status.text,
									].join(" ")}>
									{status.label}
								</span>
							</div>
							<div className='w-px h-3 bg-lines/20 self-center' />
							<span className='font-mono text-[9px] tracking-widest text-lines/40 uppercase'>
								{teamName}
							</span>
							{selectedOperator.support && (
								<>
									<div className='w-px h-3 bg-lines/20 self-center' />
									<span className='font-mono text-[9px] tracking-widest text-blue-400/70 uppercase'>
										Support
									</span>
								</>
							)}
							{selectedOperator.aviator && (
								<>
									<div className='w-px h-3 bg-lines/20 self-center' />
									<span className='font-mono text-[9px] tracking-widest text-sky-400/70 uppercase'>
										Aviator
									</span>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* ── Full body image ── */}
			<div
				className='relative bg-blk/60 border-b border-lines/15 flex justify-center overflow-hidden'
				style={{ maxHeight: 520 }}>
				{/* Vignette */}
				<div
					className='absolute inset-0 pointer-events-none z-10'
					style={{
						background:
							"radial-gradient(ellipse at center, transparent 40%, rgba(5,8,4,0.7) 100%)",
					}}
				/>
				{/* Corner brackets */}
				{[
					"top-2 left-2 border-t-2 border-l-2",
					"top-2 right-2 border-t-2 border-r-2",
					"bottom-2 left-2 border-b-2 border-l-2",
					"bottom-2 right-2 border-b-2 border-r-2",
				].map((cls, i) => (
					<div
						key={i}
						className={[
							"absolute w-4 h-4 border-lines/30 z-20 pointer-events-none",
							cls,
						].join(" ")}
					/>
				))}
				<img
					src={displayImage}
					alt={selectedOperator.callSign}
					className={[
						"max-w-full max-h-[520px] object-contain relative z-0",
						selectedOperator.status === "KIA" ? "grayscale opacity-50" : "",
					].join(" ")}
					onError={(e) => {
						e.currentTarget.src = "/ghost/Default.png";
					}}
				/>
			</div>

			{/* ── Content body ── */}
			<div className='p-4 flex flex-col gap-5'>
				{/* PROFILE ── */}
				<div>
					<SectionHeader label='Operator Profile' />
					<div className='bg-blk/40 border border-lines/15 rounded-sm px-3 py-1'>
						<InfoRow
							label='Call Sign'
							value={selectedOperator.callSign}
						/>
						<InfoRow
							label='Class'
							value={selectedOperator.class}
						/>
						<InfoRow
							label='Role'
							value={selectedOperator.role}
						/>
						<InfoRow
							label='Team'
							value={teamName}
						/>
						<InfoRow
							label='Status'
							value={selectedOperator.status}
						/>
					</div>
				</div>

				{/* LOADOUT ── */}
				{(selectedOperator.weaponType || selectedOperator.sideArm) && (
					<div>
						<SectionHeader label='Primary Loadout' />

						{/* Primary weapon */}
						{selectedOperator.weaponType && (
							<div className='flex items-center gap-4 bg-blk/40 border border-lines/15 rounded-sm p-3 mb-2'>
								{WEAPONS[selectedOperator.weaponType]?.imgUrl && (
									<img
										src={WEAPONS[selectedOperator.weaponType].imgUrl}
										alt='Primary'
										className='w-24 h-16 object-contain shrink-0'
									/>
								)}
								<div className='flex flex-col gap-0.5'>
									<span className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
										Primary
									</span>
									<span className='font-mono text-xs text-fontz/85'>
										{selectedOperator.weapon ||
											WEAPONS[selectedOperator.weaponType]?.name ||
											"Unknown"}
									</span>
									<span className='font-mono text-[9px] text-lines/35'>
										{WEAPONS[selectedOperator.weaponType]?.name || ""}
									</span>
								</div>
							</div>
						)}

						{/* Sidearm */}
						{selectedOperator.sideArm && (
							<div className='flex items-center gap-4 bg-blk/40 border border-lines/15 rounded-sm p-3'>
								{WEAPONS.Sidearm?.imgUrl && (
									<img
										src={WEAPONS.Sidearm.imgUrl}
										alt='Sidearm'
										className='w-24 h-16 object-contain shrink-0'
									/>
								)}
								<div className='flex flex-col gap-0.5'>
									<span className='font-mono text-[9px] tracking-widest text-lines/30 uppercase'>
										Sidearm
									</span>
									<span className='font-mono text-xs text-fontz/85'>
										{selectedOperator.sideArm}
									</span>
								</div>
							</div>
						)}
					</div>
				)}

				{/* EQUIPMENT ── */}
				{hasItems && (
					<div>
						<SectionHeader label='Equipment' />
						<div className='grid grid-cols-3 gap-2'>
							{selectedOperator.items.map((item) => (
								<GearCard
									key={item}
									imgSrc={ITEMS[item]}
									name={item}
								/>
							))}
						</div>
					</div>
				)}

				{/* PERKS ── */}
				{hasPerks && (
					<div>
						<SectionHeader label='Perks' />
						<div className='grid grid-cols-3 gap-2'>
							{selectedOperator.perks.map((perk) => (
								<GearCard
									key={perk}
									imgSrc={PERKS[perk]}
									name={perk}
								/>
							))}
						</div>
					</div>
				)}

				{/* SPECIALIST TAGS ── */}
				{(selectedOperator.support || selectedOperator.aviator) && (
					<div className='flex flex-col gap-2'>
						{selectedOperator.support && (
							<div className='flex items-center gap-3 bg-blue-900/15 border border-blue-800/30 rounded-sm px-3 py-2'>
								<FontAwesomeIcon
									icon={faShieldHalved}
									className='text-blue-400/70 text-sm'
								/>
								<span className='font-mono text-[10px] tracking-[0.2em] text-blue-400/80 uppercase'>
									Support Specialist
								</span>
							</div>
						)}
						{selectedOperator.aviator && (
							<div className='flex items-center gap-3 bg-sky-900/15 border border-sky-800/30 rounded-sm px-3 py-2'>
								<FontAwesomeIcon
									icon={faStar}
									className='text-sky-400/70 text-sm'
								/>
								<span className='font-mono text-[10px] tracking-[0.2em] text-sky-400/80 uppercase'>
									Aviator
								</span>
							</div>
						)}
					</div>
				)}

				{/* BIO ── */}
				{selectedOperator.bio && (
					<div>
						<SectionHeader label='Operator Bio' />
						<div className='bg-blk/40 border border-lines/15 rounded-sm p-3'>
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
SectionHeader.propTypes = {
	label: PropTypes.string,
};
InfoRow.propTypes = {
	label: PropTypes.string,
	value: PropTypes.string,
};
GearCard.propTypes = {
	imgSrc: PropTypes.string,
	name: PropTypes.string,
	sub: PropTypes.string,
};
OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
	openSheet: PropTypes.func,
};

export default OperatorImageView;
