import PropTypes from "prop-types";
import { getReadinessLevel, READINESS_META } from "@/utils/readiness";

export default function FatigueBadge({ fatiguePoints = 0, size = "dot" }) {
	const level = getReadinessLevel(fatiguePoints);
	const meta = READINESS_META[level];

	if (size === "dot") {
		return (
			<span
				title={`${meta.label} — ${meta.desc}`}
				className={[
					"inline-block w-2 h-2 rounded-full shrink-0",
					level === "CombatIneffective" ? "animate-pulse" : "",
				].join(" ")}
				style={{
					background: meta.hex,
					boxShadow: `0 0 5px ${meta.hex}88`,
				}}
			/>
		);
	}

	return (
		<span
			className='font-mono text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 shrink-0'
			style={{
				color: meta.hex,
				background: meta.bg,
				border: `1px solid ${meta.border}`,
			}}>
			{level === "CombatIneffective" ? "CI" : meta.label}
		</span>
	);
}

FatigueBadge.propTypes = {
	fatiguePoints: PropTypes.number,
	size: PropTypes.oneOf(["dot", "badge"]),
};
