// Armory.jsx — Kit Repository

import { useState, useEffect } from "react";
import { useKitsStore } from "@/zustand";
import { KIT_TYPES } from "@/utils/operatorImage";
import {
	WEAPON_TYPES,
	WEAPONS_BY_TYPE,
	ATTACHMENTS,
	WEAPON_COMPATIBILITY,
	ITEMS,
	PERKS,
} from "@/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPlus,
	faTrash,
	faPen,
	faGun,
	faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import PropTypes from "prop-types";

/* ─── Constants ─────────────────────────────────────────────── */
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

const EMPTY_KIT = {
	name: "",
	type: "specialty",
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
	items: [],
};

function getAttOpts(weaponName, slot) {
	if (!weaponName) return [];
	const compat = WEAPON_COMPATIBILITY[weaponName];
	if (!compat) return ATTACHMENTS[slot] || [];
	return compat[slot] || [];
}

/* ─── WeaponBuilder ─────────────────────────────────────────── */
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

WeaponBuilder.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	isHandgun: PropTypes.bool,
};

/* ─── Kit Card ──────────────────────────────────────────────── */
function KitCard({ kit, onEdit, onDelete }) {
	const weapons = [
		kit.primary?.weapon && {
			label: "PRI",
			weapon: kit.primary.weapon,
			type: kit.primary.weaponType,
		},
		kit.secondary?.weapon && {
			label: "SEC",
			weapon: kit.secondary.weapon,
			type: kit.secondary.weaponType,
		},
		kit.handgun?.weapon && {
			label: "HDG",
			weapon: kit.handgun.weapon,
			type: "HDG",
		},
	].filter(Boolean);

	return (
		<div
			className='flex flex-col border border-neutral-800/60 bg-neutral-900/40 hover:border-neutral-700/50 transition-colors overflow-hidden cursor-pointer'
			onClick={() => onEdit(kit)}>
			{/* Header */}
			<div className='flex items-center gap-2 px-3 py-2.5 border-b border-neutral-800/60 bg-neutral-950/60'>
				<div className='w-1.5 h-1.5 bg-btn/60 shrink-0' />
				<span className='font-mono text-[11px] font-bold text-neutral-100 flex-1 truncate tracking-wide uppercase'>
					{kit.name}
				</span>
				<span className='font-mono text-[7px] tracking-widest uppercase text-neutral-600 border border-neutral-800/40 px-1.5 py-0.5 shrink-0'>
					{KIT_TYPES[kit.type] ?? "Specialty"}
				</span>
				<div className='flex items-center gap-1 shrink-0'>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onEdit(kit);
						}}
						className='w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-btn border border-neutral-800/40 hover:border-btn/30 bg-neutral-950/40 transition-colors'>
						<FontAwesomeIcon
							icon={faPen}
							className='text-[8px]'
						/>
					</button>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onDelete(kit._id);
						}}
						className='w-6 h-6 flex items-center justify-center text-neutral-600 hover:text-red-400 border border-neutral-800/40 hover:border-red-900/30 bg-neutral-950/40 transition-colors'>
						<FontAwesomeIcon
							icon={faTrash}
							className='text-[8px]'
						/>
					</button>
				</div>
			</div>

			{/* Weapons */}
			<div className='px-3 py-3 flex flex-col gap-1.5 flex-1'>
				{weapons.length > 0 ?
					weapons.map(({ label, weapon, type }) => (
						<div
							key={label}
							className='flex items-center gap-2 min-w-0'>
							<span className='font-mono text-[6px] tracking-widest uppercase text-neutral-700 w-6 shrink-0'>
								{label}
							</span>
							{type && WEAPON_TYPES[type]?.imgUrl && (
								<img
									src={WEAPON_TYPES[type].imgUrl}
									alt=''
									className='w-7 h-3.5 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.25)" }}
								/>
							)}
							<span className='font-mono text-[9px] text-neutral-400 truncate'>
								{weapon}
							</span>
						</div>
					))
				:	<span className='font-mono text-[8px] text-neutral-700 italic'>
						No weapons configured
					</span>
				}
			</div>

			{/* Items strip */}
			{kit.items?.length > 0 && (
				<div className='px-3 pb-3 flex flex-wrap gap-1.5 border-t border-neutral-800/40 pt-2.5'>
					{kit.items.map(
						(item) =>
							ITEMS[item] && (
								<div
									key={item}
									title={item}
									className='flex items-center gap-1 bg-neutral-950/60 border border-neutral-800/40 px-1.5 py-1'>
									<img
										src={ITEMS[item]}
										alt={item}
										className='w-4 h-4 object-contain'
										style={{ filter: "invert(1) opacity(0.45)" }}
									/>
									<span className='font-mono text-[6px] text-neutral-600 truncate max-w-14'>
										{item}
									</span>
								</div>
							),
					)}
				</div>
			)}
			{/* Items strip */}
			{kit.perks?.length > 0 && (
				<div className='px-3 pb-3 flex flex-wrap gap-1.5 border-t border-neutral-800/40 pt-2.5'>
					{kit.perks.map(
						(perk) =>
							PERKS[perk] && (
								<div
									key={perk}
									title={perk}
									className='flex items-center gap-1 bg-neutral-950/60 border border-neutral-800/40 px-1.5 py-1'>
									<img
										src={PERKS[perk]}
										alt={perk}
										className='w-4 h-4 object-contain'
										style={{ filter: "invert(1) opacity(0.45)" }}
									/>
									<span className='font-mono text-[6px] text-neutral-600 truncate max-w-14'>
										{perk}
									</span>
								</div>
							),
					)}
				</div>
			)}
		</div>
	);
}

