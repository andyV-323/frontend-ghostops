import { useMemo } from "react";
import { Link } from "react-router-dom";
import { decodeMission } from "@/utils/missionCodec";
import {
	PROVINCE_DISPLAY_NAMES,
	ROE_RULE_MAP,
	PERSON_TARGET_TYPES,
	VEHICLE_TARGET_TYPES,
} from "@/utils/missionSchema";
import { PROVINCES } from "@/config/provinces";
import { WEAPONS_BY_TYPE, WEAPON_TYPES } from "@/config/weapons";
import { GARAGE } from "@/config/garage";
import NoneGeographicalMap from "@/components/NoneGeographicalMap";

// ── Weapon type reverse lookup ────────────────────────────────────────────
const WEAPON_TYPE_MAP = {};
Object.entries(WEAPONS_BY_TYPE).forEach(([type, weapons]) => {
	weapons.forEach((w) => {
		WEAPON_TYPE_MAP[w] = type;
	});
});

// ── Vehicle name reverse lookup ───────────────────────────────────────────
const GARAGE_BY_NAME = Object.fromEntries(GARAGE.map((v) => [v.name, v]));

function VehicleThumb({ name, className = "w-10 h-10", bordered = true }) {
	const imgUrl = GARAGE_BY_NAME[name]?.imgUrl || "/img/default-vehicle.png";
	return (
		<img
			src={imgUrl}
			alt={name}
			className={`${className} object-cover shrink-0 ${bordered ? "rounded border border-lines/30" : ""}`}
			onError={(e) => {
				e.currentTarget.onerror = null;
				e.currentTarget.src = "/img/default-vehicle.png";
			}}
		/>
	);
}

// ── Small helpers ─────────────────────────────────────────────────────────
function Badge({ children, color = "lines" }) {
	const map = {
		lines: "border-lines text-fontz/70",
		btn: "border-btn/60 text-btn",
		red: "border-red-800/60 text-red-400",
		amber: "border-amber-700/60 text-amber-400",
	};
	return (
		<span
			className={`text-sm font-medium px-2 py-0.5 border rounded-lg ${map[color]}`}>
			{children}
		</span>
	);
}

function SectionLabel({ children }) {
	return <h2 className='text-xl font-bold text-fontz mb-3'>{children}</h2>;
}

function Row({ label, value }) {
	if (!value) return null;
	return (
		<div className='flex items-start gap-3'>
			<span className='text-base font-medium text-gray-400 w-24 shrink-0'>
				{label}
			</span>
			<span className='text-base text-fontz'>{value}</span>
		</div>
	);
}

