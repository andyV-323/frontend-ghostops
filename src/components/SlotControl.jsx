// SlotControl.jsx — [ 1 ][ 2 ][ 3 ][ 4 ][ R ] segmented pill, the single
// reassignment interaction for the Teams rework. Used on every operator
// card in a team context and in the roster table's Slot column. Tap only —
// no drag, no modes, no held state.
import PropTypes from "prop-types";

const SEGMENTS = [1, 2, 3, 4, "R"];

export default function SlotControl({ currentSlot, onSelect, disabled }) {
	return (
		<div className='inline-flex items-stretch border border-lines/40 divide-x divide-lines/40 rounded-sm overflow-hidden'>
			{SEGMENTS.map((seg) => {
				const isReserve = seg === "R";
				const value = isReserve ? null : seg;
				const active = isReserve ? currentSlot === null : currentSlot === seg;
				return (
					<button
						key={seg}
						type='button'
						disabled={disabled}
						onClick={(e) => {
							e.stopPropagation();
							if (!disabled) onSelect(value);
						}}
						title={isReserve ? "Send to reserve" : `Assign to slot ${seg}`}
						className={[
							"min-w-[44px] min-h-[44px] flex items-center justify-center font-mono text-[11px] tracking-widest uppercase transition-colors",
							active ?
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
	disabled: PropTypes.bool,
};
