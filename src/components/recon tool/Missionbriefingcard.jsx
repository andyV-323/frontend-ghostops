import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCheck,
	faXmark,
	faSkull,
	faSatellite,
	faMicrochip,
	faUserSlash,
	faShieldHalved,
	faTriangleExclamation,
	faHelicopter,
	faVolumeXmark,
	faCrosshairs,
	faBullseye,
	faPeopleGroup,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import { COMPROMISE_META } from "./Reconmodifiers";

const ConditionRow = ({ icon, label, available, delay, invertLabel }) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setVisible(true), delay);
		return () => clearTimeout(t);
	}, [delay]);

	// invertLabel: "available" means a restriction is active (e.g. suppressor required)
	const isPositive = invertLabel ? available : available;
	const statusColor =
		invertLabel ?
			available ? "text-red-400"
			:	"text-emerald-400"
		: available ? "text-emerald-400"
		: "text-red-400";
	const statusText =
		invertLabel ?
			available ? "REQUIRED"
			:	"OPTIONAL"
		: available ? "ACTIVE"
		: "UNAVAILABLE";
	const statusIcon =
		invertLabel ?
			available ? faXmark
			:	faCheck
		: available ? faCheck
		: faXmark;

	return (
		<div
			className={`flex items-center justify-between py-2.5 border-b border-lines/20 last:border-0 transition-all duration-300 ${
				visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
			}`}>
			<div className='flex items-center gap-3'>
				<FontAwesomeIcon
					icon={icon}
					className={`text-sm w-4 ${isPositive ? "text-gray-500" : "text-red-400/60"}`}
				/>
				<span
					className={`text-sm ${
						available ? "text-gray-400"
						: invertLabel ? "text-gray-400"
						: "text-gray-500 line-through"
					}`}>
					{label}
				</span>
			</div>
			<div
				className={`flex items-center gap-1.5 text-xs font-mono font-bold ${statusColor}`}>
				<FontAwesomeIcon
					icon={statusIcon}
					className='text-xs'
				/>
				{statusText}
			</div>
		</div>
	);
};

