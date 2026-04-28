import { useState } from "react";
import { Garage } from "@/components/tables";
import { Panel, usePageSheet } from "./dashboardHelpers";

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLES PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function VehiclesPage() {
	const { open, SheetEl } = usePageSheet();
	const [dataUpdated, setDataUpdated] = useState(false);
	const refreshData = () => setDataUpdated((p) => !p);

	return (
		<div className='flex-1 overflow-y-auto'>
			<div className='p-3 sm:p-4'>
				<Panel className='min-h-[500px]'>
					<Garage
						dataUpdated={dataUpdated}
						refreshData={refreshData}
						openSheet={open}
					/>
				</Panel>
			</div>
			{SheetEl}
		</div>
	);
}
