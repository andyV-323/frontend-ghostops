// ─── Shared dashboard helpers ─────────────────────────────────────────────────
// Panel, usePageSheet, and biome weather icon utilities used across dashboard pages.

import { useState } from "react";

import {
	faCloudSun,
	faCloudRain,
	faSnowflake,
	faFire,
	faWind,
	faCity,
} from "@fortawesome/free-solid-svg-icons";
import { SheetSide } from "@/components";
import { useSheetStore } from "@/zustand";
import PropTypes from "prop-types";

// ─── Panel ────────────────────────────────────────────────────────────────────

export function Panel({
	title,
	badge,
	badgeGreen = false,
	actions,
	children,
	className = "",
	bodyClass = "",
}) {
	return (
		<div
			className={[
				"flex flex-col rounded border border-neutral-700/50 bg-neutral-800/80 shadow-[0_2px_16px_rgba(0,0,0,0.5)] overflow-hidden",
				className,
			].join(" ")}>
			{(title || badge || actions) && (
				<div className='flex items-center gap-3 px-4 py-2.5 bg-neutral-800 border-b border-neutral-700/50 shrink-0'>
					<span className='font-mono text-[12px] tracking-[0.2em] text-neutral-400 uppercase flex-1 truncate'>
						{title}
					</span>
					{actions}
					{badge && (
						<span
							className={[
								"font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border rounded-sm",
								badgeGreen ?
									"text-green-400/80 border-green-800/50 bg-green-950/30"
								:	"text-btn/70 border-btn/20 bg-btn/5",
							].join(" ")}>
							{badge}
						</span>
					)}
				</div>
			)}
			<div
				className={[
					"flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
					bodyClass,
				].join(" ")}>
				{children}
			</div>
		</div>
	);
}

Panel.propTypes = {
	title: PropTypes.string,
	badge: PropTypes.string,
	badgeGreen: PropTypes.bool,
	actions: PropTypes.node,
	children: PropTypes.node,
	className: PropTypes.string,
	bodyClass: PropTypes.string,
};

// ─── Sheet hook ───────────────────────────────────────────────────────────────

export function usePageSheet() {
	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();
	const [content, setContent] = useState(null);
	const [title, setTitle] = useState(null);
	const [description, setDescription] = useState(null);

	const open = (side, c, t, d) => {
		setOpenSheet(side);
		setContent(c);
		setTitle(t);
		setDescription(d);
	};

	const SheetEl =
		openSheet ?
			<SheetSide
				openSheet={openSheet}
				setOpenSheet={setOpenSheet}
				side={openSheet}
				content={content}
				title={title}
				description={description}
				onClose={closeSheet}
			/>
		:	null;

	return { open, close: closeSheet, SheetEl };
}

// ─── Biome → weather icon ─────────────────────────────────────────────────────

export const BIOME_ICON_MAP = {
	"Rain Forest": { icon: faCloudRain, color: "text-green-400" },
	"Volcanic Rain Forest": { icon: faFire, color: "text-orange-400" },
	"Volcanic Dessert": { icon: faFire, color: "text-red-400" },
	"High Cliffs": { icon: faWind, color: "text-slate-300" },
	"Salt Marsh": { icon: faCloudRain, color: "text-teal-400" },
	"High Thundra": { icon: faSnowflake, color: "text-blue-300" },
	Fjordlands: { icon: faSnowflake, color: "text-cyan-400" },
	"Rain Shadows": { icon: faCloudSun, color: "text-yellow-400" },
	"Mead Lands": { icon: faCloudSun, color: "text-lime-400" },
	"Meadow Lands and Urban City": { icon: faCity, color: "text-zinc-300" },
	"Meadow Lands": { icon: faWind, color: "text-lime-300" },
	"High Thundra and Rain Shadows": {
		icon: faSnowflake,
		color: "text-indigo-300",
	},
	"Rain SHadows": { icon: faCloudSun, color: "text-yellow-400" },
};

export function getWeatherIcon(biome) {
	return BIOME_ICON_MAP[biome] ?? { icon: faCloudSun, color: "text-lines/40" };
}
