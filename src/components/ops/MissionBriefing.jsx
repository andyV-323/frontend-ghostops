import { PropTypes } from "prop-types";
import { PROVINCE_DISPLAY_NAMES, ROE_RULE_MAP } from "@/utils/missionSchema";
import { PROVINCES } from "@/config/provinces";
import { WEAPONS_BY_TYPE, WEAPON_TYPES } from "@/config/weapons";

const WEAPON_TYPE_MAP = {};
Object.entries(WEAPONS_BY_TYPE).forEach(([type, weapons]) => {
	weapons.forEach(w => { WEAPON_TYPE_MAP[w] = type; });
});

const SLOT_LABEL = { primary: "PRIMARY", secondary: "SECONDARY", sidearm: "SIDEARM" };
const LIST_LABEL = { None: "PROHIBITED", All: "UNRESTRICTED", List: "SPECIFIED" };

function Section({ title, children }) {
	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center gap-3'>
				<span className='font-mono text-[9px] tracking-[0.4em] uppercase text-btn/60 shrink-0'>{title}</span>
				<div className='flex-1 h-px bg-lines/15' />
			</div>
			{children}
		</div>
	);
}
Section.propTypes = { title: PropTypes.string, children: PropTypes.node };

function Row({ label, value }) {
	if (!value) return null;
	return (
		<div className='flex items-start gap-3'>
			<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30 w-24 shrink-0 pt-0.5'>{label}</span>
			<span className='font-mono text-[12px] text-fontz/80'>{value}</span>
		</div>
	);
}
Row.propTypes = { label: PropTypes.string, value: PropTypes.string };

function Badge({ children, color = "lines" }) {
	const colorMap = {
		lines:  "border-lines/20 text-lines/50",
		btn:    "border-btn/30 text-btn/70",
		red:    "border-red-800/40 text-red-400/70",
		amber:  "border-amber-800/40 text-amber-400/70",
	};
	return (
		<span className={`font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border rounded ${colorMap[color]}`}>
			{children}
		</span>
	);
}
Badge.propTypes = { children: PropTypes.node, color: PropTypes.string };

