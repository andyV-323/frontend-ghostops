import { useState, useEffect } from "react";
import { Button } from "@material-tailwind/react";
import { useOperatorsStore, useSheetStore } from "@/zustand";
import { updateOperator } from "@/api/OperatorsApi";
import {
	WEAPON_TYPES,
	WEAPONS_BY_TYPE,
	ATTACHMENTS,
	MISSION_PROFILES,
	WEAPON_COMPATIBILITY,
} from "@/config";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import PropTypes from "prop-types";

/* ─── Constants ──────────────────────────────────────────────── */
const ATT_SLOTS = [
	"barrel",
	"muzzle",
	"scope",
	"rail",
	"underbarrel",
	"stock",
	"magazine",
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
   NEWLOADOUTFORM
═══════════════════════════════════════════════════════════════ */
const NewLoadoutForm = ({ operator }) => {
	const {
		selectedOperator,
		setSelectedOperator,
		fetchOperatorById,
		fetchOperators,
		loading,
	} = useOperatorsStore();
	const { closeSheet } = useSheetStore();
	const operatorId = operator._id;

	const [draft, setDraft] = useState({
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
	});
	const [saving, setSaving] = useState(false);

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

	const usedProfiles = (selectedOperator.loadouts || []).map(
		(l) => l.missionProfile,
	);
	const availableProfiles = Object.entries(MISSION_PROFILES).filter(
		([k]) => !usedProfiles.includes(k),
	);
	const isValid =
		!!draft.missionProfile &&
		(!!draft.primary.weapon ||
			!!draft.secondary.weapon ||
			!!draft.handgun.weapon);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!isValid || saving) return;
		setSaving(true);
		try {
			const updatedLoadouts = [...(selectedOperator.loadouts || []), draft];
			const updated = { ...selectedOperator, loadouts: updatedLoadouts };
			await updateOperator(operatorId, updated);
			setSelectedOperator(updated);
			await fetchOperators();
			closeSheet();
		} finally {
			setSaving(false);
		}
	};

	if (availableProfiles.length === 0) {
		return (
			<section className='bg-transparent text-fontz'>
				<h2 className='text-xl font-bold mb-1'>New Loadout</h2>
				<p className='font-mono text-[9px] tracking-widest uppercase text-neutral-600 py-8 text-center border border-neutral-800/40 mt-4'>
					All mission profiles already have loadouts.
				</p>
			</section>
		);
	}

	return (
		<section className='bg-transparent text-fontz'>
			<h2 className='text-xl font-bold mb-1'>New Loadout</h2>
			<p className='text-xs text-gray-400 mb-5'>
				Configure a weapon preset for a mission profile.
			</p>

			<div className='flex flex-col gap-4'>
				{/* Mission profile */}
				<div className='flex flex-col gap-1.5'>
					<p className='font-mono text-[7px] tracking-widest uppercase text-neutral-500'>
						Mission Profile
					</p>
					<select
						className='form'
						value={draft.missionProfile}
						onChange={(e) =>
							setDraft({ ...draft, missionProfile: e.target.value })
						}>
						<option value=''>— Select Profile —</option>
						{availableProfiles.map(([k, p]) => (
							<option
								key={k}
								value={k}>
								{p.name}
							</option>
						))}
					</select>
					{draft.missionProfile && MISSION_PROFILES[draft.missionProfile] && (
						<p className='font-mono text-[7px] text-neutral-600 italic'>
							{MISSION_PROFILES[draft.missionProfile].description}
						</p>
					)}
				</div>

				{/* Weapon builders */}
				<WeaponBuilder
					label='Primary'
					value={draft.primary}
					onChange={(v) => setDraft({ ...draft, primary: v })}
				/>
				<WeaponBuilder
					label='Secondary'
					value={draft.secondary}
					onChange={(v) => setDraft({ ...draft, secondary: v })}
				/>
				<WeaponBuilder
					label='Handgun'
					value={draft.handgun}
					onChange={(v) => setDraft({ ...draft, handgun: v })}
					isHandgun
				/>

				<div className='flex justify-center pt-2'>
					<Button
						type='button'
						className='btn'
						disabled={!isValid || saving}
						onClick={handleSave}>
						{saving ? "Saving..." : "Save Loadout"}
					</Button>
				</div>
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
NewLoadoutForm.propTypes = { operator: OperatorPropTypes.isRequired };

export default NewLoadoutForm;
