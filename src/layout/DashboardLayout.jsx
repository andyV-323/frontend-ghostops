import { Outlet } from "react-router-dom";
import { Header, Footer } from "@/components";

const DashboardLayout = () => {
	return (
		<div className='min-h-screen flex flex-col bg-linear-45 from-blk via-background to-neutral-800 text-fontz'>
			<Header />

			<main className='flex-1 min-h-0 flex'>
				<Outlet />
			</main>

			<Footer />
		</div>
	);
};

export default DashboardLayout;
