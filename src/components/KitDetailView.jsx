import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faXmark } from "@fortawesome/free-solid-svg-icons";
import {
	WEAPON_TYPES,
	ITEMS,
	PERKS_MAP,
	HELMET_TYPE,
	VEST_TYPE,
	BELT_TYPE,
} from "@/config";

export default function KitDetailView({ kit, onClose, onEdit }) {
	const weapons = [
		kit.primary?.weapon && {
			label: "Primary",
			type: kit.primary.weaponType,
			weapon: kit.primary.weapon,
			att: kit.primary.attachments,
		},
		kit.secondary?.weapon && {
			label: "Secondary",
			type: kit.secondary.weaponType,
			weapon: kit.secondary.weapon,
			att: kit.secondary.attachments,
		},
		kit.handgun?.weapon && {
			label: "Handgun",
			type: "HDG",
			weapon: kit.handgun.weapon,
			att: kit.handgun.attachments,
		},
	].filter(Boolean);

	const gear = [
		kit.helmet && { label: "Helmet", url: HELMET_TYPE[kit.helmet]?.url, value: HELMET_TYPE[kit.helmet]?.name ?? kit.helmet },
		kit.vest   && { label: "Vest",   url: VEST_TYPE[kit.vest]?.url,     value: VEST_TYPE[kit.vest]?.name   ?? kit.vest   },
		kit.belt   && { label: "Belt",   url: BELT_TYPE[kit.belt]?.url,     value: BELT_TYPE[kit.belt]?.name   ?? kit.belt   },
	].filter(Boolean);

	const activeItems = (kit.items || []).filter((i) => ITEMS[i]);
	const activePerks = (kit.perks || []).map((n) => PERKS_MAP[n]).filter(Boolean);

	return (
		<div className='flex flex-col h-full'>
			{/* Header */}
			<div className='shrink-0 px-5 py-4 border-b border-lines/40 bg-neutral-950/60'>
				<div className='flex items-start gap-3'>
					<div className='flex-1 min-w-0'>
						<div className='flex items-center gap-2'>
							<div className='w-1 h-4 bg-btn shrink-0' />
							<h2 className='font-mono text-sm font-bold text-white uppercase tracking-widest truncate'>
								{kit.name}
							</h2>
						</div>
					</div>
					<div className='flex items-center gap-1.5 shrink-0'>
						{onEdit && (
							<button
								type='button'
								onClick={onEdit}
								className='flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1.5 border border-btn/40 text-btn hover:border-btn hover:bg-btn/10 transition-all'>
								<FontAwesomeIcon icon={faPen} className='text-[9px]' />
								Edit
							</button>
						)}
						<button
							type='button'
							onClick={onClose}
							className='w-7 h-7 flex items-center justify-center text-lines/60 hover:text-white border border-lines/40 hover:border-lines/60 bg-neutral-950/40 transition-colors'>
							<FontAwesomeIcon icon={faXmark} className='text-[12px]' />
						</button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className='flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6'>
				{/* Weapons */}
				{weapons.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Weapons
							</span>
						</div>
						{weapons.map(({ label, type, weapon, att }) => {
							const activeAtts = Object.entries(att || {}).filter(([, v]) => v);
							return (
								<div
									key={label}
									className='flex flex-col gap-1.5 p-3 border border-lines/40 bg-neutral-950/30'>
									<div className='flex items-center gap-2'>
										<span className='font-mono text-[9px] tracking-[0.25em] uppercase text-lines/40 w-16 shrink-0'>
											{label}
										</span>
										{type && WEAPON_TYPES[type]?.imgUrl && (
											<img
												src={WEAPON_TYPES[type].imgUrl}
												alt=''
												className='h-4 object-contain shrink-0'
												style={{ filter: "invert(1) opacity(0.35)" }}
											/>
										)}
									</div>
									<span className='font-mono text-[13px] font-semibold text-white tracking-wide'>
										{weapon}
									</span>
									{activeAtts.length > 0 && (
										<div className='grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1.5 border-t border-lines/40 mt-0.5'>
											{activeAtts.map(([k, v]) => (
												<div key={k} className='flex items-baseline gap-1.5'>
													<span className='font-mono text-[9px] tracking-widest uppercase text-lines/40 shrink-0 w-14'>
														{k}
													</span>
													<span className='font-mono text-[10px] text-lines truncate'>
														{v}
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{/* Gear */}
				{gear.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Gear
							</span>
						</div>
						<div className='grid grid-cols-3 gap-2'>
							{gear.map(({ label, url, value }) => (
								<div
									key={label}
									className='flex flex-col gap-1 p-2 border border-lines/40 bg-neutral-950/30'>
									{url && (
										<img
											src={url}
											alt={label}
											className='w-5 h-5 object-contain'
											style={{ filter: "invert(1) opacity(0.45)" }}
										/>
									)}
									<span className='font-mono text-[7px] tracking-widest uppercase text-lines/40'>
										{label}
									</span>
									<span className='font-mono text-[9px] text-lines leading-snug'>
										{value}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Equipment */}
				{activeItems.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Equipment
							</span>
						</div>
						<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
							{activeItems.map((item) => (
								<div
									key={item}
									className='flex items-center gap-2 p-2 border border-lines/40 bg-neutral-950/30'>
									<img
										src={ITEMS[item]}
										alt={item}
										className='w-6 h-6 object-contain shrink-0'
										style={{ filter: "invert(1) opacity(0.6)" }}
									/>
									<span className='font-mono text-[10px] text-lines leading-tight'>
										{item}
									</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Perks */}
				{activePerks.length > 0 && (
					<div className='flex flex-col gap-3'>
						<div className='flex items-center gap-2 pb-1.5 border-b border-lines/40'>
							<div className='w-0.5 h-3 bg-btn' />
							<span className='font-mono text-[10px] tracking-[0.3em] uppercase text-lines font-semibold'>
								Perks
							</span>
						</div>
						<div className='flex flex-col gap-2'>
							{activePerks.map((perk) => (
								<div
									key={perk.name}
									className='flex items-center gap-3 p-3 border border-lines/40 bg-neutral-950/30'>
									<img
										src={perk.icon}
										alt={perk.name}
										className='w-8 h-8 object-contain shrink-0'
									/>
									<div className='flex flex-col gap-0.5 min-w-0'>
										<div className='flex items-center gap-2'>
											<span className='font-mono text-[11px] font-semibold text-white leading-none'>
												{perk.name}
											</span>
											<span className='font-mono text-[9px] tracking-widest uppercase text-btn/70 border border-btn/20 px-1'>
												{perk.type}
											</span>
										</div>
										<span className='font-mono text-[9px] text-lines/60 leading-tight'>
											{perk.description}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{weapons.length === 0 && gear.length === 0 && activeItems.length === 0 && activePerks.length === 0 && (
					<div className='flex items-center justify-center py-12'>
						<span className='font-mono text-[11px] text-lines/40 italic'>
							Loadout is empty
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

KitDetailView.propTypes = {
	kit: PropTypes.object.isRequired,
	onClose: PropTypes.func.isRequired,
	onEdit: PropTypes.func,
};
