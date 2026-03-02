// components/mission/IntelPanel.jsx
import { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faBolt,
	faStop,
	faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { streamGhostPackage } from "@/api/GhostOpsApi";
import MissionTypeSelector from "@/components/mission/MissionTypeSelector";
import ReconReportPicker from "@/components/mission/ReconReportPicker";

// ── Section label renderer ────────────────────────────────────────────────────
const SECTION_COLORS = {
	"ASSET STATUS": "text-red-400",
	"MISSION INTENT": "text-btn",
	INFILTRATION: "text-cyan-400",
	GEAR: "text-amber-400",
	LOADOUT: "text-orange-400",
	"RULES OF ENGAGEMENT": "text-lines/55",
	"COMMANDER'S INTENT": "text-emerald-400",
};

const getSectionColor = (label) => {
	for (const [key, color] of Object.entries(SECTION_COLORS)) {
		if (label.includes(key)) return color;
	}
	return "text-lines/45";
};

function PackageText({ text }) {
	if (!text) return null;
	const lines = text.split("\n");

	return (
		<div className='flex flex-col gap-0.5'>
			{lines.map((line, i) => {
				const sectionMatch = line.match(/^([A-Z][A-Z\s'\/]+):\s*(.*)/);

				if (sectionMatch) {
					const [, label, rest] = sectionMatch;
					const color = getSectionColor(label.trim());
					return (
						<div
							key={i}
							className={i === 0 ? "" : "mt-3"}>
							<div className='flex items-center gap-2 mb-1'>
								<span
									className={`font-mono text-[8px] tracking-[0.2em] font-bold ${color}`}>
									{label}
								</span>
								<div className='flex-1 h-px bg-lines/10' />
							</div>
							{rest && (
								<p className='font-mono text-[10px] text-fontz/68 leading-relaxed'>
									{rest}
								</p>
							)}
						</div>
					);
				}

				if (line.trim().startsWith("//")) {
					return (
						<p
							key={i}
							className='font-mono text-[9px] text-lines/28 italic mt-2 border-t border-lines/10 pt-2'>
							{line}
						</p>
					);
				}

				if (!line.trim())
					return (
						<div
							key={i}
							className='h-0.5'
						/>
					);

				return (
					<p
						key={i}
						className='font-mono text-[10px] text-fontz/65 leading-relaxed'>
						{line}
					</p>
				);
			})}
		</div>
	);
}

function BlinkCursor() {
	return (
		<span
			className='inline-block w-1.5 h-3 bg-btn ml-0.5 align-middle'
			style={{ animation: "cursor-blink 1s step-end infinite" }}
		/>
	);
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function IntelPanel({ mission }) {
	const [missionType, setMissionType] = useState(null);
	const [selectedReconId, setSelectedReconId] = useState(null);
	const [streaming, setStreaming] = useState(false);
	const [output, setOutput] = useState("");
	const [error, setError] = useState(null);
	const [done, setDone] = useState(false);
	const abortRef = useRef(false);

	const reports = mission?.reconReports || [];

	const selectedReport =
		selectedReconId != null ?
			(reports.find((r, i) => (r._id ?? i) === selectedReconId) ?? null)
		:	null;

	const hasGeneratorData = !!mission?.generator?.mapBounds;
	const canGenerate = !!missionType && hasGeneratorData;

	const handleReset = () => {
		setOutput("");
		setError(null);
		setDone(false);
		abortRef.current = false;
	};

	const handleGenerate = useCallback(async () => {
		if (!canGenerate || streaming) return;
		abortRef.current = false;
		setStreaming(true);
		setOutput("");
		setError(null);
		setDone(false);

		const g = mission.generator || {};

		try {
			const gen = streamGhostPackage({
				missionName: mission.name,
				province: mission.province || "Unknown Province",
				biome: mission.biome || "Unknown Biome",
				locations:
					(g.selectedLocations || []).length ?
						g.selectedLocations
					:	[
							{
								name: "Primary Objective",
								description: "No location intel on file.",
							},
						],
				missionType,
				recon: selectedReport?.modifiers ?? null,
			});

			for await (const chunk of gen) {
				if (abortRef.current) break;
				setOutput((prev) => prev + chunk);
			}
		} catch (err) {
			setError(err.message || "Failed to generate. Check VITE_GROQ_KEY.");
		} finally {
			setStreaming(false);
			setDone(true);
		}
	}, [canGenerate, streaming, mission, missionType, selectedReport]);

	// ── Guards ────────────────────────────────────────────────────────────────
	if (!mission) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-3 p-6 h-full'>
				<div className='grid grid-cols-3 gap-1 opacity-15'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-lines/50'
						/>
					))}
				</div>
				<p className='font-mono text-[9px] tracking-[0.25em] text-lines/20 uppercase'>
					No Active Operation
				</p>
			</div>
		);
	}

	if (!hasGeneratorData) {
		return (
			<div className='flex flex-col items-center justify-center flex-1 gap-3 p-6 h-full'>
				<div className='grid grid-cols-3 gap-1 opacity-15'>
					{[...Array(9)].map((_, i) => (
						<div
							key={i}
							className='w-2 h-2 border border-lines/50'
						/>
					))}
				</div>
				<p className='font-mono text-[9px] tracking-[0.25em] text-lines/20 uppercase'>
					Run Mission Generator First
				</p>
				<p className='font-mono text-[8px] text-lines/15 text-center leading-relaxed'>
					Generate a province and location to unlock
					<br />
					the Ghost Protocol Package
				</p>
			</div>
		);
	}

	const generateLabel =
		streaming ? null
		: done && output ? "Regenerate"
		: !missionType ? "Select Mission Type"
		: "Generate Package";

	return (
		<>
			<style>{`@keyframes cursor-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

			<div className='flex flex-col gap-4 p-4 h-full overflow-y-auto'>
				{/* Mission type */}
				<MissionTypeSelector
					value={missionType}
					onChange={(t) => {
						setMissionType(t);
						handleReset();
					}}
				/>

				{/* Recon picker */}
				<ReconReportPicker
					reports={reports}
					selectedId={selectedReconId}
					onSelect={(id) => {
						setSelectedReconId(id);
						handleReset();
					}}
				/>

				{/* Divider */}
				<div className='h-px bg-lines/10' />

				{/* Generate / Stop */}
				<div className='shrink-0'>
					{streaming ?
						<button
							onClick={() => {
								abortRef.current = true;
								setStreaming(false);
								setDone(true);
							}}
							className='w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 border border-red-900/40 text-red-400/60 hover:text-red-400 hover:border-red-400/40 rounded-sm transition-all'>
							<FontAwesomeIcon
								icon={faStop}
								className='text-[9px]'
							/>
							Abort Transmission
						</button>
					:	<button
							onClick={done && output ? handleReset : handleGenerate}
							disabled={!canGenerate}
							className={[
								"w-full flex items-center justify-center gap-2 font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 border rounded-sm transition-all",
								!canGenerate ?
									"text-lines/20 border-lines/10 cursor-not-allowed"
								: done && output ?
									"text-lines/45 border-lines/20 hover:text-fontz hover:border-lines/35"
								:	"text-btn border-btn/35 bg-btn/8 hover:bg-btn/18 hover:border-btn/60",
							].join(" ")}>
							<FontAwesomeIcon
								icon={done && output ? faRotateRight : faBolt}
								className='text-[9px]'
							/>
							{generateLabel}
						</button>
					}
				</div>

				{/* Output panel */}
				{(output || error || streaming) && (
					<div className='flex flex-col border border-lines/15 rounded-sm overflow-hidden'>
						{/* Header */}
						<div className='flex items-center gap-2 px-3 py-1.5 bg-blk/70 border-b border-lines/15 shrink-0'>
							<span
								className={[
									"w-1.5 h-1.5 rounded-full shrink-0",
									streaming ? "bg-btn animate-pulse"
									: error ? "bg-red-500"
									: "bg-emerald-500",
								].join(" ")}
							/>
							<span className='font-mono text-[8px] tracking-[0.2em] text-lines/35 uppercase flex-1 truncate'>
								Ghost Protocol Package
							</span>
							{selectedReport && (
								<span className='font-mono text-[7px] text-lines/30 border border-lines/15 px-1.5 py-0.5 rounded-sm'>
									RECON:{" "}
									{selectedReport.modifiers?.compromiseBadge?.toUpperCase()}
								</span>
							)}
							<span className='font-mono text-[7px] text-lines/25 uppercase shrink-0'>
								{missionType}
							</span>
						</div>

						{/* Body */}
						<div className='px-4 py-4 bg-blk/30 min-h-[100px]'>
							{error ?
								<p className='font-mono text-[10px] text-red-400 leading-relaxed'>
									{error}
								</p>
							:	<>
									<PackageText text={output} />
									{streaming && <BlinkCursor />}
								</>
							}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
