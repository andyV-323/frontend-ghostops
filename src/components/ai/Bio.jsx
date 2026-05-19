import { useEffect, useState } from "react";
import { useOperatorsStore } from "@/zustand";
import useMemorialStore from "@/zustand/useMemorialStore";
import useTeamsStore from "@/zustand/useTeamStore";
import { OperatorsApi } from "@/api";
import api from "@/api/ApiClient";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const Bio = ({ operator, refreshData }) => {
	const { fetchOperatorById } = useOperatorsStore();
	const { KIAOperators, fetchKIAOperators } = useMemorialStore();
	const { teams } = useTeamsStore();

	const [bioText, setBioText] = useState(operator?.bio || "");
	const [userNote, setUserNote] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const isKIA = operator?.status === "KIA";

	useEffect(() => {
		if (isKIA) fetchKIAOperators();
	}, [isKIA, fetchKIAOperators]);

	// Sync bioText if operator prop updates (e.g. after save + refresh)
	useEffect(() => {
		setBioText(operator?.bio || "");
	}, [operator?.bio]);

	const memorialEntry = isKIA
		? KIAOperators.find((e) => {
				const opId =
					typeof e.operator === "object" ? e.operator._id : e.operator;
				return opId === operator?._id;
			})
		: null;

	const kiaInjury = memorialEntry?.name || null;

	const operatorTeam = teams.find((t) =>
		(t.operators || []).some((op) => {
			const opId = typeof op === "object" ? op._id : op;
			return opId === operator?._id;
		}),
	);
	const kiaAO = operatorTeam?.AO || null;

	const handleGenerate = async () => {
		setIsGenerating(true);
		try {
			const res = await api.post("/ai/bio", {
				callSign: operator.callSign,
				operatorClass: operator.class,
				role: operator.role || null,
				status: operator.status,
				userNote: userNote.trim() || null,
				kiaAO: isKIA ? kiaAO : null,
				kiaInjury: isKIA ? kiaInjury : null,
			});
			setBioText(res.data.bio);
		} catch (err) {
			toast.error("Failed to generate bio. Try again.");
			console.error(err);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSave = async () => {
		if (!bioText.trim()) return;
		setIsSaving(true);
		try {
			await OperatorsApi.updateOperatorBio(operator._id, bioText.trim());
			await fetchOperatorById(operator._id);
			toast.success("Bio saved.");
			if (refreshData) refreshData();
		} catch (err) {
			toast.error("Failed to save bio.");
			console.error(err);
		} finally {
			setIsSaving(false);
		}
	};

	if (!operator) return null;

	return (
		<div className='flex flex-col gap-5 p-4 font-mono text-lines h-full'>
			{/* Header */}
			<div className='border-b border-lines/10 pb-4'>
				<p className='text-[9px] tracking-[0.22em] uppercase text-lines/40 mb-1'>
					Operator Dossier
				</p>
				<h3 className='text-lg font-bold text-white tracking-wide truncate'>
					{operator.callSign}
				</h3>
				<p className='text-[9px] tracking-widest uppercase text-lines/40 mt-0.5'>
					{operator.class || "No Class"}
					{operator.role ? ` · ${operator.role}` : ""}
				</p>
				{isKIA && (
					<span className='inline-block mt-1.5 text-[8px] tracking-widest uppercase px-2 py-0.5 border border-red-900/40 text-red-400/70 bg-red-950/10'>
						KIA
					</span>
				)}
			</div>

			{/* Bio textarea */}
			<div className='flex flex-col gap-1.5 flex-1'>
				<label className='text-[9px] tracking-widest uppercase text-lines/40'>
					Bio
				</label>
				<textarea
					value={bioText}
					onChange={(e) => setBioText(e.target.value)}
					rows={7}
					placeholder='Write a bio or generate one with AI...'
					className='bg-blk/60 border border-lines/15 text-lines text-[11px] leading-relaxed p-3 resize-none focus:outline-none focus:border-lines/35 placeholder:text-lines/20 w-full'
				/>
			</div>

			{/* Additional context */}
			<div className='flex flex-col gap-1.5'>
				<label className='text-[9px] tracking-widest uppercase text-lines/40'>
					Additional context for AI
				</label>
				<textarea
					value={userNote}
					onChange={(e) => setUserNote(e.target.value)}
					rows={2}
					placeholder='e.g. veteran sniper, cold demeanor, served with 75th Rangers...'
					className='bg-blk/60 border border-lines/15 text-lines text-[11px] leading-relaxed p-3 resize-none focus:outline-none focus:border-lines/35 placeholder:text-lines/20 w-full'
				/>
			</div>

			{/* KIA data notice */}
			{isKIA && (kiaAO || kiaInjury) && (
				<div className='text-[9px] text-red-400/60 border border-red-900/20 bg-red-950/10 px-3 py-2 leading-relaxed'>
					<span className='text-red-400/40 uppercase tracking-widest block mb-0.5'>
						KIA Data
					</span>
					{kiaAO && <span className='block'>AO: {kiaAO}</span>}
					{kiaInjury && <span className='block'>Cause: {kiaInjury}</span>}
				</div>
			)}

			{isKIA && !kiaAO && !kiaInjury && (
				<p className='text-[9px] text-lines/25 italic'>
					No AO or injury data found — KIA section will be omitted from
					generation.
				</p>
			)}

			{/* Action buttons */}
			<div className='flex flex-col gap-2 mt-auto'>
				<button
					onClick={handleGenerate}
					disabled={isGenerating}
					className='font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 border transition-all text-green-400/80 border-green-900/40 hover:border-green-500/60 hover:text-green-400 bg-blk/60 hover:bg-green-950/20 disabled:opacity-40 disabled:cursor-not-allowed'>
					{isGenerating ? "Generating..." : "Generate with AI"}
				</button>
				<button
					onClick={handleSave}
					disabled={isSaving || !bioText.trim()}
					className='font-mono text-[9px] tracking-widest uppercase px-3 py-2.5 border transition-all text-lines/60 border-lines/20 hover:border-lines/40 hover:text-lines bg-blk/60 hover:bg-blk/80 disabled:opacity-40 disabled:cursor-not-allowed'>
					{isSaving ? "Saving..." : "Save Bio"}
				</button>
			</div>
		</div>
	);
};

Bio.propTypes = {
	operator: PropTypes.object,
	refreshData: PropTypes.func,
};

export default Bio;
