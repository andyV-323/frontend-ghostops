// OperatorDashboard.jsx
import { useEffect, useState } from "react";
import { SheetSide } from "@/components";
import { Roster, Infirmary, Memorial, Teams } from "@/components/tables";
import { useOperatorsStore, useSheetStore } from "@/zustand";

// ─── Panel ────────────────────────────────────────────────────
function Panel({
	title,
	badge,
	badgeGreen = false,
	children,
	className = "",
	bodyClass = "",
}) {
	return (
		<div
			className={[
				"flex flex-col rounded-lg border border-lines/30 bg-blk/60",
				"shadow-[0_4px_32px_rgba(0,0,0,0.75)] overflow-hidden",
				className,
			].join(" ")}>
			<div className='flex items-center gap-2 px-4 py-2.5 bg-blk/80 border-b border-lines/20 shrink-0'>
				<span
					className={[
						"w-1.5 h-1.5 rounded-full shrink-0",
						badgeGreen ?
							"bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.55)]"
						:	"bg-btn shadow-[0_0_6px_rgba(124,170,121,0.45)]",
					].join(" ")}
				/>
				<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase flex-1 truncate'>
					{title}
				</span>
				{badge && (
					<span
						className={[
							"font-mono text-[9px] tracking-widest px-1.5 py-0.5 border rounded-sm",
							badgeGreen ?
								"text-green-400 border-green-900"
							:	"text-btn border-highlight/50",
						].join(" ")}>
						{badge}
					</span>
				)}
			</div>
			<div
				className={[
					"flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
					bodyClass,
				].join(" ")}>
				{children}
			</div>
		</div>
	);
}

// ─── Inline divider between stacked sub-sections ─────────────
function SubDivider({ label }) {
	return (
		<div className='flex items-center gap-3 px-4 py-2 bg-blk/50 border-y border-lines/15 shrink-0'>
			<span className='w-1 h-1 rounded-full bg-red-500/40' />
			<span className='font-mono text-[9px] tracking-[0.2em] text-lines/30 uppercase'>
				{label}
			</span>
			<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
			<span className='font-mono text-[9px] tracking-widest text-red-500/40 border border-red-900/30 px-1.5 py-0.5 rounded-sm'>
				KIA
			</span>
		</div>
	);
}

