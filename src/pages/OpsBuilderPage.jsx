import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faPencil,
	faRotate,
	faFloppyDisk,
	faFolderOpen,
	faFileImport,
	faFileExport,
	faTrashCan,
	faLink,
	faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
	generateMissionName,
	generateMissionNames,
} from "@/utils/GenerateMissionName";
import {
	defaultMission,
	defaultLeg,
	defaultObjective,
	defaultBase,
	defaultExfil,
	defaultWeaponSlot,
	defaultExtraProvince,
	PROVINCE_DISPLAY_NAMES,
	ROE_RULES,
	OBJECTIVE_TYPES,
	PERSON_TARGET_TYPES,
	VEHICLE_TARGET_TYPES,
	INFIL_EXFIL_TYPES,
	APPROACH_DIRECTIONS,
	PLATFORMS,
	WORLDS,
	DIFFICULTIES,
	TIMES_OF_DAY,
	LOADOUT_MODES,
	LIST_MODES,
	MODS,
	migrate,
} from "@/utils/missionSchema";
import { encodeMission, decodeMission } from "@/utils/missionCodec";
import { PROVINCES } from "@/config/provinces";
import {
	WEAPONS_BY_TYPE,
	WEAPON_TYPES,
	WEAPON_COMPATIBILITY,
} from "@/config/weapons";
import { ITEMS } from "@/config/items";
import { PERKS } from "@/config/perks";
import { GARAGE } from "@/config/garage";

const DRAFT_KEY = "ghostops_ops_draft";
const SAVES_KEY = "ghostops_ops_saves";

function readSaves() {
	try {
		return JSON.parse(localStorage.getItem(SAVES_KEY) || "{}");
	} catch {
		return {};
	}
}

// ── helpers ──────────────────────────────────────────────────────────────
const cls = (...args) => args.filter(Boolean).join(" ");

