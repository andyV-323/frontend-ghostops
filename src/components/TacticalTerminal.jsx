import { useEffect, useState } from "react";

const BOOT_LINES = [
	{ text: "> GHOSTOPS AI v2.0 — INITIALIZING...", delay: 0 },
	{ text: "> ENCRYPTION LAYER: ACTIVE", delay: 400 },
	{ text: "> SATELLITE UPLINK: ESTABLISHED", delay: 800 },
	{ text: "> LOADING OPERATOR ROSTER...", delay: 1300 },
	{ text: "> OPERATORS: READY", delay: 1800, color: "text-green-400" },
	{ text: "> LOADING MISSION DATABASE...", delay: 2300 },
	{ text: "> MISSIONS: STANDBY", delay: 2800, color: "text-green-400" },
	{ text: "> AI MISSION GENERATOR: ONLINE", delay: 3300, color: "text-green-400" },
	{ text: "> INFIRMARY: MONITORING", delay: 3700 },
	{ text: "> VEHICLE ASSETS: STAGED", delay: 4100 },
	{ text: "> CAMPAIGN ENGINE: ARMED", delay: 4500 },
	{ text: "", delay: 5000 },
	{ text: "> ALL SYSTEMS NOMINAL.", delay: 5200, color: "text-btn font-bold" },
	{ text: "> AWAITING COMMANDER INPUT...", delay: 5800, color: "text-btn font-bold", blink: true },
];

const TacticalTerminal = () => {
	const [visibleLines, setVisibleLines] = useState([]);
	const [showCursor, setShowCursor] = useState(true);

	useEffect(() => {
		const timers = BOOT_LINES.map((line, i) =>
			setTimeout(() => {
				setVisibleLines((prev) => [...prev, i]);
			}, line.delay)
		);
		return () => timers.forEach(clearTimeout);
	}, []);

	// blinking cursor
	useEffect(() => {
		const interval = setInterval(() => setShowCursor((c) => !c), 530);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='w-full max-w-sm bg-black/80 border border-btn/30 rounded-sm shadow-2xl shadow-black font-mono text-[10px] leading-relaxed p-3 flex flex-col justify-start overflow-hidden'>
			{/* header bar */}
			<div className='flex items-center gap-2 mb-4 pb-3 border-b border-btn/20'>
				<span className='w-2.5 h-2.5 rounded-full bg-red-500/70' />
				<span className='w-2.5 h-2.5 rounded-full bg-yellow-500/70' />
				<span className='w-2.5 h-2.5 rounded-full bg-green-500/70' />
				<span className='ml-2 tracking-[0.2em] uppercase text-[9px] text-fontz/50'>
					GHOSTOPS — TACTICAL INTERFACE
				</span>
			</div>

			{/* lines */}
			<div className='flex flex-col gap-1'>
				{BOOT_LINES.map((line, i) => {
					if (!visibleLines.includes(i)) return null;
					const isLast = i === BOOT_LINES.length - 1;
					return (
						<div
							key={i}
							className={`${line.color ?? "text-fontz/70"} ${line.blink ? "" : ""}`}>
							{line.text}
							{isLast && (
								<span
									className={`inline-block w-2 h-3 bg-btn align-middle ml-0.5 transition-opacity duration-100 ${
										showCursor ? "opacity-100" : "opacity-0"
									}`}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TacticalTerminal;