// ─── Dashboard ────────────────────────────────────────────────
const OperatorDashboard = () => {
	const { setSelectedOperator, operators, fetchOperators } =
		useOperatorsStore();
	const { openSheet, setOpenSheet, closeSheet } = useSheetStore();

	const [clickedOperator, setClickedOperator] = useState(null);
	const [dataUpdated, setDataUpdated] = useState(false);
	const [sheetContent, setSheetContent] = useState(null);
	const [sheetTitle, setSheetTitle] = useState(null);
	const [sheetDescription, setSheetDescription] = useState(null);

	const refreshData = () => setDataUpdated((p) => !p);

	useEffect(() => {
		fetchOperators();
	}, [fetchOperators]);

	const handleOpenSheet = (side, content, title, description) => {
		setOpenSheet(side);
		setSheetContent(content);
		setSheetTitle(title);
		setSheetDescription(description);
	};

	return (
		/*
      The parent (DashboardLayout > main > Outlet) provides flex-1 + overflow-hidden.
      This component therefore gets a real, bounded height to work with.
      We use h-full + flex-col so every child can participate in height distribution.
    */
		<div className='h-full w-full flex flex-col p-4 gap-3 bg-transparent overflow-hidden'>
			{/* ── Stat strip ── */}
			<div className='shrink-0 flex items-center gap-3'>
				<div className='flex items-center gap-2 bg-blk/50 border border-lines/20 rounded px-3 py-1.5'>
					<span className='w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(74,222,128,0.55)]' />
					<span className='font-mono text-[10px] tracking-widest text-lines/50 uppercase'>
						Personnel
					</span>
					<span className='font-mono text-[11px] text-btn ml-1 tabular-nums'>
						{operators.length}
					</span>
				</div>
				<div className='flex-1 h-px bg-gradient-to-r from-lines/10 to-transparent' />
				<span className='hidden sm:block font-mono text-[9px] tracking-[0.2em] text-lines/25 uppercase'>
					Operator Management
				</span>
			</div>

			{/* ── Grid ── */}
			{/*
        Desktop:  2 columns, fixed height via h-full on this container.
                  Left col: Roster takes 100% of column height.
                  Right col: Teams flex-1, WIA/KIA card shrink-0 with max-h.

        Mobile:   Single column. Each panel gets a min-h so the roster is
                  always visible without a fixed viewport height anchor.
                  User scrolls the page naturally.
      */}
			<div
				className={[
					// Mobile: normal flow, scroll the page
					"flex flex-col gap-3",
					// Desktop: 2-col grid that fills remaining height
					"lg:grid lg:grid-cols-2 lg:gap-4 lg:flex-none lg:flex lg:flex-row lg:min-h-0 lg:flex-1",
				].join(" ")}>
				{/* LEFT — Roster */}
				{/*
          Mobile:  min-h-[400px] guarantees the table is visible.
          Desktop: h-full makes it fill the column.
        */}
				<Panel
					title='Operator Roster'
					badge='ACTIVE DUTY'
					badgeGreen
					className='min-h-[400px] lg:flex-1 lg:min-h-0 lg:h-full'>
					<Roster
						operators={operators}
						setClickedOperator={(op) => {
							setClickedOperator(op);
							setSelectedOperator(op._id);
						}}
						dataUpdated={dataUpdated}
						refreshData={refreshData}
						openSheet={handleOpenSheet}
					/>
				</Panel>

				{/* RIGHT — Teams + WIA/KIA */}
				<div className='flex flex-col gap-3 lg:flex-1 lg:min-h-0 lg:h-full'>
					{/* Teams — grows to fill available right-column space */}
					<Panel
						title='Team Assignments'
						badge='ODA'
						className='min-h-[280px] lg:flex-1 lg:min-h-0'>
						<Teams
							dataUpdated={dataUpdated}
							refreshData={refreshData}
							openSheet={handleOpenSheet}
						/>
					</Panel>

					{/* WIA + KIA combined card — fixed height, never grows */}
					<div className='shrink-0 flex flex-col rounded-lg border border-lines/30 bg-blk/60 shadow-[0_4px_32px_rgba(0,0,0,0.75)] overflow-hidden'>
						{/* Infirmary header */}
						<div className='flex items-center gap-2 px-4 py-2.5 bg-blk/80 border-b border-lines/20 shrink-0'>
							<span className='w-1.5 h-1.5 rounded-full shrink-0 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]' />
							<span className='font-mono text-[10px] tracking-[0.18em] text-lines uppercase flex-1'>
								Infirmary
							</span>
							<span className='font-mono text-[9px] tracking-widest text-amber-400 border border-amber-900/50 px-1.5 py-0.5 rounded-sm'>
								WIA
							</span>
						</div>

						{/* Infirmary rows — scroll independently */}
						<div className='overflow-y-auto max-h-40'>
							<Infirmary
								dataUpdated={dataUpdated}
								refreshData={refreshData}
							/>
						</div>

						{/* Divider */}
						<SubDivider label='Fallen Ghost' />

						{/* Memorial rows — scroll independently */}
						<div className='overflow-y-auto max-h-40'>
							<Memorial
								dataUpdated={dataUpdated}
								refreshData={refreshData}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* ── Sheet ── */}
			{openSheet && (
				<SheetSide
					openSheet={openSheet}
					setOpenSheet={setOpenSheet}
					side={openSheet}
					content={sheetContent}
					title={sheetTitle}
					description={sheetDescription}
					onClose={closeSheet}
				/>
			)}
		</div>
	);
};

export default OperatorDashboard;