const slugify = (name) =>
	(name || "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60) || "mission";

// Best-effort — the share link works fine on its own if this fails
// (no token configured, network error, backend down, etc.).
async function shortenLink(url, alias) {
	try {
		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/shorten`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url, alias }),
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data?.shortUrl || null;
	} catch {
		return null;
	}
}

const labelCls = "block text-sm font-medium text-gray-400 mb-2";
const secondaryBtnCls =
	"text-sm font-medium px-3 py-1.5 rounded-lg border border-lines text-fontz hover:bg-highlight hover:text-white transition-colors";
const chipCls =
	"py-2 px-1 border rounded-sm font-mono text-[10px] tracking-widest uppercase transition-all";
const chipActiveCls = "border-btn/50 bg-btn/10 text-btn";
const chipInactiveCls =
	"border-lines/15 text-lines/40 hover:border-lines/30 hover:text-fontz/60";

function Field({ label, children }) {
	return (
		<div className='flex flex-col w-full'>
			<label className={labelCls}>{label}</label>
			{children}
		</div>
	);
}

function SectionHeader({ title }) {
	return <h2 className='text-xl font-bold text-fontz mb-1'>{title}</h2>;
}

function IconBtn({ onClick, title, children, danger }) {
	return (
		<button
			type='button'
			onClick={onClick}
			title={title}
			className={cls(
				"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
				danger ?
					"border-red-900/50 text-red-400 hover:bg-red-900/20"
				:	"border-lines text-fontz/70 hover:bg-highlight hover:text-white",
			)}>
			{children}
		</button>
	);
}

// ── Weapon slot picker ────────────────────────────────────────────────────
function WeaponSlotPicker({ slotKey, value, onChange }) {
	const isSidearm = slotKey === "sidearm";
	const compat =
		value.weaponId ? (WEAPON_COMPATIBILITY[value.weaponId] ?? {}) : {};
	const compatSlots = Object.entries(compat).filter(
		([, opts]) => opts.length > 0,
	);

	function changeWeapon(weaponId) {
		onChange({ weaponId, attachments: {} });
	}
	function changeAttachment(slotName, val) {
		onChange({
			...value,
			attachments: { ...value.attachments, [slotName]: val },
		});
	}

	return (
		<div className='flex flex-col gap-2'>
			<Field label={slotKey}>
				<select
					className='form'
					value={value.weaponId}
					onChange={(e) => changeWeapon(e.target.value)}>
					<option value=''>— No Weapon —</option>
					{isSidearm ?
						WEAPONS_BY_TYPE.HDG.map((w) => (
							<option
								key={w}
								value={w}>
								{w}
							</option>
						))
					:	Object.entries(WEAPONS_BY_TYPE)
							.filter(([t]) => t !== "HDG")
							.map(([type, weapons]) => (
								<optgroup
									key={type}
									label={WEAPON_TYPES[type]?.name || type}>
									{weapons.map((w) => (
										<option
											key={w}
											value={w}>
											{w}
										</option>
									))}
								</optgroup>
							))
					}
				</select>
			</Field>

			{compatSlots.length > 0 && (
				<div className='pl-4 border-l-2 border-lines/20 flex flex-col gap-2'>
					{compatSlots.map(([slotName, opts]) => (
						<Field
							key={slotName}
							label={slotName}>
							<select
								className='form'
								value={value.attachments?.[slotName] ?? ""}
								onChange={(e) => changeAttachment(slotName, e.target.value)}>
								<option value=''>— None —</option>
								{opts.map((o) => (
									<option
										key={o}
										value={o}>
										{o}
									</option>
								))}
							</select>
						</Field>
					))}
				</div>
			)}
		</div>
	);
}

// ── Objective row ─────────────────────────────────────────────────────────
function ObjectiveRow({ obj, index, onChange, onRemove }) {
	const isPersonType = PERSON_TARGET_TYPES.has(obj.type);
	const isVehicleType = VEHICLE_TARGET_TYPES.has(obj.type);
	const isLocType = !isPersonType && !isVehicleType;

	function changeType(type) {
		onChange({ ...obj, type, targetId: "", locationId: null });
	}

	return (
		<div className='flex flex-col gap-3 p-3 border border-lines/40 rounded-lg'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-fontz'>
					Objective {index + 1}
				</span>
				<IconBtn
					onClick={onRemove}
					danger
					title='Remove objective'>
					Remove
				</IconBtn>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
				<Field label='Type'>
					<select
						className='form'
						value={obj.type}
						onChange={(e) => changeType(e.target.value)}>
						{OBJECTIVE_TYPES.map((t) => (
							<option
								key={t}
								value={t}>
								{t}
							</option>
						))}
					</select>
				</Field>

				{isPersonType && (
					<Field label='Target Name'>
						<input
							className='form'
							value={obj.targetId}
							onChange={(e) => onChange({ ...obj, targetId: e.target.value })}
							placeholder='Name or callsign'
						/>
					</Field>
				)}

				{isVehicleType && (
					<Field label='Vehicle'>
						<select
							className='form'
							value={obj.targetId}
							onChange={(e) => onChange({ ...obj, targetId: e.target.value })}>
							<option value=''>— Select Vehicle —</option>
							{GARAGE.map((v) => (
								<option
									key={v.name}
									value={v.name}>
									{v.name}
								</option>
							))}
						</select>
					</Field>
				)}

				{isLocType && (
					<Field label='Target'>
						<input
							className='form'
							value={obj.targetId}
							onChange={(e) =>
								onChange({
									...obj,
									targetId: e.target.value,
									locationId: e.target.value,
								})
							}
							placeholder='Location or landmark'
						/>
					</Field>
				)}
			</div>

			<Field label='Note'>
				<input
					className='form'
					value={obj.note}
					onChange={(e) => onChange({ ...obj, note: e.target.value })}
					placeholder='Optional note'
				/>
			</Field>
		</div>
	);
}

// ── Base row (a base + the objectives staged from it) ─────────────────────
function BaseGroupRow({ base, index, provinceLocations, onChange, onRemove, canRemove }) {
	function set(field, value) {
		onChange({ ...base, [field]: value });
	}
	function addObjective() {
		set("objectives", [...(base.objectives ?? []), defaultObjective()]);
	}
	function removeObjective(i) {
		set(
			"objectives",
			base.objectives.filter((_, idx) => idx !== i),
		);
	}
	function updateObjective(i, val) {
		set(
			"objectives",
			base.objectives.map((o, idx) => (idx === i ? val : o)),
		);
	}

	return (
		<div className='flex flex-col gap-3 p-3 border border-lines/40 rounded-lg'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-fontz'>
					Base {index + 1}
				</span>
				{canRemove && (
					<IconBtn
						onClick={onRemove}
						danger
						title='Remove base'>
						Remove
					</IconBtn>
				)}
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
				{provinceLocations.length > 0 && (
					<Field label='Location'>
						<select
							className='form'
							value={base.locationId ?? ""}
							onChange={(e) => set("locationId", e.target.value || null)}>
							<option value=''>— Optional —</option>
							{provinceLocations.map((l) => (
								<option
									key={l.name}
									value={l.name}>
									{l.name}
								</option>
							))}
						</select>
					</Field>
				)}
				<Field label='Note'>
					<input
						className='form'
						value={base.note ?? ""}
						onChange={(e) => set("note", e.target.value)}
						placeholder='Optional'
					/>
				</Field>
			</div>

			<div className='pl-4 border-l-2 border-lines/20 flex flex-col gap-3'>
				<div className='flex items-center justify-between'>
					<span className='text-xs font-medium text-gray-400'>
						Objectives
					</span>
					<IconBtn
						onClick={addObjective}
						title='Add objective'>
						+ Objective
					</IconBtn>
				</div>
				{(base.objectives ?? []).map((obj, i) => (
					<ObjectiveRow
						key={i}
						obj={obj}
						index={i}
						onChange={(val) => updateObjective(i, val)}
						onRemove={() => removeObjective(i)}
					/>
				))}
			</div>
		</div>
	);
}

// ── Base + Objectives group editor ─────────────────────────────────────────
function BaseGroupEditor({ bases, provinceLocations, onChange }) {
	function addBase() {
		onChange([...(bases ?? []), defaultBase()]);
	}
	function removeBase(i) {
		onChange(bases.filter((_, idx) => idx !== i));
	}
	function updateBase(i, val) {
		onChange(bases.map((b, idx) => (idx === i ? val : b)));
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-fontz'>
					Bases &amp; Objectives
				</span>
				<IconBtn
					onClick={addBase}
					title='Add a base with its own objectives'>
					+ Base
				</IconBtn>
			</div>
			{(bases ?? []).map((base, i) => (
				<BaseGroupRow
					key={i}
					base={base}
					index={i}
					provinceLocations={provinceLocations}
					onChange={(val) => updateBase(i, val)}
					onRemove={() => removeBase(i)}
					canRemove={bases.length > 1}
				/>
			))}
		</div>
	);
}

// ── Extraction editor ────────────────────────────────────────────────────
function ExtractionEditor({ exfil, provinceLocations, onToggle, onChange }) {
	function set(field, value) {
		onChange({ ...exfil, [field]: value });
	}

	return (
		<div className='flex flex-col gap-2'>
			<div className='flex items-center gap-3'>
				<span className='text-sm font-semibold text-fontz'>Extraction</span>
				<button
					type='button'
					onClick={onToggle}
					className={cls(
						"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
						exfil ?
							"border-btn bg-btn/10 text-btn"
						:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
					)}>
					{exfil ? "Remove" : "Add"}
				</button>
			</div>
			{exfil && (
				<div className='pl-4 border-l-2 border-lines/20 flex flex-col gap-3'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<Field label='Type'>
							<select
								className='form'
								value={exfil.type}
								onChange={(e) => set("type", e.target.value)}>
								{INFIL_EXFIL_TYPES.map((t) => (
									<option
										key={t}
										value={t}>
										{t}
									</option>
								))}
							</select>
						</Field>
						{exfil.type === "Base" ?
							provinceLocations.length > 0 && (
								<Field label='Location'>
									<select
										className='form'
										value={exfil.locationId ?? ""}
										onChange={(e) => set("locationId", e.target.value || null)}>
										<option value=''>— Optional —</option>
										{provinceLocations.map((l) => (
											<option
												key={l.name}
												value={l.name}>
												{l.name}
											</option>
										))}
									</select>
								</Field>
							)
						:	<Field label='Location'>
								<input
									className='form'
									value={exfil.locationId ?? ""}
									onChange={(e) => set("locationId", e.target.value || null)}
									placeholder='Optional'
								/>
							</Field>
						}
					</div>
					<Field label='Note'>
						<input
							className='form'
							value={exfil.note ?? ""}
							onChange={(e) => set("note", e.target.value)}
							placeholder='Optional'
						/>
					</Field>
				</div>
			)}
		</div>
	);
}

// ── Additional province block ────────────────────────────────────────────
function ExtraProvinceBlock({
	segment,
	index,
	onChange,
	onRemove,
	isLast,
	exfil,
	onToggleExfil,
	onChangeExfil,
}) {
	const provinceLocations = PROVINCES[segment.provinceId]?.locations ?? [];

	function set(field, value) {
		onChange({ ...segment, [field]: value });
	}

	return (
		<div className='flex flex-col gap-4 p-3 border border-lines/40 rounded-lg'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-semibold text-fontz'>
					Province {index + 2}
				</span>
				<IconBtn
					onClick={onRemove}
					danger
					title='Remove province'>
					Remove
				</IconBtn>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
				<Field label='Province'>
					<select
						className='form'
						value={segment.provinceId}
						onChange={(e) => set("provinceId", e.target.value)}>
						<option value=''>— Select Province —</option>
						{Object.entries(PROVINCE_DISPLAY_NAMES).map(([key, name]) => (
							<option
								key={key}
								value={key}>
								{name}
							</option>
						))}
					</select>
				</Field>
				<Field label='Approaching From'>
					<select
						className='form'
						value={segment.approachFrom}
						onChange={(e) => set("approachFrom", e.target.value)}>
						{APPROACH_DIRECTIONS.map((d) => (
							<option
								key={d}
								value={d}>
								{d}
							</option>
						))}
					</select>
				</Field>
			</div>

			<BaseGroupEditor
				bases={segment.bases}
				provinceLocations={provinceLocations}
				onChange={(val) => set("bases", val)}
			/>

			{isLast && (
				<ExtractionEditor
					exfil={exfil}
					provinceLocations={provinceLocations}
					onToggle={onToggleExfil}
					onChange={onChangeExfil}
				/>
			)}
		</div>
	);
}

// ── Phase block ─────────────────────────────────────────────────────────────
function LegBlock({ leg, index, onChange, onRemove, canRemove }) {
	const provinceLocations = PROVINCES[leg.provinceId]?.locations ?? [];

	function set(field, value) {
		onChange({ ...leg, [field]: value });
	}
	function setInfil(field, value) {
		set("infil", { ...leg.infil, [field]: value });
	}
	function addExtraProvince() {
		set("extraProvinces", [
			...(leg.extraProvinces ?? []),
			defaultExtraProvince(),
		]);
	}
	function removeExtraProvince(i) {
		set(
			"extraProvinces",
			leg.extraProvinces.filter((_, idx) => idx !== i),
		);
	}
	function updateExtraProvince(i, val) {
		set(
			"extraProvinces",
			leg.extraProvinces.map((p, idx) => (idx === i ? val : p)),
		);
	}

	return (
		<div className='flex flex-col gap-5 p-4 border border-lines rounded-lg bg-blk/30'>
			<div className='flex items-center justify-between'>
				<span className='text-lg font-semibold text-fontz'>
					Phase {index + 1}
				</span>
				{canRemove && (
					<IconBtn
						onClick={onRemove}
						danger
						title='Remove leg'>
						Remove Phase
					</IconBtn>
				)}
			</div>

			{/* Province */}
			<Field label='Province'>
				<select
					className='form'
					value={leg.provinceId}
					onChange={(e) => onChange({ ...leg, provinceId: e.target.value })}>
					<option value=''>— Select Province —</option>
					{Object.entries(PROVINCE_DISPLAY_NAMES).map(([key, name]) => (
						<option
							key={key}
							value={key}>
							{name}
						</option>
					))}
				</select>
			</Field>

			{/* Infil */}
			<div className='flex flex-col gap-2'>
				<span className='text-sm font-semibold text-fontz'>Insertion</span>
				<div className='pl-4 border-l-2 border-lines/20 flex flex-col gap-3'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
						<Field label='Type'>
							<select
								className='form'
								value={leg.infil.type}
								onChange={(e) => setInfil("type", e.target.value)}>
								{INFIL_EXFIL_TYPES.map((t) => (
									<option
										key={t}
										value={t}>
										{t}
									</option>
								))}
							</select>
						</Field>
						{leg.infil.type === "Base" ?
							provinceLocations.length > 0 && (
								<Field label='Location'>
									<select
										className='form'
										value={leg.infil.locationId ?? ""}
										onChange={(e) =>
											setInfil("locationId", e.target.value || null)
										}>
										<option value=''>— Optional —</option>
										{provinceLocations.map((l) => (
											<option
												key={l.name}
												value={l.name}>
												{l.name}
											</option>
										))}
									</select>
								</Field>
							)
						:	<Field label='Location'>
								<input
									className='form'
									value={leg.infil.locationId ?? ""}
									onChange={(e) =>
										setInfil("locationId", e.target.value || null)
									}
									placeholder='Optional'
								/>
							</Field>
						}
					</div>
					<Field label='Note'>
						<input
							className='form'
							value={leg.infil.note ?? ""}
							onChange={(e) => setInfil("note", e.target.value)}
							placeholder='Optional'
						/>
					</Field>
				</div>
			</div>

			{/* Bases & Objectives */}
			<BaseGroupEditor
				bases={leg.bases}
				provinceLocations={provinceLocations}
				onChange={(val) => set("bases", val)}
			/>

			{/* Additional Provinces */}
			<div className='flex flex-col gap-3'>
				<div className='flex items-center justify-between'>
					<span className='text-sm font-semibold text-fontz'>
						Additional Provinces
					</span>
					<IconBtn
						onClick={addExtraProvince}
						title='Add another province to this phase'>
						+ Province
					</IconBtn>
				</div>
				{(leg.extraProvinces ?? []).length === 0 && (
					<p className='text-xs text-gray-500 italic'>
						Add a province if this phase continues into another region.
					</p>
				)}
				{(leg.extraProvinces ?? []).map((segment, i) => (
					<ExtraProvinceBlock
						key={i}
						segment={segment}
						index={i}
						isLast={i === leg.extraProvinces.length - 1}
						exfil={leg.exfil}
						onToggleExfil={() =>
							set("exfil", leg.exfil ? null : defaultExfil())
						}
						onChangeExfil={(val) => set("exfil", val)}
						onChange={(val) => updateExtraProvince(i, val)}
						onRemove={() => removeExtraProvince(i)}
					/>
				))}
			</div>

			{/* Extraction — belongs to whichever province is last in this phase */}
			{(leg.extraProvinces ?? []).length === 0 && (
				<ExtractionEditor
					exfil={leg.exfil}
					provinceLocations={provinceLocations}
					onToggle={() => set("exfil", leg.exfil ? null : defaultExfil())}
					onChange={(val) => set("exfil", val)}
				/>
			)}
		</div>
	);
}

// ── Checkbox grid ─────────────────────────────────────────────────────────
function CheckGrid({ items, selected, onToggle }) {
	const set = new Set(selected);
	return (
		<div className='grid grid-cols-3 gap-1.5 sm:grid-cols-4'>
			{items.map((item) => {
				const active = set.has(item);
				return (
					<button
						key={item}
						type='button'
						onClick={() => onToggle(item)}
						className={cls(chipCls, active ? chipActiveCls : chipInactiveCls)}>
						{item}
					</button>
				);
			})}
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function OpsBuilderPage() {
	const [mission, setMission] = useState(() => {
		try {
			const saved = localStorage.getItem(DRAFT_KEY);
			if (saved) return decodeMission(saved) ?? defaultMission();
		} catch {}
		return defaultMission();
	});
	const [saves, setSaves] = useState(readSaves);
	const [copied, setCopied] = useState(false);
	const [shortening, setShortening] = useState(false);
	const [saveLabel, setSaveLabel] = useState("Save");
	const [showSavesMenu, setShowSavesMenu] = useState(false);
	const [nameEditing, setNameEditing] = useState(false);
	const [nameSuggestions, setNameSuggestions] = useState(() =>
		generateMissionNames(3),
	);
	const importRef = useRef(null);

	// Seed a generated name if the draft has none
	useEffect(() => {
		if (!mission.meta.name) updateMeta("name", generateMissionName());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Autosave
	useEffect(() => {
		localStorage.setItem(DRAFT_KEY, encodeMission(mission));
	}, [mission]);

	// Update helpers
	const updateMeta = useCallback((field, value) => {
		setMission((m) => ({ ...m, meta: { ...m.meta, [field]: value } }));
	}, []);

	const updateROERule = useCallback((id) => {
		setMission((m) => {
			const rules =
				m.roe.rules.includes(id) ?
					m.roe.rules.filter((r) => r !== id)
				:	[...m.roe.rules, id];
			return { ...m, roe: { ...m.roe, rules } };
		});
	}, []);

	const updateROECustom = useCallback((text) => {
		setMission((m) => ({ ...m, roe: { ...m.roe, custom: text } }));
	}, []);

	const updateLeg = useCallback((i, leg) => {
		setMission((m) => ({
			...m,
			legs: m.legs.map((l, idx) => (idx === i ? leg : l)),
		}));
	}, []);

	const addLeg = useCallback(() => {
		setMission((m) => ({ ...m, legs: [...m.legs, defaultLeg()] }));
	}, []);

	const removeLeg = useCallback((i) => {
		setMission((m) => ({ ...m, legs: m.legs.filter((_, idx) => idx !== i) }));
	}, []);

	const updateLoadout = useCallback((slot, value) => {
		setMission((m) => ({
			...m,
			restrictions: {
				...m.restrictions,
				loadout: { ...m.restrictions.loadout, [slot]: value },
			},
		}));
	}, []);

	const updateLoadoutMode = useCallback((mode) => {
		setMission((m) => ({
			...m,
			restrictions: {
				...m.restrictions,
				loadout: { ...m.restrictions.loadout, mode },
			},
		}));
	}, []);

	function updateListSection(section, patch) {
		setMission((m) => ({
			...m,
			restrictions: {
				...m.restrictions,
				[section]: { ...m.restrictions[section], ...patch },
			},
		}));
	}

	function toggleListItem(section, name) {
		setMission((m) => {
			const list = m.restrictions[section].list ?? [];
			const next =
				list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
			return {
				...m,
				restrictions: {
					...m.restrictions,
					[section]: { ...m.restrictions[section], list: next },
				},
			};
		});
	}

	// ── Save / load actions ───────────────────────────────────────────────
	function handleSave() {
		const name = mission.meta.name?.trim() || "Untitled";
		const updated = { ...saves, [name]: mission };
		localStorage.setItem(SAVES_KEY, JSON.stringify(updated));
		setSaves(updated);
		setSaveLabel("Saved!");
		setTimeout(() => setSaveLabel("Save"), 2000);
	}

	function handleLoad(name) {
		const m = saves[name];
		if (m) setMission(migrate(m));
		setShowSavesMenu(false);
	}

	function handleDeleteSave(name) {
		const updated = { ...saves };
		delete updated[name];
		localStorage.setItem(SAVES_KEY, JSON.stringify(updated));
		setSaves(updated);
	}

	// ── Other footer actions ──────────────────────────────────────────────
	async function copyLink() {
		const encoded = encodeMission(mission);
		const slug = slugify(mission.meta.name);
		const url = `${window.location.origin}/ops/reader/${slug}#${encoded}`;

		setShortening(true);
		const shortUrl = await shortenLink(url, slug);
		setShortening(false);

		navigator.clipboard.writeText(shortUrl || url).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		});
	}

	function exportJSON() {
		const blob = new Blob([JSON.stringify(mission, null, 2)], {
			type: "application/json",
		});
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${(mission.meta.name || "mission").replace(/\s+/g, "_").toLowerCase()}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	function importJSON(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const parsed = JSON.parse(ev.target.result);
				setMission(migrate(parsed));
			} catch {
				alert("Invalid mission file.");
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	}

	function clearDraft() {
		if (confirm("Clear draft and start over?")) {
			localStorage.removeItem(DRAFT_KEY);
			setMission(defaultMission());
		}
	}

	const savedNames = Object.keys(saves);
	const { meta, legs, roe, restrictions } = mission;

	return (
		<div className='min-h-screen bg-blk pb-24 text-fontz'>
			{/* Top nav */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-lines/30 bg-blk sticky top-0 z-10'>
				<Link
					to='/'
					className='flex items-center gap-2 hover:opacity-80 transition-opacity'>
					<img
						src='/icons/GhostOpsAI.svg'
						alt='GhostOpsAI'
						className='h-8 w-auto'
					/>
				</Link>
			</div>

			<div className='max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10'>
				{/* Page title */}
				<div className='flex flex-col gap-1 pb-2'>
					<img
						src='/icons/OpsBuilder.svg'
						alt='GhostOpsAI'
						className='h-50 w-auto'
					/>
				</div>

				{/* ── Mission Details ────────────────────────────────── */}
				<div className='flex flex-col gap-4'>
					<SectionHeader title='Mission Details' />

					{/* Mission Name */}
					<div className='flex flex-col gap-2'>
						<span className={labelCls}>
							Mission Name <span className='text-red-500'>*</span>
						</span>

						{nameEditing ?
							<div className='flex gap-2'>
								<input
									autoFocus
									type='text'
									value={meta.name}
									maxLength={48}
									placeholder='OPERATION ...'
									onChange={(e) =>
										updateMeta("name", e.target.value.toUpperCase())
									}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === "Escape")
											setNameEditing(false);
									}}
									className='form'
								/>
								<button
									type='button'
									onClick={() => setNameEditing(false)}
									className={secondaryBtnCls}>
									Done
								</button>
							</div>
						:	<div className='flex items-center gap-2 px-3 py-2.5 border border-lines rounded-lg bg-blk/50'>
								<span className='flex-1 text-sm text-fontz truncate'>
									{meta.name || <span className='text-gray-500'>—</span>}
								</span>
								<button
									type='button'
									onClick={() => setNameEditing(true)}
									className='text-lines hover:text-btn transition-colors p-1 shrink-0'>
									<FontAwesomeIcon icon={faPencil} />
								</button>
								<button
									type='button'
									onClick={() => updateMeta("name", generateMissionName())}
									className='text-lines hover:text-btn transition-colors p-1 shrink-0'>
									<FontAwesomeIcon icon={faRotate} />
								</button>
							</div>
						}

						{/* Suggestions */}
						<div className='flex flex-col gap-1.5'>
							<div className='flex items-center justify-between'>
								<span className={labelCls}>Suggestions</span>
								<button
									type='button'
									onClick={() => {
										const n = generateMissionNames(3);
										setNameSuggestions(n);
										updateMeta("name", n[0]);
										setNameEditing(false);
									}}
									className='flex items-center gap-1 text-xs font-medium text-lines hover:text-btn transition-colors'>
									<FontAwesomeIcon icon={faRotate} /> Re-roll
								</button>
							</div>
							<div className='flex flex-col gap-1.5'>
								{nameSuggestions.map((n) => (
									<button
										key={n}
										type='button'
										onClick={() => {
											updateMeta("name", n);
											setNameEditing(false);
										}}
										className={cls(
											"text-sm text-left px-3 py-2 rounded-lg border transition-colors",
											meta.name === n ?
												"border-btn bg-btn/10 text-btn"
											:	"border-lines text-fontz/70 hover:border-btn hover:bg-highlight",
										)}>
										{n}
									</button>
								))}
							</div>
						</div>
					</div>
					<Field label='Author'>
						<input
							className='form'
							value={meta.author}
							onChange={(e) => updateMeta("author", e.target.value)}
							placeholder='Callsign or name'
						/>
					</Field>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<Field label='Difficulty'>
							<select
								className='form'
								value={meta.difficulty}
								onChange={(e) => updateMeta("difficulty", e.target.value)}>
								{DIFFICULTIES.map((d) => (
									<option
										key={d}
										value={d}>
										{d}
									</option>
								))}
							</select>
						</Field>
						<Field label='Platform'>
							<select
								className='form'
								value={meta.platform}
								onChange={(e) => updateMeta("platform", e.target.value)}>
								{PLATFORMS.map((p) => (
									<option
										key={p}
										value={p}>
										{p}
									</option>
								))}
							</select>
						</Field>
						<Field label='World Parameters'>
							<select
								className='form'
								value={meta.world}
								onChange={(e) => updateMeta("world", e.target.value)}>
								{WORLDS.map((w) => (
									<option
										key={w}
										value={w}>
										{w}
									</option>
								))}
							</select>
						</Field>
						<Field label='Time of Day'>
							<select
								className='form'
								value={meta.timeOfDay}
								onChange={(e) => updateMeta("timeOfDay", e.target.value)}>
								{TIMES_OF_DAY.map((t) => (
									<option
										key={t}
										value={t}>
										{t}
									</option>
								))}
							</select>
						</Field>
					</div>
					<Field label='Briefing'>
						<textarea
							className={cls("form", "resize-none h-20 leading-relaxed")}
							value={meta.sitrep}
							onChange={(e) => updateMeta("sitrep", e.target.value)}
							placeholder='Situation report, mission context...'
						/>
					</Field>
				</div>

				{/* ── Rules of Engagement ───────────────────────────── */}
				<div className='flex flex-col gap-4'>
					<SectionHeader title='Rules of Engagement' />
					<div className='flex flex-wrap gap-1.5'>
						{ROE_RULES.map((rule) => {
							const active = roe.rules.includes(rule.id);
							return (
								<button
									key={rule.id}
									type='button'
									onClick={() => updateROERule(rule.id)}
									className={cls(
										"text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors",
										active ?
											"border-red-800/60 bg-red-900/20 text-red-400"
										:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
									)}>
									{rule.label}
								</button>
							);
						})}
					</div>
					<Field label='Custom Rules'>
						<textarea
							className={cls("form", "resize-none h-16")}
							value={roe.custom}
							onChange={(e) => updateROECustom(e.target.value)}
							placeholder='Additional rules not listed above...'
						/>
					</Field>
				</div>

				{/* ── Restrictions ─────────────────────────────────── */}
				<div className='flex flex-col gap-6'>
					<SectionHeader title='Restrictions' />

					{/* Loadout */}
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-3'>
							<span className='text-sm font-medium text-gray-400'>Loadout</span>
							<div className='flex gap-1.5'>
								{LOADOUT_MODES.map((m) => (
									<button
										key={m}
										type='button'
										onClick={() => updateLoadoutMode(m)}
										className={cls(
											"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
											restrictions.loadout.mode === m ?
												"border-btn bg-btn/10 text-btn"
											:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
										)}>
										{m}
									</button>
								))}
							</div>
						</div>
						<div className='flex flex-col gap-4 pl-4 border-l-2 border-lines/20'>
							{["primary", "secondary", "sidearm"].map((slot) => (
								<WeaponSlotPicker
									key={slot}
									slotKey={slot}
									value={restrictions.loadout[slot] ?? defaultWeaponSlot()}
									onChange={(val) => updateLoadout(slot, val)}
								/>
							))}
						</div>
					</div>

					{/* Items */}
					<div className='flex flex-col gap-2'>
						<div className='flex items-center gap-3'>
							<span className='text-sm font-medium text-gray-400'>Items</span>
							<div className='flex gap-1.5'>
								{LIST_MODES.map((m) => (
									<button
										key={m}
										type='button'
										onClick={() => updateListSection("items", { mode: m })}
										className={cls(
											"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
											restrictions.items.mode === m ?
												"border-btn bg-btn/10 text-btn"
											:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
										)}>
										{m}
									</button>
								))}
							</div>
						</div>
						{restrictions.items.mode === "List" && (
							<CheckGrid
								items={Object.keys(ITEMS)}
								selected={restrictions.items.list}
								onToggle={(n) => toggleListItem("items", n)}
							/>
						)}
					</div>

					{/* Perks */}
					<div className='flex flex-col gap-2'>
						<div className='flex items-center gap-3'>
							<span className='text-sm font-medium text-gray-400'>Perks</span>
							<div className='flex gap-1.5'>
								{LIST_MODES.map((m) => (
									<button
										key={m}
										type='button'
										onClick={() => updateListSection("perks", { mode: m })}
										className={cls(
											"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
											restrictions.perks.mode === m ?
												"border-btn bg-btn/10 text-btn"
											:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
										)}>
										{m}
									</button>
								))}
							</div>
						</div>
						{restrictions.perks.mode === "List" && (
							<CheckGrid
								items={PERKS.map((p) => p.name)}
								selected={restrictions.perks.list}
								onToggle={(n) => toggleListItem("perks", n)}
							/>
						)}
					</div>

					{/* Vehicles */}
					<div className='flex flex-col gap-2'>
						<div className='flex items-center gap-3'>
							<span className='text-sm font-medium text-gray-400'>
								Vehicles
							</span>
							<div className='flex gap-1.5'>
								{LIST_MODES.map((m) => (
									<button
										key={m}
										type='button'
										onClick={() => updateListSection("vehicles", { mode: m })}
										className={cls(
											"text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
											restrictions.vehicles.mode === m ?
												"border-btn bg-btn/10 text-btn"
											:	"border-lines text-fontz/60 hover:bg-highlight hover:text-white",
										)}>
										{m}
									</button>
								))}
							</div>
						</div>
						{restrictions.vehicles.mode === "List" && (
							<div className='flex flex-col gap-3'>
								<CheckGrid
									items={GARAGE.map((v) => v.name)}
									selected={restrictions.vehicles.list}
									onToggle={(n) => toggleListItem("vehicles", n)}
								/>
								<Field label='Custom Vehicle'>
									<input
										className='form'
										value={restrictions.vehicles.custom ?? ""}
										onChange={(e) =>
											updateListSection("vehicles", {
												custom: e.target.value,
											})
										}
										placeholder='e.g. Blackhawk'
									/>
								</Field>
							</div>
						)}
					</div>
				</div>

				{/* ── Mods (PC only) ───────────────────────────────── */}
				{meta.platform === "PC" && (
					<div className='flex flex-col gap-3'>
						<SectionHeader title='Mods' />
						<CheckGrid
							items={MODS}
							selected={restrictions.mods.list}
							onToggle={(n) => toggleListItem("mods", n)}
						/>
						<Field label='Other Mods or Mod Settings'>
							<input
								className='form'
								value={restrictions.mods.custom ?? ""}
								onChange={(e) =>
									updateListSection("mods", { custom: e.target.value })
								}
								placeholder='e.g. Ghost Recon Reshade'
							/>
						</Field>
					</div>
				)}

				{/* ── Operation Phases ────────────────────────────── */}
				<div className='flex flex-col gap-4'>
					<SectionHeader title='Operation Phases' />
					{legs.map((leg, i) => (
						<LegBlock
							key={i}
							leg={leg}
							index={i}
							onChange={(val) => updateLeg(i, val)}
							onRemove={() => removeLeg(i)}
							canRemove={legs.length > 1}
						/>
					))}
					<button
						type='button'
						onClick={addLeg}
						disabled={legs.length >= 8}
						className='text-sm font-medium px-4 py-2.5 border border-dashed border-lines rounded-lg text-fontz/70 hover:border-btn hover:text-btn transition-colors disabled:opacity-40 disabled:cursor-not-allowed'>
						+ Add Phase
					</button>
				</div>
			</div>

			{/* ── Sticky footer ─────────────────────────────────────── */}
			<div className='fixed bottom-0 left-0 right-0 bg-blk border-t border-lines/30 z-50'>
				{/* Saves menu — slides up above footer */}
				{showSavesMenu && (
					<div className='border-b border-lines/30 px-4 py-3 max-w-4xl mx-auto'>
						{savedNames.length === 0 ?
							<p className='text-sm text-gray-400'>No saved missions yet.</p>
						:	<div className='flex flex-col gap-1.5 max-h-40 overflow-y-auto'>
								{savedNames.map((name) => (
									<div
										key={name}
										className='flex items-center justify-between gap-3'>
										<span className='text-sm text-fontz truncate'>{name}</span>
										<div className='flex items-center gap-1.5 shrink-0'>
											<button
												type='button'
												onClick={() => handleLoad(name)}
												className='text-xs font-medium px-2.5 py-1 rounded-lg border border-lines text-fontz/70 hover:border-btn hover:text-btn transition-colors'>
												Load
											</button>
											<button
												type='button'
												onClick={() => handleDeleteSave(name)}
												className='text-xs font-medium px-2.5 py-1 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 transition-colors'>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						}
					</div>
				)}

				<div className='max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap'>
					{/* Left — save / load */}
					<div className='flex items-center gap-1.5 sm:gap-2 flex-wrap'>
						<button
							type='button'
							onClick={handleSave}
							title={saveLabel}
							className={cls(
								"flex items-center gap-1.5",
								saveLabel === "Saved!" ?
									"text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-btn bg-btn/10 text-btn"
								:	secondaryBtnCls,
							)}>
							<FontAwesomeIcon
								icon={saveLabel === "Saved!" ? faCheck : faFloppyDisk}
							/>
							<span className='hidden sm:inline'>{saveLabel}</span>
						</button>
						<button
							type='button'
							onClick={() => setShowSavesMenu((v) => !v)}
							title='Saved missions'
							className={cls(
								"text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5",
								showSavesMenu ?
									"border-lines/60 text-fontz"
								:	"border-lines/30 text-gray-400 hover:border-lines hover:text-fontz",
							)}>
							<FontAwesomeIcon icon={faFolderOpen} />
							<span className='hidden sm:inline'>
								Saved {savedNames.length > 0 ? `(${savedNames.length})` : ""}
							</span>
							{savedNames.length > 0 && (
								<span className='sm:hidden text-xs'>{savedNames.length}</span>
							)}
							<span className='text-xs'>{showSavesMenu ? "▾" : "▸"}</span>
						</button>

						<span className='w-px h-5 bg-lines/30 mx-1 hidden sm:block' />

						<input
							ref={importRef}
							type='file'
							accept='.json'
							className='hidden'
							onChange={importJSON}
						/>
						<button
							type='button'
							onClick={() => importRef.current?.click()}
							title='Import'
							className='text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-lines/30 text-gray-400 hover:border-lines hover:text-fontz transition-colors flex items-center gap-1.5'>
							<FontAwesomeIcon icon={faFileImport} />
							<span className='hidden sm:inline'>Import</span>
						</button>
						<button
							type='button'
							onClick={exportJSON}
							title='Export'
							className='text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-lines/30 text-gray-400 hover:border-lines hover:text-fontz transition-colors flex items-center gap-1.5'>
							<FontAwesomeIcon icon={faFileExport} />
							<span className='hidden sm:inline'>Export</span>
						</button>
						<button
							type='button'
							onClick={clearDraft}
							title='Clear'
							className='text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-lines/30 text-gray-500 hover:border-red-900/50 hover:text-red-400 transition-colors flex items-center gap-1.5'>
							<FontAwesomeIcon icon={faTrashCan} />
							<span className='hidden sm:inline'>Clear</span>
						</button>
					</div>

					{/* Right — share */}
					<button
						type='button'
						onClick={copyLink}
						disabled={shortening}
						title='Copy Mission Link'
						className={cls(
							copied ? "btn" : "btn opacity-90",
							"flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait",
						)}>
						<FontAwesomeIcon icon={copied ? faCheck : faLink} />
						<span className='hidden sm:inline'>
							{shortening ? "Shortening…"
							: copied ? "Link Copied!"
							: "Copy Mission Link"}
						</span>
						<span className='sm:hidden'>
							{shortening ? "…" : copied ? "Copied!" : "Copy Link"}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