function WeaponSlot({ label, slot }) {
	if (!slot?.weaponId) return null;
	const attEntries = Object.entries(slot.attachments || {}).filter(([, v]) => v);
	const weaponType = WEAPON_TYPE_MAP[slot.weaponId];
	const iconUrl = weaponType ? WEAPON_TYPES[weaponType]?.imgUrl : null;
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-2.5'>
				<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/25 w-20 shrink-0'>{label}</span>
				{iconUrl && (
					<img src={iconUrl} alt={weaponType} className='w-7 h-3.5 object-contain shrink-0' style={{ filter: "invert(1) opacity(0.4)" }} />
				)}
				<span className='font-mono text-[12px] text-fontz/80'>{slot.weaponId}</span>
			</div>
			{attEntries.length > 0 && (
				<div className='ml-[88px] flex flex-wrap gap-1.5'>
					{attEntries.map(([slotName, val]) => (
						<span key={slotName} className='font-mono text-[9px] text-lines/40'>
							<span className='text-lines/20'>{slotName}/</span>{val}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
WeaponSlot.propTypes = { label: PropTypes.string, slot: PropTypes.object };

function ProvinceView({ label, approachFrom, provinceId, bases, infil, exfil }) {
	const provinceName = PROVINCE_DISPLAY_NAMES[provinceId] || provinceId || "—";
	const provinceLocMap = Object.fromEntries(
		(PROVINCES[provinceId]?.locations ?? []).map(l => [l.name, l])
	);

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center gap-2 flex-wrap'>
				<span className='font-mono text-[9px] tracking-[0.35em] uppercase text-btn/50'>{label}</span>
				<span className='font-mono text-[11px] text-fontz/60 tracking-widest uppercase'>{provinceName}</span>
				{approachFrom && <Badge color='amber'>FROM {approachFrom.toUpperCase()}</Badge>}
			</div>

			{/* Infil */}
			{infil && (
				<div className='flex flex-col gap-0.5'>
					<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/25 mb-1'>INFIL</span>
					<span className='font-mono text-[11px] text-fontz/70'>
						{infil.type}{infil.locationId ? ` — ${infil.locationId}` : ""}
					</span>
					{infil.note && <span className='font-mono text-[10px] text-lines/40 italic'>{infil.note}</span>}
				</div>
			)}

			{/* Bases & Objectives */}
			{bases?.length > 0 && (
				<div className='flex flex-col gap-3'>
					<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/25 mb-0.5'>BASES &amp; OBJECTIVES</span>
					{bases.map((b, bi) => (
						<div key={bi} className='flex flex-col gap-1 pl-2 border-l border-lines/10'>
							<span className='font-mono text-[11px] text-fontz/70'>
								BASE {bi + 1}{b.locationId ? ` — ${b.locationId}` : ""}
							</span>
							{b.note && <span className='font-mono text-[10px] text-lines/40 italic'>{b.note}</span>}
							{(b.objectives ?? []).map((obj, i) => (
								<div key={i} className='flex flex-col gap-0.5 mt-1'>
									<div className='flex items-center gap-2'>
										<span className='font-mono text-[9px] text-lines/25'>{i + 1}.</span>
										<Badge color='btn'>{obj.type}</Badge>
										{obj.targetId && (
											<span className='font-mono text-[11px] text-fontz/70'>{obj.targetId}</span>
										)}
									</div>
									{obj.locationId && provinceLocMap[obj.locationId] && (
										<span className='font-mono text-[10px] text-lines/40 ml-4'>
											@ {obj.locationId}
										</span>
									)}
									{obj.note && <span className='font-mono text-[10px] text-lines/30 italic ml-4'>{obj.note}</span>}
								</div>
							))}
						</div>
					))}
				</div>
			)}

			{/* Exfil */}
			{exfil && (
				<div className='flex flex-col gap-0.5'>
					<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/25 mb-1'>EXFIL</span>
					<span className='font-mono text-[11px] text-fontz/70'>
						{exfil.type}{exfil.locationId ? ` — ${exfil.locationId}` : ""}
					</span>
					{exfil.note && <span className='font-mono text-[10px] text-lines/40 italic'>{exfil.note}</span>}
				</div>
			)}
		</div>
	);
}
ProvinceView.propTypes = {
	label: PropTypes.string,
	approachFrom: PropTypes.string,
	provinceId: PropTypes.string,
	bases: PropTypes.array,
	infil: PropTypes.object,
	exfil: PropTypes.object,
};

function LegView({ leg, index }) {
	const extraProvinces = leg.extraProvinces ?? [];

	return (
		<div className='flex flex-col gap-5 pl-3 border-l border-lines/10'>
			<span className='font-mono text-[9px] tracking-[0.35em] uppercase text-btn/50'>PHASE {index + 1}</span>

			<ProvinceView
				label='PROVINCE 1'
				provinceId={leg.provinceId}
				bases={leg.bases}
				infil={leg.infil}
				exfil={extraProvinces.length === 0 ? leg.exfil : null}
			/>

			{extraProvinces.map((segment, i) => (
				<ProvinceView
					key={i}
					label={`PROVINCE ${i + 2}`}
					approachFrom={segment.approachFrom}
					provinceId={segment.provinceId}
					bases={segment.bases}
					exfil={i === extraProvinces.length - 1 ? leg.exfil : null}
				/>
			))}
		</div>
	);
}
LegView.propTypes = { leg: PropTypes.object, index: PropTypes.number };

export default function MissionBriefing({ mission }) {
	if (!mission) return null;
	const { meta, legs, roe, restrictions } = mission;

	const activeROE = (roe?.rules ?? []).map(id => ROE_RULE_MAP[id]?.label).filter(Boolean);
	const loadout = restrictions?.loadout;
	const hasLoadout = loadout && (loadout.primary?.weaponId || loadout.secondary?.weaponId || loadout.sidearm?.weaponId);

	return (
		<div className='flex flex-col gap-8 py-6 max-w-2xl mx-auto px-4'>
			{/* Header */}
			<div className='flex flex-col gap-2 border-b border-lines/10 pb-6'>
				<h1 className='font-mono text-xl tracking-[0.15em] uppercase text-fontz'>
					{meta?.name || "UNTITLED MISSION"}
				</h1>
				<div className='flex flex-wrap items-center gap-3'>
					{meta?.author && <span className='font-mono text-[10px] text-lines/40'>by {meta.author}</span>}
					{meta?.difficulty && <Badge>{meta.difficulty}</Badge>}
					{meta?.platform && <Badge>{meta.platform}</Badge>}
					{meta?.world && meta.world !== "Any" && <Badge color='amber'>{meta.world}</Badge>}
					{meta?.timeOfDay && meta.timeOfDay !== "Any" && <Badge>{meta.timeOfDay}</Badge>}
				</div>
				{meta?.sitrep && (
					<p className='font-mono text-[11px] text-lines/50 leading-relaxed mt-2 italic'>{meta.sitrep}</p>
				)}
			</div>

			{/* ROE */}
			{(activeROE.length > 0 || roe?.custom) && (
				<Section title='Rules of Engagement'>
					<div className='flex flex-col gap-2'>
						{activeROE.map(label => (
							<div key={label} className='flex items-center gap-2'>
								<span className='w-1 h-1 rounded-full bg-red-500/50 shrink-0' />
								<span className='font-mono text-[11px] text-fontz/70'>{label}</span>
							</div>
						))}
						{roe?.custom && (
							<p className='font-mono text-[11px] text-lines/50 italic mt-1'>{roe.custom}</p>
						)}
					</div>
				</Section>
			)}

			{/* Restrictions */}
			{(hasLoadout || restrictions?.items?.mode !== "All" || restrictions?.perks?.mode !== "All" || restrictions?.vehicles?.mode !== "All" || restrictions?.mods?.list?.length > 0 || restrictions?.mods?.custom) && (
				<Section title='Restrictions'>
					<div className='flex flex-col gap-4'>
						{hasLoadout && (
							<div className='flex flex-col gap-2'>
								<div className='flex items-center gap-2 mb-1'>
									<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30'>Loadout</span>
									{loadout.mode && <Badge>{loadout.mode}</Badge>}
								</div>
								<WeaponSlot label={SLOT_LABEL.primary}   slot={loadout.primary} />
								<WeaponSlot label={SLOT_LABEL.secondary} slot={loadout.secondary} />
								<WeaponSlot label={SLOT_LABEL.sidearm}   slot={loadout.sidearm} />
							</div>
						)}

						{restrictions?.items?.mode !== "All" && (
							<div className='flex flex-col gap-1'>
								<div className='flex items-center gap-2'>
									<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30'>Items</span>
									<Badge color={restrictions.items.mode === "None" ? "red" : "lines"}>
										{LIST_LABEL[restrictions.items.mode]}
									</Badge>
								</div>
								{restrictions.items.mode === "List" && restrictions.items.list?.length > 0 && (
									<div className='flex flex-wrap gap-1.5 mt-1'>
										{restrictions.items.list.map(n => <Badge key={n}>{n}</Badge>)}
									</div>
								)}
							</div>
						)}

						{restrictions?.perks?.mode !== "All" && (
							<div className='flex flex-col gap-1'>
								<div className='flex items-center gap-2'>
									<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30'>Perks</span>
									<Badge color={restrictions.perks.mode === "None" ? "red" : "lines"}>
										{LIST_LABEL[restrictions.perks.mode]}
									</Badge>
								</div>
								{restrictions.perks.mode === "List" && restrictions.perks.list?.length > 0 && (
									<div className='flex flex-wrap gap-1.5 mt-1'>
										{restrictions.perks.list.map(n => <Badge key={n}>{n}</Badge>)}
									</div>
								)}
							</div>
						)}

						{restrictions?.vehicles?.mode !== "All" && (
							<div className='flex flex-col gap-1'>
								<div className='flex items-center gap-2'>
									<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30'>Vehicles</span>
									<Badge color={restrictions.vehicles.mode === "None" ? "red" : "lines"}>
										{LIST_LABEL[restrictions.vehicles.mode]}
									</Badge>
								</div>
								{restrictions.vehicles.mode === "List" && restrictions.vehicles.list?.length > 0 && (
									<div className='flex flex-wrap gap-1.5 mt-1'>
										{restrictions.vehicles.list.map(n => <Badge key={n}>{n}</Badge>)}
									</div>
								)}
								{restrictions.vehicles.custom && (
									<p className='font-mono text-[10px] text-lines/40 italic mt-0.5'>
										{restrictions.vehicles.custom}
									</p>
								)}
							</div>
						)}

						{(restrictions?.mods?.list?.length > 0 || restrictions?.mods?.custom) && (
							<div className='flex flex-col gap-1'>
								<span className='font-mono text-[9px] tracking-[0.3em] uppercase text-lines/30'>Mods</span>
								{restrictions.mods.list?.length > 0 && (
									<div className='flex flex-wrap gap-1.5 mt-1'>
										{restrictions.mods.list.map(n => <Badge key={n}>{n}</Badge>)}
									</div>
								)}
								{restrictions.mods.custom && (
									<p className='font-mono text-[10px] text-lines/40 italic mt-0.5'>
										{restrictions.mods.custom}
									</p>
								)}
							</div>
						)}
					</div>
				</Section>
			)}

			{/* Phases */}
			{legs?.length > 0 && (
				<Section title='Operation'>
					<div className='flex flex-col gap-6'>
						{legs.map((leg, i) => <LegView key={i} leg={leg} index={i} />)}
					</div>
				</Section>
			)}
		</div>
	);
}

MissionBriefing.propTypes = { mission: PropTypes.object };