KitCard.propTypes = {
	kit: PropTypes.object.isRequired,
	onEdit: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

/* ─── Kit Form ──────────────────────────────────────────────── */
function KitForm({ initial, onSave, onCancel, saving }) {
	const [kit, setKit] = useState(() => ({
		name: initial?.name || "",
		type: initial?.type || "specialty",
		primary: initial?.primary || { ...EMPTY_SLOT },
		secondary: initial?.secondary || { ...EMPTY_SLOT },
		handgun: initial?.handgun || {
			weaponType: "HDG",
			weapon: "",
			attachments: { ...EMPTY_SLOT.attachments },
		},
		items: initial?.items || [],
		perks: initial?.perks || [],
	}));

	const setSlot = (slot, val) => setKit((k) => ({ ...k, [slot]: val }));
	const setField = (field, val) => setKit((k) => ({ ...k, [field]: val }));

	const addItem = (item) => {
		if (item && !kit.items.includes(item))
			setField("items", [...kit.items, item]);
	};
	const removeItem = (item) =>
		setField(
			"items",
			kit.items.filter((i) => i !== item),
		);
	const addPerk = (perk) => {
		if (perk && !kit.perks.includes(perk))
			setField("perks", [...kit.perks, perk]);
	};
	const removePerk = (perk) =>
		setField(
			"perks",
			kit.perks.filter((i) => i !== perk),
		);

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='shrink-0 px-4 py-3 border-b border-neutral-800/60 flex items-center gap-3 bg-neutral-950/40'>
				<button
					type='button'
					onClick={onCancel}
					className='font-mono text-[9px] tracking-widest uppercase text-neutral-500 hover:text-neutral-200 transition-colors'>
					‹ Cancel
				</button>
				<span className='flex-1 font-mono text-[9px] text-neutral-600 tracking-widest uppercase text-right'>
					{initial?._id ? "Edit Kit" : "New Kit"}
				</span>
			</div>

			{/* Body */}
			<div className='flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6'>
				{/* Name + Type */}
				<div className='flex flex-col gap-1.5'>
					<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
						Kit Designation
					</p>
					<input
						type='text'
						className='form'
						placeholder='e.g. Alpha Strike, Recon Package…'
						value={kit.name}
						onChange={(e) => setField("name", e.target.value)}
					/>
				</div>
				<div className='flex flex-col gap-1.5'>
					<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
						Type
					</p>
					<select
						className='form text-xs'
						value={kit.type || "specialty"}
						onChange={(e) => setField("type", e.target.value)}>
						{Object.entries(KIT_TYPES).map(([k, label]) => (
							<option key={k} value={k}>{label}</option>
						))}
					</select>
				</div>

				{/* Weapons */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-neutral-800/40'>
						<div className='w-0.5 h-3 bg-btn/40' />
						<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
							Weapons
						</p>
					</div>
					<WeaponBuilder
						label='Primary'
						value={kit.primary || EMPTY_SLOT}
						onChange={(v) => setSlot("primary", v)}
					/>
					<WeaponBuilder
						label='Secondary'
						value={kit.secondary || EMPTY_SLOT}
						onChange={(v) => setSlot("secondary", v)}
					/>
					<WeaponBuilder
						label='Handgun'
						value={kit.handgun || { ...EMPTY_SLOT, weaponType: "HDG" }}
						onChange={(v) => setSlot("handgun", v)}
						isHandgun
					/>
				</div>

				{/* Equipment */}
				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-neutral-800/40'>
						<div className='w-0.5 h-3 bg-btn/40' />
						<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
							Equipment
						</p>
					</div>
					<div className='flex flex-wrap gap-1.5 min-h-8'>
						{kit.items.length === 0 ?
							<span className='font-mono text-[8px] text-neutral-700 italic self-center'>
								No equipment selected
							</span>
						:	kit.items.map((item) => (
								<div
									key={item}
									className='flex items-center gap-1.5 bg-neutral-950/60 border border-neutral-800/50 px-2 py-1'>
									{ITEMS[item] && (
										<img
											src={ITEMS[item]}
											alt={item}
											className='w-4 h-4 object-contain'
											style={{ filter: "invert(1) opacity(0.55)" }}
										/>
									)}
									<span className='font-mono text-[8px] text-neutral-400'>
										{item}
									</span>
									<button
										type='button'
										onClick={() => removeItem(item)}
										className='text-neutral-600 hover:text-red-400 ml-0.5 transition-colors leading-none'>
										×
									</button>
								</div>
							))
						}
					</div>
					<select
						className='form'
						value=''
						onChange={(e) => addItem(e.target.value)}>
						<option value=''>— Add equipment —</option>
						{Object.keys(ITEMS)
							.filter((i) => !kit.items.includes(i))
							.map((item) => (
								<option
									key={item}
									value={item}>
									{item}
								</option>
							))}
					</select>
				</div>
				{/* Perks */}
				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-neutral-800/40'>
						<div className='w-0.5 h-3 bg-btn/40' />
						<p className='font-mono text-[7px] tracking-[0.3em] uppercase text-neutral-500'>
							Perks
						</p>
					</div>
				</div>
				<div className='flex flex-wrap gap-1.5 min-h-8'>
					{kit.perks.length === 0 ?
						<span className='font-mono text-[8px] text-neutral-700 italic self-center'>
							No perks selected
						</span>
					:	kit.perks.map((perk) => (
							<div
								key={perk}
								className='flex items-center gap-1.5 bg-neutral-950/60 border border-neutral-800/50 px-2 py-1'>
								{PERKS[perk] && (
									<img
										src={PERKS[perk]}
										alt={perk}
										className='w-4 h-4 object-contain'
										style={{ filter: "invert(1) opacity(0.55)" }}
									/>
								)}
								<span className='font-mono text-[8px] text-neutral-400'>
									{perk}
								</span>
								<button
									type='button'
									onClick={() => removePerk(perk)}
									className='text-neutral-600 hover:text-red-400 ml-0.5 transition-colors leading-none'>
									×
								</button>
							</div>
						))
					}
				</div>
				<select
					className='form'
					value=''
					onChange={(e) => addPerk(e.target.value)}>
					<option value=''>— Add Perk —</option>
					{Object.keys(PERKS)
						.filter((i) => !kit.perks.includes(i))
						.map((perk) => (
							<option
								key={perk}
								value={perk}>
								{perk}
							</option>
						))}
				</select>
			</div>

			{/* Footer */}
			<div className='shrink-0 px-4 py-3 border-t border-neutral-800/60 bg-neutral-950/40'>
				<button
					type='button'
					disabled={!kit.name.trim() || saving}
					onClick={() => onSave(kit)}
					className='w-full font-mono text-[9px] tracking-widest uppercase py-2 border border-btn/40 text-btn hover:border-btn hover:bg-btn/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all'>
					{saving ? "Saving…" : "Save Kit"}
				</button>
			</div>
		</div>
	);
}

KitForm.propTypes = {
	initial: PropTypes.object,
	onSave: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	saving: PropTypes.bool,
};

/* ═══════════════════════════════════════════════════════════════
   ARMORY PAGE
═══════════════════════════════════════════════════════════════ */
export default function Armory() {
	const { kits, loading, fetchKits, createKit, updateKit, deleteKit } =
		useKitsStore();

	const [editingKit, setEditingKit] = useState(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetchKits();
	}, [fetchKits]);

	const handleSave = async (kitData) => {
		setSaving(true);
		try {
			if (editingKit?._id) {
				await updateKit(editingKit._id, kitData);
			} else {
				await createKit(kitData);
			}
			setEditingKit(null);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='flex flex-col min-h-0 h-full text-fontz overflow-hidden'>
			{/* ── Header ──────────────────────────────────────── */}
			<div className='shrink-0 px-5 py-4 bg-neutral-950/60 border-b border-neutral-800/60 relative'>
				{[
					"top-2 left-2 border-t border-l",
					"top-2 right-2 border-t border-r",
					"bottom-2 left-2 border-b border-l",
					"bottom-2 right-2 border-b border-r",
				].map((cls, i) => (
					<div
						key={i}
						className={`absolute w-3 h-3 border-neutral-700/40 pointer-events-none ${cls}`}
					/>
				))}
				<div className='flex items-center gap-4'>
					<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
						<div className='flex items-center gap-2'>
							<div className='w-0.5 h-4 bg-btn/60 shrink-0' />
							<FontAwesomeIcon
								icon={faGun}
								className='text-btn/50 text-[10px]'
							/>
							<h1 className='font-mono text-xs tracking-[0.35em] text-neutral-200 uppercase font-bold'>
								Armory
							</h1>
						</div>
						<p className='font-mono text-[8px] tracking-widest text-neutral-600 uppercase pl-5'>
							Kit Repository //{" "}
							<span className='text-neutral-500'>{kits.length}</span> Configured
						</p>
					</div>
					<button
						type='button'
						onClick={() => setEditingKit({ ...EMPTY_KIT })}
						className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 border border-btn/30 text-btn hover:border-btn hover:bg-btn/10 transition-all shrink-0'>
						<FontAwesomeIcon
							icon={faPlus}
							className='text-[8px]'
						/>
						New Kit
					</button>
				</div>
			</div>

			{/* ── Kit grid ────────────────────────────────────── */}
			<div className='flex-1 overflow-y-auto'>
				{loading ?
					<div className='flex items-center justify-center py-16'>
						<span className='font-mono text-[9px] tracking-widest text-neutral-600 uppercase animate-pulse'>
							Loading armory…
						</span>
					</div>
				: kits.length === 0 ?
					<div className='flex flex-col items-center justify-center py-24 gap-5'>
						<div className='relative'>
							<div className='w-16 h-16 border border-neutral-800/60 bg-neutral-950/40 flex items-center justify-center'>
								<FontAwesomeIcon
									icon={faBoxOpen}
									className='text-neutral-700 text-2xl'
								/>
							</div>
							<div className='absolute -top-1 -right-1 w-3 h-3 border-t border-r border-neutral-700/40' />
							<div className='absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-neutral-700/40' />
						</div>
						<div className='text-center'>
							<p className='font-mono text-[10px] tracking-[0.25em] text-neutral-600 uppercase'>
								Armory Empty
							</p>
							<p className='font-mono text-[8px] text-neutral-700 mt-1'>
								Build kits to equip your operators
							</p>
						</div>
						<button
							type='button'
							onClick={() => setEditingKit({ ...EMPTY_KIT })}
							className='flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase px-4 py-2 border border-btn/30 text-btn hover:border-btn hover:bg-btn/10 transition-all'>
							<FontAwesomeIcon
								icon={faPlus}
								className='text-[8px]'
							/>
							Create First Kit
						</button>
					</div>
				:	<div className='p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
						{kits.map((kit) => (
							<KitCard
								key={kit._id}
								kit={kit}
								onEdit={setEditingKit}
								onDelete={deleteKit}
							/>
						))}
					</div>
				}
			</div>

			{/* ── Create / Edit sheet ──────────────────────────── */}
			<Sheet
				open={!!editingKit}
				onOpenChange={(open) => {
					if (!open) setEditingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-neutral-800/60'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>
						{editingKit?._id ? "Edit Kit" : "New Kit"}
					</SheetTitle>
					{editingKit && (
						<KitForm
							initial={editingKit}
							onSave={handleSave}
							onCancel={() => setEditingKit(null)}
							saving={saving}
						/>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
