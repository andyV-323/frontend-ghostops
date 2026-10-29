// SlotControl.jsx — [ 1 ][ 2 ][ 3 ][ 4 ][ R ][ U ] segmented pill, the single
// reassignment interaction for the Teams rework. Used on every operator
// card in a team context and in the roster table's Slot column. Tap only —
// no drag, no modes, no held state. U (unassign) only renders when the
// caller passes onUnassign — every current call site does.
import PropTypes from "prop-types";

const SEGMENTS = [1, 2, 3, 4, "R"];

export default function SlotControl({ currentSlot, onSelect, onUnassign, disabled }) {
	const segments = onUnassign ? [...SEGMENTS, "U"] : SEGMENTS;
	return (
		<div className='inline-flex items-stretch border border-lines/40 divide-x divide-lines/40 rounded-sm overflow-hidden'>
			{segments.map((seg) => {
				const isReserve = seg === "R";
				const isUnassign = seg === "U";
				const value = isReserve ? null : seg;
				const active = !isUnassign && (isReserve ? currentSlot === null : currentSlot === seg);
				return (
					<button
						key={seg}
						type='button'
						disabled={disabled}
						onClick={(e) => {
							e.stopPropagation();
							if (disabled) return;
							if (isUnassign) onUnassign();
							else onSelect(value);
						}}
						title={
							isUnassign ? "Remove from team"
							: isReserve ? "Send to reserve"
							: `Assign to slot ${seg}`
						}
						className={[
							"min-w-[44px] min-h-[44px] flex items-center justify-center font-mono text-[11px] tracking-widest uppercase transition-colors",
							isUnassign ?
								"text-red-400/60 hover:text-red-400 hover:bg-red-950/30"
							: active ?
								"bg-btn/15 text-btn"
							:	"text-lines/60 hover:text-fontz hover:bg-highlight/40",
							disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
						].join(" ")}>
						{seg}
					</button>
				);
			})}
		</div>
	);
}

SlotControl.propTypes = {
	// 1-4 = active slot, null = reserve (on this team), undefined = not on this team
	currentSlot: PropTypes.oneOf([1, 2, 3, 4, null]),
	onSelect: PropTypes.func.isRequired,
	onUnassign: PropTypes.func,
	disabled: PropTypes.bool,
};
