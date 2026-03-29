import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPlus, faWrench } from "@fortawesome/free-solid-svg-icons";
import { PropTypes } from "prop-types";

const CONDITION_STYLE = {
	Optimal:      { bar: "bg-green-500",  text: "text-green-400",  border: "border-green-900/40"  },
	Operational:  { bar: "bg-lime-400",   text: "text-lime-400",   border: "border-lime-900/40"   },
	Compromised:  { bar: "bg-amber-400",  text: "text-amber-400",  border: "border-amber-900/40"  },
	Critical:     { bar: "bg-red-500",    text: "text-red-400",    border: "border-red-900/40"    },
};

const FuelBar = ({ pct }) => (
	<div className="flex items-center gap-1.5 min-w-0">
		<div className="flex-1 h-1 bg-lines/10 rounded-full overflow-hidden min-w-[40px]">
			<div
				className={[
					"h-full rounded-full transition-all",
					pct > 60 ? "bg-green-500" : pct > 25 ? "bg-amber-400" : "bg-red-500",
				].join(" ")}
				style={{ width: `${pct}%` }}
			/>
		</div>
		<span className="font-mono text-[8px] text-lines/35 shrink-0">{pct}%</span>
	</div>
);

FuelBar.propTypes = {
	pct: PropTypes.number.isRequired,
};

const vehicleLabel = (v) =>
	v.nickName && v.nickName !== "None" ? `${v.nickName} · ${v.vehicle}` : v.vehicle;

/* ═══════════════════════════════════════════════════════ */
const AssetPicker = ({ allVehicles, fullVehicleList, selected, onAdd, onRemove }) => {
	const available = allVehicles.filter((v) => !selected.includes(v._id));
	const selectedVehicles = selected
		.map((id) => fullVehicleList.find((v) => v._id === id))
		.filter(Boolean);

	return (
		<div className="flex flex-col gap-2">
			{/* ── Selected assets ───────────────────────────────── */}
			{selectedVehicles.length > 0 && (
				<div className="flex flex-col gap-1">
					<span className="font-mono text-[8px] tracking-[0.25em] text-lines/40 uppercase">
						Assigned — {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? "s" : ""}
					</span>
					{selectedVehicles.map((v) => {
						const cond = CONDITION_STYLE[v.condition] ?? CONDITION_STYLE.Operational;
						return (
							<div key={v._id} className="flex items-center gap-2.5 px-3 py-2 bg-btn/10 border border-btn/30 rounded-sm">
								<div className="flex-1 min-w-0">
									<span className="font-mono text-[11px] text-fontz font-semibold truncate block">
										{vehicleLabel(v)}
									</span>
									<FuelBar pct={v.remainingFuel ?? 0} />
								</div>
								<span className={`font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm shrink-0 ${cond.text} ${cond.border}`}>
									{v.condition}
								</span>
								<button
									type="button"
									onClick={() => onRemove(v._id)}
									className="text-lines/40 hover:text-red-400 transition-colors shrink-0">
									<FontAwesomeIcon icon={faXmark} className="text-[11px]" />
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* ── Available vehicles ────────────────────────────── */}
			<div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
				{available.length === 0 ? (
					<div className="flex items-center justify-center py-5">
						<span className="font-mono text-[9px] tracking-widest text-lines/25 uppercase">
							No vehicles available
						</span>
					</div>
				) : (
					available.map((v) => {
						const cond = CONDITION_STYLE[v.condition] ?? CONDITION_STYLE.Operational;
						const disabled = v.isRepairing;
						return (
							<button
								key={v._id}
								type="button"
								disabled={disabled}
								onClick={() => onAdd(v._id)}
								className={[
									"flex items-center gap-2.5 px-3 py-2 border rounded-sm transition-colors text-left group",
									disabled
										? "border-lines/10 opacity-40 cursor-not-allowed"
										: "border-lines/20 hover:border-lines/50 hover:bg-lines/5",
								].join(" ")}>
								<div className="flex-1 min-w-0">
									<span className="font-mono text-[11px] text-fontz/80 group-hover:text-fontz font-medium truncate block">
										{vehicleLabel(v)}
									</span>
									<FuelBar pct={v.remainingFuel ?? 0} />
								</div>
								<span className={`font-mono text-[7px] tracking-widest uppercase px-1.5 py-0.5 border rounded-sm shrink-0 ${cond.text} ${cond.border}`}>
									{v.condition}
								</span>
								{disabled ? (
									<FontAwesomeIcon icon={faWrench} className="text-lines/30 text-[9px] shrink-0" />
								) : (
									<FontAwesomeIcon icon={faPlus} className="text-lines/20 group-hover:text-btn text-[9px] shrink-0 transition-colors" />
								)}
							</button>
						);
					})
				)}
			</div>
		</div>
	);
};

AssetPicker.propTypes = {
	allVehicles:     PropTypes.array.isRequired,
	fullVehicleList: PropTypes.array.isRequired,
	selected:        PropTypes.array.isRequired,
	onAdd:           PropTypes.func.isRequired,
	onRemove:        PropTypes.func.isRequired,
};

export default AssetPicker;