const MissionBriefingCard = ({ mission, modifiers }) => {
	const [revealed, setRevealed] = useState(false);
	const meta =
		COMPROMISE_META[modifiers.compromiseBadge] ?? COMPROMISE_META["cold"];

	useEffect(() => {
		const t = setTimeout(() => setRevealed(true), 100);
		return () => clearTimeout(t);
	}, []);

	const intelColor =
		modifiers.intelAccuracy >= 80 ? "text-emerald-400"
		: modifiers.intelAccuracy >= 40 ? "text-amber-400"
		: "text-red-400";

	const difficultyColor =
		modifiers.difficulty === "Regular" ? "text-emerald-400"
		: modifiers.difficulty === "Advanced" ? "text-amber-400"
		: "text-red-400";

	return (
		<div
			className={`flex flex-col gap-0 rounded border ${meta.border} overflow-hidden transition-all duration-500 ${
				revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"
			}`}>
			{/* Classification bar */}
			<div className={`px-4 py-1.5 ${meta.bg} border-b ${meta.border}`}>
				<span
					className={`text-xs font-mono font-bold tracking-widest ${meta.color}`}>
					TOP SECRET // NOFORN // GHOST PROTOCOL
				</span>
			</div>

			{/* Recon type banner — only shown for advanced debrief */}
			{modifiers.reconType && modifiers.reconType !== "standard" && (
				<div className='px-4 py-2 bg-gray-800/50 border-b border-lines/20 flex items-center gap-2'>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
						Recon Type:
					</span>
					<span className='text-xs font-mono font-bold text-gray-300 uppercase tracking-widest'>
						{modifiers.reconTypeLabel}
					</span>
				</div>
			)}

			{/* Mission header */}
			<div className={`px-4 py-4 ${meta.bg} border-b ${meta.border}`}>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex flex-col gap-1'>
						<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
							Pre-Mission Assessment
						</span>
						<h2 className='text-fontz text-xl font-bold uppercase tracking-wide'>
							{mission?.name || "Operation"}
						</h2>
					</div>

					{/* Compromise badge */}
					<div
						className={`flex items-center gap-2 px-3 py-1.5 rounded border ${meta.border} ${meta.bg} shrink-0`}>
						<div className={`h-2 w-2 rounded-full ${meta.dot}`} />
						<span
							className={`text-xs font-mono font-bold tracking-widest ${meta.color}`}>
							{meta.label}
						</span>
					</div>
				</div>
			</div>

			{/* Intel accuracy + difficulty */}
			<div className='grid grid-cols-2 border-b border-lines/20'>
				<div className='flex flex-col gap-1 px-4 py-3 border-r border-lines/20'>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-wider'>
						{modifiers.intelLabel || "Intel Accuracy"}
					</span>
					<span className={`text-2xl font-bold font-mono ${intelColor}`}>
						{modifiers.intelAccuracy}%
					</span>
					<span className='text-xs text-gray-600'>
						{modifiers.intelAccuracy === 100 ?
							"All intel confirmed"
						: modifiers.intelAccuracy >= 60 ?
							"Partial intel — verify on insertion"
						: modifiers.intelAccuracy > 0 ?
							"Degraded — treat as unverified"
						:	"No intel available"}
					</span>
				</div>
				<div className='flex flex-col gap-1 px-4 py-3'>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-wider'>
						Difficulty
					</span>
					<span className={`text-2xl font-bold font-mono ${difficultyColor}`}>
						{modifiers.difficulty.toUpperCase()}
					</span>
					<span className='text-xs text-gray-600'>Adjust in-game settings</span>
				</div>
			</div>

			{/* Air Support */}
			<div className='px-4 py-3 border-b border-lines/20'>
				<span className='text-xs font-mono text-gray-500 uppercase tracking-widest block mb-2'>
					Air Support
				</span>
				<ConditionRow
					icon={faCrosshairs}
					label='Armaros Drone'
					available={modifiers.armarosDrone}
					delay={150}
				/>
				<ConditionRow
					icon={faBullseye}
					label='Strike Designator'
					available={modifiers.strikeDesignator}
					delay={250}
				/>
			</div>

			{/* Support & Insertion */}
			<div className='px-4 py-3 border-b border-lines/20'>
				<span className='text-xs font-mono text-gray-500 uppercase tracking-widest block mb-2'>
					Support & Insertion
				</span>
				<ConditionRow
					icon={faSatellite}
					label='UAS / TacMap'
					available={modifiers.UAS}
					delay={450}
				/>
				<ConditionRow
					icon={faMicrochip}
					label='Cross-Com HUD'
					available={modifiers.crossCom}
					delay={550}
				/>
				<ConditionRow
					icon={faHelicopter}
					label='Vehicle Insertion'
					available={modifiers.vehicleInsertion}
					delay={650}
				/>
				<ConditionRow
					icon={faPeopleGroup}
					label='Teammate Abilities'
					available={modifiers.teammateAbilities}
					delay={750}
				/>
			</div>

			{/* Launch Windows */}
			<div className='px-4 py-3 border-b border-lines/20'>
				<span className='text-xs font-mono text-gray-500 uppercase tracking-widest block mb-3'>
					Authorized Launch Windows
				</span>
				<div className='grid grid-cols-2 gap-2'>
					{Object.entries(modifiers.launchWindows).map(([key, window], i) => (
						<div
							key={key}
							className={`flex flex-col gap-0.5 p-2.5 rounded border transition-all duration-300 ${
								window.authorized ?
									"border-emerald-400/30 bg-emerald-400/5"
								:	"border-lines/20 bg-transparent opacity-40"
							}`}
							style={{ transitionDelay: `${850 + i * 100}ms` }}>
							<div className='flex items-center justify-between'>
								<span
									className={`text-xs font-mono font-bold ${window.authorized ? "text-emerald-400" : "text-gray-600"}`}>
									{window.label.toUpperCase()}
								</span>
								<span
									className={`text-xs ${window.authorized ? "text-emerald-400" : "text-gray-700"}`}>
									{window.authorized ? "✓" : "✗"}
								</span>
							</div>
							<span className='text-xs font-mono text-gray-500'>
								{window.hours}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Loadout */}
			<div className='px-4 py-3 border-b border-lines/20'>
				<span className='text-xs font-mono text-gray-500 uppercase tracking-widest block mb-2'>
					Loadout
				</span>
				<ConditionRow
					icon={faVolumeXmark}
					label='Suppressors Available'
					available={modifiers.suppressorsAvailable}
					delay={1050}
				/>
			</div>

			{/* Enemy state */}
			<div className='px-4 py-3 border-b border-lines/20'>
				<div className='flex items-center gap-2 mb-2'>
					<FontAwesomeIcon
						icon={faTriangleExclamation}
						className={`text-xs ${meta.color}`}
					/>
					<span className='text-xs font-mono text-gray-500 uppercase tracking-widest'>
						Enemy State —{" "}
						<span className={`${meta.color}`}>{modifiers.enemyState}</span>
					</span>
				</div>
				<p className='text-xs text-gray-500 leading-relaxed'>
					{modifiers.enemyStateDetail}
				</p>
			</div>

			{/* Casualties */}
			{modifiers.casualties !== "none" && (
				<div
					className={`px-4 py-3 border-b border-lines/20 ${modifiers.casualties === "kia" ? "bg-red-400/5" : "bg-amber-400/5"}`}>
					<div className='flex items-center gap-2'>
						<FontAwesomeIcon
							icon={modifiers.casualties === "kia" ? faSkull : faUserSlash}
							className={
								modifiers.casualties === "kia" ?
									"text-red-400 text-xs"
								:	"text-amber-400 text-xs"
							}
						/>
						<span
							className={`text-xs font-mono font-bold uppercase tracking-widest ${modifiers.casualties === "kia" ? "text-red-400" : "text-amber-400"}`}>
							{modifiers.casualties === "kia" ?
								"KIA — Update operator roster"
							:	"WIA — Operators flagged for medical hold"}
						</span>
					</div>
				</div>
			)}

			{/* Shield status */}
			{modifiers.compromiseBadge === "cold" && (
				<div className='px-4 py-3 bg-emerald-400/5 border-b border-emerald-400/20'>
					<div className='flex items-center gap-2'>
						<FontAwesomeIcon
							icon={faShieldHalved}
							className='text-emerald-400 text-xs'
						/>
						<span className='text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest'>
							Ghost Protocol Maintained — All assets available
						</span>
					</div>
				</div>
			)}

			{/* Asset mismatch warning — advanced debrief only */}
			{modifiers.hasMismatch && (
				<div className='px-4 py-3 border-b border-red-400/20 bg-red-400/5'>
					<div className='flex items-start gap-2'>
						<FontAwesomeIcon
							icon={faTriangleExclamation}
							className='text-red-400 text-xs mt-0.5 shrink-0'
						/>
						<div className='flex flex-col gap-1'>
							<span className='text-xs font-mono font-bold text-red-400 uppercase tracking-widest'>
								Asset Mismatch Detected
							</span>
							<p className='text-xs text-red-400/70 leading-relaxed'>
								{modifiers.mismatchDescription}
							</p>
							<div className='flex flex-wrap gap-1 mt-1'>
								{modifiers.mismatchedAssets.map((asset) => (
									<span
										key={asset}
										className='text-xs font-mono text-red-400 border border-red-400/30 px-1.5 py-0.5 rounded'>
										{asset}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Footer */}
			<div className='px-4 py-2'>
				<span className='text-xs font-mono text-gray-700 uppercase tracking-widest'>
					Ghost Recon — Tactical Assessment System // Confidential
				</span>
			</div>
		</div>
	);
};

ConditionRow.propTypes = {
	icon: PropTypes.object.isRequired,
	label: PropTypes.string.isRequired,
	available: PropTypes.bool.isRequired,
	delay: PropTypes.number.isRequired,
	invertLabel: PropTypes.bool,
};

ConditionRow.defaultProps = {
	invertLabel: false,
};

MissionBriefingCard.propTypes = {
	mission: PropTypes.shape({
		_id: PropTypes.string,
		name: PropTypes.string,
	}),
	modifiers: PropTypes.shape({
		compromiseBadge: PropTypes.oneOf(["cold", "warm", "hot", "burned"])
			.isRequired,
		compromiseLevel: PropTypes.string.isRequired,
		difficulty: PropTypes.oneOf(["Regular", "Advanced", "Extreme"]).isRequired,
		armarosDrone: PropTypes.bool.isRequired,
		strikeDesignator: PropTypes.bool.isRequired,
		UAS: PropTypes.bool.isRequired,
		crossCom: PropTypes.bool.isRequired,
		vehicleInsertion: PropTypes.bool.isRequired,
		teammateAbilities: PropTypes.bool.isRequired,
		suppressorsAvailable: PropTypes.bool.isRequired,
		launchWindows: PropTypes.objectOf(
			PropTypes.shape({
				label: PropTypes.string.isRequired,
				hours: PropTypes.string.isRequired,
				authorized: PropTypes.bool.isRequired,
			}),
		).isRequired,
		teamSize: PropTypes.string,
		intelAccuracy: PropTypes.number.isRequired,
		intelLabel: PropTypes.string,
		reconType: PropTypes.string,
		reconTypeLabel: PropTypes.string,
		hasMismatch: PropTypes.bool,
		mismatchedAssets: PropTypes.arrayOf(PropTypes.string),
		mismatchDescription: PropTypes.string,
		enemyState: PropTypes.string.isRequired,
		enemyStateDetail: PropTypes.string.isRequired,
		casualties: PropTypes.oneOf(["none", "wia", "kia"]).isRequired,
	}).isRequired,
};

export default MissionBriefingCard;
