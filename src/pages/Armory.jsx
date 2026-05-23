// Armory.jsx — Kit Repository

import { useState, useEffect } from "react";
import { useKitsStore } from "@/zustand";
import {
	WEAPON_TYPES,
	WEAPONS_BY_TYPE,
	ATTACHMENTS,
	WEAPON_COMPATIBILITY,
	ITEMS,
	PERKS,
	PERKS_MAP,
	HELMET_TYPE,
	VEST_TYPE,
	BELT_TYPE,
} from "@/config";
import { KitDetailView } from "@/components";
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
	perks: [],
	helmet: "",
	vest: "",
	belt: "",
};

const PERK_TYPE_ORDER = [
	"All",
	"Weapons",
	"Combat",
	"Support",
	"Reconnaissance",
	"Demolitions",
	"Endurance",
];

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
		<div className='flex flex-col gap-2 p-3 border border-lines/40 bg-neutral-950/20'>
			<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/60'>
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
							<option key={k} value={k}>
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
						<option key={w} value={w}>
							{w}
						</option>
					))}
				</select>
			</div>
			{activeSlots.length > 0 && (
				<div className='grid grid-cols-2 gap-2 pt-1 border-t border-lines/40'>
					{activeSlots.map((slot) => (
						<div key={slot} className='flex flex-col gap-1'>
							<p className='font-mono text-[9px] tracking-widest uppercase text-lines/40'>
								{slot}
							</p>
							<select
								className='form text-[12px]'
								value={value.attachments[slot] || ""}
								onChange={(e) => handleAtt(slot, e.target.value)}>
								<option value=''>— None —</option>
								{getAttOpts(value.weapon, slot).map((opt) => (
									<option key={opt} value={opt}>
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

/* ─── Perk Picker ───────────────────────────────────────────── */
function PerkPicker({ selectedPerks, onAdd }) {
	const [activeType, setActiveType] = useState("All");

	const types = PERK_TYPE_ORDER.filter(
		(t) => t === "All" || PERKS.some((p) => p.type === t),
	);
	const filtered =
		activeType === "All" ? PERKS : PERKS.filter((p) => p.type === activeType);
	const available = filtered.filter((p) => !selectedPerks.includes(p.name));

	return (
		<div className='flex flex-col gap-2'>
			{/* Type filter tabs */}
			<div className='flex flex-wrap gap-1'>
				{types.map((type) => (
					<button
						key={type}
						type='button'
						onClick={() => setActiveType(type)}
						className={`font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 border transition-colors ${
							activeType === type ?
								"border-btn/60 text-btn bg-btn/10"
							:	"border-lines/40 text-lines/60 hover:text-lines hover:border-lines/40"
						}`}>
						{type}
					</button>
				))}
			</div>

			{/* Perk list */}
			<div className='flex flex-col gap-1 max-h-52 overflow-y-auto pr-0.5'>
				{available.length === 0 ?
					<span className='font-mono text-[9px] text-lines/40 italic text-center py-4'>
						{activeType !== "All" ?
							`All ${activeType} perks selected`
						:	"All perks selected"}
					</span>
				:	available.map((perk) => (
						<button
							key={perk.name}
							type='button'
							onClick={() => onAdd(perk.name)}
							className='flex items-center gap-2.5 p-2 border border-lines/40 hover:border-btn/30 bg-neutral-950/20 hover:bg-btn/5 text-left transition-colors group'>
							<img
								src={perk.icon}
								alt={perk.name}
								className='w-7 h-7 object-contain shrink-0'
							/>
							<div className='flex flex-col gap-0.5 min-w-0 flex-1'>
								<span className='font-mono text-[10px] text-lines leading-none group-hover:text-btn transition-colors'>
									{perk.name}
								</span>
								<span className='font-mono text-[9px] text-lines/60 leading-tight'>
									{perk.description}
								</span>
							</div>
							<span className='font-mono text-[12px] text-lines/40 group-hover:text-btn/70 shrink-0 transition-colors'>
								+
							</span>
						</button>
					))
				}
			</div>
		</div>
	);
}

PerkPicker.propTypes = {
	selectedPerks: PropTypes.arrayOf(PropTypes.string).isRequired,
	onAdd: PropTypes.func.isRequired,
};


/* ─── Kit Card ──────────────────────────────────────────────── */
function KitCard({ kit, onView, onEdit, onDelete }) {
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
			className='flex flex-col border border-lines/40 bg-neutral-900/40 hover:border-lines/40 transition-colors overflow-hidden cursor-pointer'
			onClick={() => onView(kit)}>
			{/* Header */}
			<div className='flex items-center gap-2 px-3 py-2.5 border-b border-lines/40 bg-neutral-950/60'>
				<div className='w-1.5 h-1.5 bg-btn shrink-0' />
				<span className='font-mono text-[13px] font-bold text-white flex-1 truncate tracking-wide uppercase'>
					{kit.name}
				</span>
				<div className='flex items-center gap-1 shrink-0'>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onEdit(kit);
						}}
						className='w-6 h-6 flex items-center justify-center text-lines/60 hover:text-btn border border-lines/40 hover:border-btn/30 bg-neutral-950/40 transition-colors'>
						<FontAwesomeIcon icon={faPen} className='text-[10px]' />
					</button>
					<button
						type='button'
						onClick={(e) => {
							e.stopPropagation();
							onDelete(kit._id);
						}}
						className='w-6 h-6 flex items-center justify-center text-lines/60 hover:text-red-400 border border-lines/40 hover:border-red-900/30 bg-neutral-950/40 transition-colors'>
						<FontAwesomeIcon icon={faTrash} className='text-[10px]' />
					</button>
				</div>
			</div>

			{/* Weapons */}
			<div className='px-3 py-3 flex flex-col gap-1.5 flex-1'>
				{weapons.length > 0 ?
					weapons.map(({ label, weapon, type }) => (
						<div key={label} className='flex items-center gap-2 min-w-0'>
							<span className='font-mono text-[9px] tracking-widest uppercase text-lines/40 w-6 shrink-0'>
								{label}
							</span>
							{type && WEAPON_TYPES[type]?.imgUrl && (
								<img
									src={WEAPON_TYPES[type].imgUrl}
									alt=''
									className='w-7 h-3.5 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.3)" }}
								/>
							)}
							<span className='font-mono text-[11px] text-lines truncate'>
								{weapon}
							</span>
						</div>
					))
				:	<span className='font-mono text-[10px] text-lines/40 italic'>
						No weapons configured
					</span>
				}
			</div>

			{/* Gear strip */}
			{(kit.helmet || kit.vest || kit.belt) && (
				<div className='px-3 pb-2 flex flex-wrap gap-1.5 border-t border-lines/40 pt-2.5'>
					{[
						kit.helmet && { key: "helmet", url: HELMET_TYPE[kit.helmet]?.url, value: HELMET_TYPE[kit.helmet]?.name ?? kit.helmet },
						kit.vest   && { key: "vest",   url: VEST_TYPE[kit.vest]?.url,     value: VEST_TYPE[kit.vest]?.name   ?? kit.vest   },
						kit.belt   && { key: "belt",   url: BELT_TYPE[kit.belt]?.url,     value: BELT_TYPE[kit.belt]?.name   ?? kit.belt   },
					].filter(Boolean).map(({ key, url, value }) => (
						<div
							key={key}
							title={value}
							className='flex items-center gap-1 bg-neutral-950/60 border border-lines/40 px-1.5 py-1'>
							{url && (
								<img
									src={url}
									alt={key}
									className='w-3.5 h-3.5 object-contain shrink-0'
									style={{ filter: "invert(1) opacity(0.5)" }}
								/>
							)}
							<span className='font-mono text-[9px] text-lines/60 truncate max-w-20'>
								{value}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Items strip */}
			{kit.items?.length > 0 && (
				<div className='px-3 pb-3 flex flex-wrap gap-1.5 border-t border-lines/40 pt-2.5'>
					{kit.items.map(
						(item) =>
							ITEMS[item] && (
								<div
									key={item}
									title={item}
									className='flex items-center gap-1 bg-neutral-950/60 border border-lines/40 px-1.5 py-1'>
									<img
										src={ITEMS[item]}
										alt={item}
										className='w-4 h-4 object-contain'
										style={{ filter: "invert(1) opacity(0.55)" }}
									/>
									<span className='font-mono text-[9px] text-lines/60 truncate max-w-14'>
										{item}
									</span>
								</div>
							),
					)}
				</div>
			)}

			{/* Perks strip */}
			{kit.perks?.length > 0 && (
				<div className='px-3 pb-3 flex flex-wrap gap-1.5 border-t border-lines/40 pt-2.5'>
					{kit.perks.map((perkName) => {
						const perk = PERKS_MAP[perkName];
						if (!perk) return null;
						return (
							<div
								key={perkName}
								title={perk.description}
								className='flex items-center gap-1 bg-neutral-950/60 border border-lines/40 px-1.5 py-1'>
								<img
									src={perk.icon}
									alt={perkName}
									className='w-4 h-4 object-contain shrink-0'
								/>
								<span className='font-mono text-[9px] text-lines/60 truncate max-w-14'>
									{perkName}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

KitCard.propTypes = {
	kit: PropTypes.object.isRequired,
	onView: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

/* ─── Kit Form ──────────────────────────────────────────────── */
function KitForm({ initial, onSave, onCancel, saving }) {
	const [kit, setKit] = useState(() => ({
		name: initial?.name || "",
		primary: initial?.primary || { ...EMPTY_SLOT },
		secondary: initial?.secondary || { ...EMPTY_SLOT },
		handgun: initial?.handgun || {
			weaponType: "HDG",
			weapon: "",
			attachments: { ...EMPTY_SLOT.attachments },
		},
		items: initial?.items || [],
		perks: initial?.perks || [],
		helmet: initial?.helmet || "",
		vest: initial?.vest || "",
		belt: initial?.belt || "",
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
			<div className='shrink-0 px-4 py-3 border-b border-lines/40 flex items-center gap-3 bg-neutral-950/40'>
				<button
					type='button'
					onClick={onCancel}
					className='font-mono text-[11px] tracking-widest uppercase text-lines/60 hover:text-white transition-colors'>
					‹ Cancel
				</button>
				<span className='flex-1 font-mono text-[11px] text-lines/60 tracking-widest uppercase text-right'>
					{initial?._id ? "Edit Loadout" : "New Loadout"}
				</span>
			</div>

			{/* Body */}
			<div className='flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6'>
				{/* Name */}
				<div className='flex flex-col gap-1.5'>
					<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/60'>
						Loadout Designation
					</p>
					<input
						type='text'
						className='form'
						placeholder='e.g. Alpha Strike, Recon Package…'
						value={kit.name}
						onChange={(e) => setField("name", e.target.value)}
					/>
				</div>

				{/* Weapons */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
						<div className='w-0.5 h-3 bg-btn' />
						<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines'>
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

				{/* Gear */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
						<div className='w-0.5 h-3 bg-btn' />
						<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines'>
							Gear
						</p>
					</div>
					<div className='grid grid-cols-3 gap-2'>
						<div className='flex flex-col gap-1'>
							<p className='font-mono text-[9px] tracking-widest uppercase text-lines/40'>Helmet</p>
							<select
								className='form text-xs'
								value={kit.helmet}
								onChange={(e) => setField("helmet", e.target.value)}>
								<option value=''>— None —</option>
								{Object.entries(HELMET_TYPE).map(([k, h]) => (
									<option key={k} value={k}>{h.name}</option>
								))}
							</select>
						</div>
						<div className='flex flex-col gap-1'>
							<p className='font-mono text-[9px] tracking-widest uppercase text-lines/40'>Vest</p>
							<select
								className='form text-xs'
								value={kit.vest}
								onChange={(e) => setField("vest", e.target.value)}>
								<option value=''>— None —</option>
								{Object.entries(VEST_TYPE).map(([k, v]) => (
									<option key={k} value={k}>{v.name}</option>
								))}
							</select>
						</div>
						<div className='flex flex-col gap-1'>
							<p className='font-mono text-[9px] tracking-widest uppercase text-lines/40'>Belt</p>
							<select
								className='form text-xs'
								value={kit.belt}
								onChange={(e) => setField("belt", e.target.value)}>
								<option value=''>— None —</option>
								{Object.entries(BELT_TYPE).map(([k, b]) => (
									<option key={k} value={k}>{b.name}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Equipment */}
				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
						<div className='w-0.5 h-3 bg-btn' />
						<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines'>
							Equipment
						</p>
					</div>
					<div className='flex flex-wrap gap-1.5 min-h-8'>
						{kit.items.length === 0 ?
							<span className='font-mono text-[10px] text-lines/40 italic self-center'>
								No equipment selected
							</span>
						:	kit.items.map((item) => (
								<div
									key={item}
									className='flex items-center gap-1.5 bg-neutral-950/60 border border-lines/40 px-2 py-1'>
									{ITEMS[item] && (
										<img
											src={ITEMS[item]}
											alt={item}
											className='w-4 h-4 object-contain'
											style={{ filter: "invert(1) opacity(0.6)" }}
										/>
									)}
									<span className='font-mono text-[10px] text-lines'>
										{item}
									</span>
									<button
										type='button'
										onClick={() => removeItem(item)}
										className='text-lines/40 hover:text-red-400 ml-0.5 transition-colors leading-none'>
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
								<option key={item} value={item}>
									{item}
								</option>
							))}
					</select>
				</div>

				{/* Perks */}
				<div className='flex flex-col gap-3'>
					<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
						<div className='w-0.5 h-3 bg-btn' />
						<p className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines'>
							Perks
						</p>
						{kit.perks.length > 0 && (
							<span className='font-mono text-[9px] text-btn border border-btn/30 px-1 ml-auto'>
								{kit.perks.length} selected
							</span>
						)}
					</div>

					{/* Selected perks chips */}
					{kit.perks.length > 0 && (
						<div className='flex flex-wrap gap-1.5'>
							{kit.perks.map((perkName) => {
								const perk = PERKS_MAP[perkName];
								return (
									<div
										key={perkName}
										title={perk?.description}
										className='flex items-center gap-1.5 bg-neutral-950/60 border border-lines/40 px-2 py-1'>
										{perk?.icon && (
											<img
												src={perk.icon}
												alt={perkName}
												className='w-4 h-4 object-contain shrink-0'
											/>
										)}
										<span className='font-mono text-[10px] text-lines'>
											{perkName}
										</span>
										<button
											type='button'
											onClick={() => removePerk(perkName)}
											className='text-lines/40 hover:text-red-400 ml-0.5 transition-colors leading-none'>
											×
										</button>
									</div>
								);
							})}
						</div>
					)}

					{/* Perk picker — grouped by type with descriptions */}
					<PerkPicker selectedPerks={kit.perks} onAdd={addPerk} />
				</div>
			</div>

			{/* Footer */}
			<div className='shrink-0 px-4 py-3 border-t border-lines/40 bg-neutral-950/40'>
				<button
					type='button'
					disabled={!kit.name.trim() || saving}
					onClick={() => onSave(kit)}
					className='w-full font-mono text-[11px] tracking-widest uppercase py-2 border border-btn/40 text-btn hover:border-btn hover:bg-btn/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all'>
					{saving ? "Saving…" : "Save Loadout"}
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

	const [viewingKit, setViewingKit] = useState(null);
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

	const handleEditFromView = () => {
		setEditingKit(viewingKit);
		setViewingKit(null);
	};

	return (
		<div className='flex flex-col min-h-0 h-full text-fontz overflow-hidden'>
			{/* ── Header ──────────────────────────────────────── */}
			<div className='shrink-0 px-5 py-4 bg-neutral-950/60 border-b border-lines/40 relative'>
				{[
					"top-2 left-2 border-t border-l",
					"top-2 right-2 border-t border-r",
					"bottom-2 left-2 border-b border-l",
					"bottom-2 right-2 border-b border-r",
				].map((cls, i) => (
					<div
						key={i}
						className={`absolute w-3 h-3 border-lines/40 pointer-events-none ${cls}`}
					/>
				))}
				<div className='flex items-center gap-4'>
					<div className='flex flex-col gap-0.5 flex-1 min-w-0'>
						<div className='flex items-center gap-2'>
							<div className='w-0.5 h-4 bg-btn shrink-0' />
							<FontAwesomeIcon icon={faGun} className='text-btn/70 text-[12px]' />
							<h1 className='font-mono text-xs tracking-[0.35em] text-white uppercase font-bold'>
								Armory
							</h1>
						</div>
						<p className='font-mono text-[10px] tracking-widest text-lines/40 uppercase pl-5'>
							Loadout Repository //{" "}
							<span className='text-lines'>{kits.length}</span> Configured
						</p>
					</div>
					<button
						type='button'
						onClick={() => setEditingKit({ ...EMPTY_KIT })}
						className='flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase px-3 py-1.5 border border-btn/40 text-btn hover:border-btn hover:bg-btn/10 transition-all shrink-0'>
						<FontAwesomeIcon icon={faPlus} className='text-[10px]' />
						New Loadout
					</button>
				</div>
			</div>

			{/* ── Kit grid ────────────────────────────────────── */}
			<div className='flex-1 overflow-y-auto'>
				{loading ?
					<div className='flex items-center justify-center py-16'>
						<span className='font-mono text-[11px] tracking-widest text-lines/40 uppercase animate-pulse'>
							Loading armory…
						</span>
					</div>
				: kits.length === 0 ?
					<div className='flex flex-col items-center justify-center py-24 gap-5'>
						<div className='relative'>
							<div className='w-16 h-16 border border-lines/40 bg-neutral-950/40 flex items-center justify-center'>
								<FontAwesomeIcon
									icon={faBoxOpen}
									className='text-lines/30 text-2xl'
								/>
							</div>
							<div className='absolute -top-1 -right-1 w-3 h-3 border-t border-r border-lines/40' />
							<div className='absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-lines/40' />
						</div>
						<div className='text-center'>
							<p className='font-mono text-[12px] tracking-[0.25em] text-lines/60 uppercase'>
								Armory Empty
							</p>
							<p className='font-mono text-[10px] text-lines/40 mt-1'>
								Build loadouts to equip your operators
							</p>
						</div>
						<button
							type='button'
							onClick={() => setEditingKit({ ...EMPTY_KIT })}
							className='flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase px-4 py-2 border border-btn/40 text-btn hover:border-btn hover:bg-btn/10 transition-all'>
							<FontAwesomeIcon icon={faPlus} className='text-[10px]' />
							Create First Loadout
						</button>
					</div>
				:	<div className='p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
						{kits.map((kit) => (
							<KitCard
								key={kit._id}
								kit={kit}
								onView={setViewingKit}
								onEdit={setEditingKit}
								onDelete={deleteKit}
							/>
						))}
					</div>
				}
			</div>

			{/* ── Kit detail sheet ─────────────────────────────── */}
			<Sheet
				open={!!viewingKit}
				onOpenChange={(open) => {
					if (!open) setViewingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-lines/40'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>Loadout Details</SheetTitle>
					{viewingKit && (
						<KitDetailView
							kit={viewingKit}
							onEdit={handleEditFromView}
							onClose={() => setViewingKit(null)}
						/>
					)}
				</SheetContent>
			</Sheet>

			{/* ── Create / Edit sheet ──────────────────────────── */}
			<Sheet
				open={!!editingKit}
				onOpenChange={(open) => {
					if (!open) setEditingKit(null);
				}}>
				<SheetContent
					side='right'
					className='p-0 sm:max-w-md overflow-hidden flex flex-col bg-blk border-l border-lines/40'
					aria-describedby={undefined}>
					<SheetTitle className='sr-only'>
						{editingKit?._id ? "Edit Loadout" : "New Loadout"}
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