// ── Per-province map + detail (a leg may span several) ────────────────────
function ProvinceSegmentView({
	label,
	approachFrom,
	provinceId,
	bases,
	objectives,
	infil,
	exfil,
}) {
	const province = PROVINCES[provinceId];
	const provinceName =
		PROVINCE_DISPLAY_NAMES[provinceId] || provinceId || "Unknown Province";
	const locByName = useMemo(
		() =>
			Object.fromEntries((province?.locations ?? []).map((l) => [l.name, l])),
		[province],
	);

	// Collect objective markers for the map (locations with coordinates)
	const mapLocations = useMemo(() => {
		if (!province) return [];
		const seen = new Set();
		const out = [];
		(objectives ?? []).forEach((obj) => {
			const isLocType =
				!PERSON_TARGET_TYPES.has(obj.type) &&
				!VEHICLE_TARGET_TYPES.has(obj.type);
			const name = isLocType ? obj.targetId || obj.locationId : null;
			if (name && locByName[name] && !seen.has(name)) {
				seen.add(name);
				out.push({
					...locByName[name],
					name: `${obj.type}: ${name}`,
				});
			}
		});
		// Also include base locations
		(bases ?? []).forEach((base) => {
			if (
				base.locationId &&
				locByName[base.locationId] &&
				!seen.has(base.locationId)
			) {
				seen.add(base.locationId);
				out.push({ ...locByName[base.locationId] });
			}
		});
		return out;
	}, [objectives, bases, locByName, province]);

	const infilPoint =
		infil?.locationId ?
			(locByName[infil.locationId]?.coordinates ?? null)
		:	null;
	const exfilPoint =
		exfil?.locationId ?
			(locByName[exfil.locationId]?.coordinates ?? null)
		:	null;
	const infilMethod = infil?.type ?? null;

	const hasMap = province && province.imgURL && province.coordinates?.bounds;
	// Size the mobile map panel to the province image's own aspect ratio so it
	// shows the whole map with no cropping and no dead space — rather than a
	// fixed height that's either too tall (empty margins) or forces a crop.
	const mapAspectRatio = hasMap ?
		(province.coordinates.bounds[1][1] - province.coordinates.bounds[0][1]) /
		(province.coordinates.bounds[1][0] - province.coordinates.bounds[0][0])
	:	null;

	return (
		<div className='flex flex-col'>
			{/* Segment header */}
			<div className='flex items-center gap-3 px-4 py-3 border-b border-lines bg-blk/50'>
				<span className='text-lg font-semibold text-fontz'>{provinceName}</span>
				<span className='text-base text-gray-400'>{province.biome}</span>
				{approachFrom && (
					<Badge color='amber'>Approaching from {approachFrom}</Badge>
				)}
			</div>

			{/* Map */}
			{hasMap ?
				<div
					className='w-full max-h-[70vh] sm:h-[420px] sm:max-h-none isolate'
					style={{ aspectRatio: mapAspectRatio }}>
					<NoneGeographicalMap
						bounds={province.coordinates.bounds}
						imgURL={province.imgURL}
						locationsInProvince={mapLocations}
						infilPoint={infilPoint}
						exfilPoint={exfilPoint}
						infilMethod={infilMethod}
						province={provinceId}
					/>
				</div>
			:	<div className='flex items-center justify-center h-24 bg-blk/50'>
					<span className='text-base text-gray-500'>
						No Map — Select a Province
					</span>
				</div>
			}

			{/* Segment details */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-5 bg-blk/30'>
				{/* Infil */}
				{infil && (
					<div>
						<span className='text-base font-medium text-gray-400 block mb-1'>
							Infil
						</span>
						<div className='flex flex-col gap-1'>
							<span className='text-base text-fontz'>
								{infil.type}
								{infil.locationId ? ` — ${infil.locationId}` : ""}
							</span>
							{infil.note && (
								<span className='text-sm text-gray-500 italic'>
									{infil.note}
								</span>
							)}
						</div>
					</div>
				)}

				{/* Bases */}
				{bases?.length > 0 && (
					<div>
						<span className='text-base font-medium text-gray-400 block mb-1'>
							Bases
						</span>
						<div className='flex flex-col gap-2'>
							{bases.map((b, i) => (
								<div
									key={i}
									className='flex flex-col gap-0.5'>
									<span className='text-base text-fontz'>
										{b.locationId || "—"}
									</span>
									{b.note && (
										<span className='text-sm text-gray-500 italic'>
											{b.note}
										</span>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Objectives */}
				{objectives?.length > 0 && (
					<div className='md:col-span-2'>
						<span className='text-base font-medium text-gray-400 block mb-1'>
							Objectives
						</span>
						<div className='flex flex-col gap-3'>
							{objectives.map((obj, i) => (
								<div
									key={i}
									className='flex items-start gap-3'>
									<span className='text-sm text-gray-500 mt-0.5 shrink-0'>
										{i + 1}.
									</span>
									{VEHICLE_TARGET_TYPES.has(obj.type) && obj.targetId && (
										<VehicleThumb
											name={obj.targetId}
											className='w-10 h-10'
										/>
									)}
									<div className='flex flex-col gap-1'>
										<div className='flex items-center gap-2 flex-wrap'>
											<Badge color='btn'>{obj.type}</Badge>
											{obj.targetId && (
												<span className='text-base text-fontz'>
													{obj.targetId}
												</span>
											)}
										</div>
										{obj.note && (
											<span className='text-sm text-gray-500 italic'>
												{obj.note}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Exfil — always last */}
			{exfil && (
				<div className='px-4 py-5 bg-blk/30 border-t border-lines/10'>
					<span className='text-base font-medium text-gray-400 block mb-1'>
						Exfil
					</span>
					<div className='flex flex-col gap-1'>
						<span className='text-base text-fontz'>
							{exfil.type}
							{exfil.locationId ? ` — ${exfil.locationId}` : ""}
						</span>
						{exfil.note && (
							<span className='text-sm text-gray-500 italic'>{exfil.note}</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function LegSection({ leg, index }) {
	const extraProvinces = leg.extraProvinces ?? [];
	return (
		<div className='flex flex-col border border-lines rounded-lg overflow-hidden mb-6 divide-y divide-lines/60'>
			{/* Leg header */}
			<div className='flex items-center gap-3 px-4 py-2 bg-blk'>
				<span className='font-mono text-xs tracking-[0.3em] uppercase text-btn/60'>
					Phase {index + 1}
				</span>
			</div>

			<ProvinceSegmentView
				label={leg.provinceId}
				provinceId={leg.provinceId}
				bases={leg.bases}
				objectives={leg.objectives}
				infil={leg.infil}
				exfil={extraProvinces.length === 0 ? leg.exfil : null}
			/>

			{extraProvinces.map((segment, i) => (
				<ProvinceSegmentView
					key={i}
					label={`Province ${i + 2}`}
					approachFrom={segment.approachFrom}
					provinceId={segment.provinceId}
					bases={segment.bases}
					objectives={segment.objectives}
					exfil={i === extraProvinces.length - 1 ? leg.exfil : null}
				/>
			))}
		</div>
	);
}

// ── Weapon slot row ───────────────────────────────────────────────────────
function WeaponSlotRow({ label, slot }) {
	if (!slot?.weaponId) return null;
	const weaponType = WEAPON_TYPE_MAP[slot.weaponId];
	const iconUrl = weaponType ? WEAPON_TYPES[weaponType]?.imgUrl : null;
	const attEntries = Object.entries(slot.attachments || {}).filter(
		([, v]) => v,
	);
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-3'>
				<span className='text-base font-medium text-gray-400 w-20 shrink-0'>
					{label}
				</span>
				{iconUrl && (
					<img
						src={iconUrl}
						alt={weaponType}
						className='w-7 h-3.5 object-contain shrink-0'
						style={{ filter: "invert(1) opacity(0.4)" }}
					/>
				)}
				<span className='text-base text-fontz'>{slot.weaponId}</span>
			</div>
			{attEntries.length > 0 && (
				<div className='ml-[92px] flex flex-wrap gap-2'>
					{attEntries.map(([slotName, val]) => (
						<span
							key={slotName}
							className='text-sm text-gray-500'>
							<span className='text-gray-600'>{slotName}/</span>
							{val}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function OpsReaderPage() {
	const mission = useMemo(() => {
		try {
			return decodeMission(window.location.hash);
		} catch {
			return null;
		}
	}, []);

	if (!mission) {
		return (
			<div className='min-h-screen bg-blk flex flex-col items-center justify-center gap-4 px-4'>
				<span className='text-lg font-semibold text-fontz'>
					No Mission Data
				</span>
				<p className='text-base text-gray-400 text-center max-w-xs'>
					This link contains no valid mission. Use the Ops Builder to create and
					share one.
				</p>
				<Link
					to='/ops/builder'
					className='btn'>
					Open Builder
				</Link>
			</div>
		);
	}

	const { meta, legs, roe, restrictions } = mission;
	const activeROE = (roe?.rules ?? [])
		.map((id) => ROE_RULE_MAP[id]?.label)
		.filter(Boolean);
	const loadout = restrictions?.loadout;

	return (
		<div className='min-h-screen bg-blk text-fontz'>
			{/* Top bar */}
			<div className='flex items-center justify-between px-4 py-3 border-b border-lines/30 bg-blk sticky top-0 z-[1000]'>
				<div className='flex items-center gap-3'>
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
				<Link
					to='/ops/builder'
					className='flex items-center gap-2 hover:opacity-80 transition-opacity'>
					<img
						src='/icons/OpsBuilder.svg'
						alt='GhostOpsAI'
						className='h-8 w-auto'
					/>
				</Link>
			</div>

			{/* Mission header */}
			<div className='px-4 py-6 border-b border-lines/30 bg-background/40'>
				<div className='max-w-4xl mx-auto flex flex-col gap-3'>
					<h1 className='text-2xl font-bold text-fontz'>
						{meta?.name || "Untitled Mission"}
					</h1>
					<div className='flex flex-wrap items-center gap-2'>
						{meta?.difficulty && <Badge>Difficulty: {meta.difficulty}</Badge>}
						{meta?.platform && <Badge>Platform: {meta.platform}</Badge>}
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						{meta?.author && (
							<span className='text-base text-gray-400'>by {meta.author}</span>
						)}
						{meta?.world && meta.world !== "Any" && (
							<Badge color='amber'>{meta.world}</Badge>
						)}
						{meta?.timeOfDay && meta.timeOfDay !== "Any" && (
							<Badge>{meta.timeOfDay}</Badge>
						)}
					</div>
					{meta?.sitrep && (
						<p className='text-base text-gray-400 leading-relaxed italic max-w-2xl'>
							{meta.sitrep}
						</p>
					)}
				</div>
			</div>

			{/* Legs with maps */}
			<div className='max-w-4xl mx-auto px-4 py-6'>
				{legs?.length > 0 && (
					<div className='flex flex-col'>
						{legs.map((leg, i) => (
							<LegSection
								key={i}
								leg={leg}
								index={i}
							/>
						))}
					</div>
				)}

				{/* ROE */}
				{(activeROE.length > 0 || roe?.custom) && (
					<div className='py-6 border-b border-lines/30'>
						<SectionLabel>Rules of Engagement</SectionLabel>
						<div className='flex flex-col gap-2'>
							{activeROE.map((label) => (
								<div
									key={label}
									className='flex items-center gap-2'>
									<span className='w-1.5 h-1.5 rounded-full bg-red-500/60 shrink-0' />
									<span className='text-base text-fontz'>{label}</span>
								</div>
							))}
							{roe?.custom && (
								<p className='text-base text-gray-400 italic mt-1'>
									{roe.custom}
								</p>
							)}
						</div>
					</div>
				)}

				{/* Restrictions */}
				{(loadout?.primary?.weaponId ||
					loadout?.secondary?.weaponId ||
					loadout?.sidearm?.weaponId ||
					restrictions?.items?.mode !== "All" ||
					restrictions?.perks?.mode !== "All" ||
					restrictions?.vehicles?.mode !== "All" ||
					restrictions?.mods?.list?.length > 0 ||
					restrictions?.mods?.custom) && (
					<div className='py-6'>
						<SectionLabel>Restrictions</SectionLabel>
						<div className='flex flex-col gap-5'>
							{/* Loadout */}
							{(loadout?.primary?.weaponId ||
								loadout?.secondary?.weaponId ||
								loadout?.sidearm?.weaponId) && (
								<div className='flex flex-col gap-3'>
									<Row
										label='Loadout'
										value={loadout?.mode}
									/>
									<div className='flex flex-col gap-3 pl-4 border-l-2 border-lines/20'>
										<WeaponSlotRow
											label='Primary'
											slot={loadout?.primary}
										/>
										<WeaponSlotRow
											label='Secondary'
											slot={loadout?.secondary}
										/>
										<WeaponSlotRow
											label='Sidearm'
											slot={loadout?.sidearm}
										/>
									</div>
								</div>
							)}

							{restrictions?.items?.mode !== "All" && (
								<div className='flex flex-col gap-2'>
									<div className='flex items-center gap-2'>
										<span className='text-base font-medium text-gray-400'>
											Items
										</span>
										<Badge
											color={
												restrictions.items.mode === "None" ? "red" : "lines"
											}>
											{restrictions.items.mode === "None" ?
												"Prohibited"
											:	"Specified"}
										</Badge>
									</div>
									{restrictions.items.mode === "List" &&
										restrictions.items.list?.length > 0 && (
											<div className='flex flex-wrap gap-1.5'>
												{restrictions.items.list.map((n) => (
													<Badge key={n}>{n}</Badge>
												))}
											</div>
										)}
								</div>
							)}

							{restrictions?.perks?.mode !== "All" && (
								<div className='flex flex-col gap-2'>
									<div className='flex items-center gap-2'>
										<span className='text-base font-medium text-gray-400'>
											Perks
										</span>
										<Badge
											color={
												restrictions.perks.mode === "None" ? "red" : "lines"
											}>
											{restrictions.perks.mode === "None" ?
												"Prohibited"
											:	"Specified"}
										</Badge>
									</div>
									{restrictions.perks.mode === "List" &&
										restrictions.perks.list?.length > 0 && (
											<div className='flex flex-wrap gap-1.5'>
												{restrictions.perks.list.map((n) => (
													<Badge key={n}>{n}</Badge>
												))}
											</div>
										)}
								</div>
							)}

							{restrictions?.vehicles?.mode !== "All" && (
								<div className='flex flex-col gap-2'>
									<div className='flex items-center gap-2'>
										<span className='text-base font-medium text-gray-400'>
											Vehicles
										</span>
										<Badge
											color={
												restrictions.vehicles.mode === "None" ? "red" : "lines"
											}>
											{restrictions.vehicles.mode === "None" ?
												"Prohibited"
											:	"Specified"}
										</Badge>
									</div>
									{restrictions.vehicles.mode === "List" &&
										restrictions.vehicles.list?.length > 0 && (
											<div className='flex flex-wrap gap-2'>
												{restrictions.vehicles.list.map((n) => (
													<div
														key={n}
														className='flex items-center gap-2 pr-3 border border-lines rounded-lg overflow-hidden'>
														<VehicleThumb
															name={n}
															className='w-50 h-50'
															bordered={false}
														/>
														<span className='text-base text-fontz'>{n}</span>
													</div>
												))}
											</div>
										)}
									{restrictions.vehicles.custom && (
										<p className='text-sm text-gray-500 italic'>
											{restrictions.vehicles.custom}
										</p>
									)}
								</div>
							)}

							{(restrictions?.mods?.list?.length > 0 ||
								restrictions?.mods?.custom) && (
								<div className='flex flex-col gap-2'>
									<span className='text-base font-medium text-gray-400'>
										Mods
									</span>
									{restrictions.mods.list?.length > 0 && (
										<div className='flex flex-wrap gap-1.5'>
											{restrictions.mods.list.map((n) => (
												<Badge key={n}>{n}</Badge>
											))}
										</div>
									)}
									{restrictions.mods.custom && (
										<p className='text-sm text-gray-500 italic'>
											{restrictions.mods.custom}
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
