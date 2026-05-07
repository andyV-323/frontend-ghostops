import { useState, useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { useFormActions } from "@/hooks";
import { useOperatorsStore } from "@/zustand";
import {
	WEAPON_TYPES,
	WEAPONS_BY_TYPE,
	ATTACHMENTS,
	MISSION_PROFILES,
	WEAPON_COMPATIBILITY,
} from "@/config";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faTrash,
	faChevronDown,
	faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";

/* ─── Constants ──────────────────────────────────────────────── */
const ATT_SLOTS = [
	"barrel",
	"muzzle",
	"magazine",
	"scope",
	"rail",
	"underbarrel",
	"stock",
];

const EMPTY_SLOT = {
	weaponType: "",
	weapon: "",
	attachments: {
		barrel: null,
		muzzle: null,
		magazine: null,
		scope: null,
		rail: null,
		underbarrel: null,
		stock: null,
	},
};

const EMPTY_LOADOUT = {
	missionProfile: "",
	primary: { ...EMPTY_SLOT },
	secondary: { ...EMPTY_SLOT },
	handgun: {
		weaponType: "HDG",
		weapon: "",
		attachments: {
			barrel: null,
			muzzle: null,
			magazine: null,
			scope: null,
			rail: null,
			underbarrel: null,
			stock: null,
		},
	},
};

/* ─── Returns compatible attachment options for a weapon + slot ─ */
function getAttOpts(weaponName, slot) {
	if (!weaponName) return [];
	const compat = WEAPON_COMPATIBILITY[weaponName];
	if (!compat) return ATTACHMENTS[slot] || [];
	return compat[slot] || [];
}

/* ─── Single weapon slot builder ────────────────────────────── */
function WeaponBuilder({ label, value, onChange, isHandgun = false }) {
	const weaponTypes = Object.entries(WEAPON_TYPES).filter(([k]) => k !== "HDG");
	const weaponList =
		isHandgun ? WEAPONS_BY_TYPE.HDG || []
		: value.weaponType ? WEAPONS_BY_TYPE[value.weaponType] || []
		: [];

	const handleTypeChange = (e) =>
		onChange({ ...EMPTY_SLOT, weaponType: e.target.value });
	const handleWeaponChange = (e) =>
		onChange({
			...value,
			weapon: e.target.value,
			attachments: { ...EMPTY_SLOT.attachments },
		});
	const handleAtt = (slot, val) =>
		onChange({
			...value,
			attachments: { ...value.attachments, [slot]: val || null },
		});

	const activeSlots =
		value.weapon ?
			ATT_SLOTS.filter((s) => getAttOpts(value.weapon, s).length > 0)
		:	[];

	return (
		<div className='flex flex-col gap-2 p-3 border border-neutral-800/50 bg-neutral-950/20'>
			<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
				{label}
			</p>

			<div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
				{!isHandgun && (
					<select
						className='form text-xs'
						value={value.weaponType || ""}
						onChange={handleTypeChange}>
						<option value=''>— Type —</option>
						{weaponTypes.map(([k, t]) => (
							<option
								key={k}
								value={k}>
								{t.name}
							</option>
						))}
					</select>
				)}
				<select
					className={`form text-xs${isHandgun ? " sm:col-span-2" : ""}`}
					value={value.weapon || ""}
					disabled={!isHandgun && !value.weaponType}
					onChange={handleWeaponChange}>
					<option value=''>— Weapon —</option>
					{weaponList.map((w) => (
						<option
							key={w}
							value={w}>
							{w}
						</option>
					))}
				</select>
			</div>

			{activeSlots.length > 0 && (
				<div className='grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/40'>
					{activeSlots.map((slot) => (
						<div
							key={slot}
							className='flex flex-col gap-1'>
							<p className='font-mono text-[6px] tracking-widest uppercase text-neutral-700'>
								{slot}
							</p>
							<select
								className='form text-[10px]'
								value={value.attachments[slot] || ""}
								onChange={(e) => handleAtt(slot, e.target.value)}>
								<option value=''>— None —</option>
								{getAttOpts(value.weapon, slot).map((opt) => (
									<option
										key={opt}
										value={opt}>
										{opt}
									</option>
								))}
							</select>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   EDITLOADOUT
═══════════════════════════════════════════════════════════════ */
const EditLoadout = ({ operator }) => {
	const { handleUpdateOperator } = useFormActions();
	const { selectedOperator, fetchOperatorById, setSelectedOperator, loading } =
		useOperatorsStore();
	const operatorId = operator._id;

	const [expandedIndex, setExpandedIndex] = useState(null);

	useEffect(() => {
		if (operator) fetchOperatorById(operatorId);
	}, [operatorId, operator, fetchOperatorById]);

	if (loading || !selectedOperator) {
		return (
			<div className='text-center text-gray-400 p-4'>
				Loading operator data...
			</div>
		);
	}

	const loadouts = selectedOperator.loadouts || [];
	const usedProfiles = loadouts.map((l) => l.missionProfile);

	const updateLoadouts = (next) =>
		setSelectedOperator({ ...selectedOperator, loadouts: next });

	const handleAddNew = () => {
		const next = [...loadouts, { ...EMPTY_LOADOUT }];
		updateLoadouts(next);
		setExpandedIndex(next.length - 1);
	};

	const handleDelete = (index) => {
		updateLoadouts(loadouts.filter((_, i) => i !== index));
		if (expandedIndex === index) setExpandedIndex(null);
	};

	const handleWeaponSlotChange = (index, slot, value) => {
		const next = loadouts.map((l, i) =>
			i === index ? { ...l, [slot]: value } : l,
		);
		updateLoadouts(next);
	};

	const handleProfileChange = (index, profile) => {
		const next = loadouts.map((l, i) =>
			i === index ? { ...l, missionProfile: profile } : l,
		);
		updateLoadouts(next);
	};

	return (
		<section className='bg-transparent text-fontz'>
			<h2 className='text-xl font-bold mb-1'>Mission Loadouts</h2>
			<p className='text-xs text-gray-400 mb-5'>
				Build weapon presets per mission profile.
			</p>

			{/* Loadout list */}
			<div className='flex flex-col gap-2 mb-4'>
				{loadouts.length === 0 && (
					<p className='font-mono text-[9px] tracking-widest uppercase text-neutral-600 py-3 text-center border border-neutral-800/40'>
						No loadouts configured
					</p>
				)}

				{loadouts.map((loadout, i) => {
					const profile = MISSION_PROFILES[loadout.missionProfile];
					const isOpen = expandedIndex === i;
					const weapons = [
						loadout.primary?.weapon,
						loadout.secondary?.weapon,
						loadout.handgun?.weapon,
					].filter(Boolean);

					const availableProfiles = Object.entries(MISSION_PROFILES).filter(
						([k]) => k === loadout.missionProfile || !usedProfiles.includes(k),
					);

					return (
						<div
							key={i}
							className='border border-neutral-800/50 bg-neutral-900/20'>
							{/* Row header — click to expand */}
							<div
								role='button'
								tabIndex={0}
								onClick={() => setExpandedIndex(isOpen ? null : i)}
								onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpandedIndex(isOpen ? null : i); }}
								className='w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-neutral-800/20 transition-colors cursor-pointer select-none'>
								<div className='flex-1 min-w-0'>
									<p className='font-mono text-[10px] font-semibold text-neutral-200 truncate'>
										{profile?.name || loadout.missionProfile || "Unconfigured"}
									</p>
									<p className='font-mono text-[7px] text-neutral-600 truncate mt-0.5'>
										{weapons.join(" · ") || "No weapons set"}
									</p>
								</div>
								<div className='flex items-center gap-2 shrink-0 mt-0.5'>
									<button
										type='button'
										onClick={(e) => {
											e.stopPropagation();
											handleDelete(i);
										}}
										className='text-neutral-600 hover:text-red-400 transition-colors px-1'>
										<FontAwesomeIcon
											icon={faTrash}
											className='text-[10px]'
										/>
									</button>
									<FontAwesomeIcon
										icon={isOpen ? faChevronUp : faChevronDown}
										className='text-[9px] text-neutral-500'
									/>
								</div>
							</div>

							{/* Expanded inline editor */}
							{isOpen && (
								<div className='flex flex-col gap-4 px-3 pb-4 pt-1 border-t border-neutral-800/40'>
									{/* Profile selector */}
									<div className='flex flex-col gap-1.5'>
										<p className='font-mono text-[7px] tracking-widest uppercase text-neutral-500'>
											Mission Profile
										</p>
										<select
											className='form'
											value={loadout.missionProfile}
											onChange={(e) => handleProfileChange(i, e.target.value)}>
											<option value=''>— Select Profile —</option>
											{availableProfiles.map(([k, p]) => (
												<option
													key={k}
													value={k}>
													{p.name}
												</option>
											))}
										</select>
										{loadout.missionProfile &&
											MISSION_PROFILES[loadout.missionProfile] && (
												<p className='font-mono text-[7px] text-neutral-600 italic'>
													{MISSION_PROFILES[loadout.missionProfile].description}
												</p>
											)}
									</div>

									<WeaponBuilder
										label='Primary'
										value={loadout.primary || EMPTY_SLOT}
										onChange={(v) => handleWeaponSlotChange(i, "primary", v)}
									/>
									<WeaponBuilder
										label='Secondary'
										value={loadout.secondary || EMPTY_SLOT}
										onChange={(v) => handleWeaponSlotChange(i, "secondary", v)}
									/>
									<WeaponBuilder
										label='Handgun'
										value={
											loadout.handgun || { ...EMPTY_SLOT, weaponType: "HDG" }
										}
										onChange={(v) => handleWeaponSlotChange(i, "handgun", v)}
										isHandgun
									/>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Add button */}
			{loadouts.length < Object.keys(MISSION_PROFILES).length && (
				<button
					type='button'
					onClick={handleAddNew}
					className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase py-2 border border-dashed border-neutral-700/50 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors mt-2'>
					<FontAwesomeIcon
						icon={faPlus}
						className='text-[8px]'
					/>
					Add Loadout
				</button>
			)}

			<div className='flex justify-center mt-6'>
				<Button
					type='button'
					className='btn'
					onClick={(e) => handleUpdateOperator(e, operatorId)}>
					Save Changes
				</Button>
			</div>
		</section>
	);
};

/* ─── PropTypes ──────────────────────────────────────────────── */
WeaponBuilder.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	isHandgun: PropTypes.bool,
};
EditLoadout.propTypes = { operator: OperatorPropTypes.isRequired };

export default EditLoadout;
