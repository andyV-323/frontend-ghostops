/** @format */
import { Footer } from "../../components";

const Briefing = () => {
	return (
		<div
			className='bg-linear-45 from-blk via-bckground to-neutral-800 min-h-screen flex flex-col p-4 space-y-4'
			style={{ boxShadow: "-4px 0px 10px rgba(0, 0, 0, 0.99)" }}>
			{/* === GRID LAYOUT === */}
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-2 flex-grow'>
				{/* === TEAMS & ROSTER === */}
				<div className='space-y-4'>
					<div
						className='bg-bckground/50 shadow-lg shadow-black  rounded-3xl overflow-y-auto h-[250px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						FORM
					</div>
					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[650px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						Briefing
						{/*Clickable*/}
					</div>
				</div>

				{/* === ID CARD & BIO (SEPARATED) === */}
				<div className='space-y-4'>
					<div
						className='bg-bckground/50 shadow-lg shadow-black rounded-3xl overflow-y-auto h-[920px]'
						style={{ boxShadow: "-4px 4px 16px rgba(0, 0, 0, 0.99)" }}>
						Map
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
};

export default Briefing;
