// components/mission/ActiveMissionChip.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";

const STATUS_DOT = {
	planning: "bg-lines/30",
	active: "bg-green-500 shadow-[0_0_5px_rgba(74,222,128,0.6)]",
	complete: "bg-btn",
};

export default function ActiveMissionChip({ mission, onClick }) {
	if (!mission) return null;

	const dot = STATUS_DOT[mission.status] || STATUS_DOT.planning;

	return (
		<button
			onClick={onClick}
			className='flex items-center gap-2 border border-lines/20 hover:border-lines/40 bg-blk/40 hover:bg-blk/70 px-2.5 py-1 rounded-sm transition-all group'>
			<span className={["w-1.5 h-1.5 rounded-full shrink-0", dot].join(" ")} />
			<span className='font-mono text-[9px] tracking-widest text-fontz/55 group-hover:text-fontz truncate max-w-[140px] uppercase'>
				{mission.name}
			</span>
			<FontAwesomeIcon
				icon={faFolderOpen}
				className='text-[8px] text-lines/25 group-hover:text-btn shrink-0 transition-colors'
			/>
		</button>
	);
}
