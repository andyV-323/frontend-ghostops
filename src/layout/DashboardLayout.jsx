import { Outlet } from "react-router-dom";
import { Header, Footer } from "@/components";

const DashboardLayout = () => {
	return (
		<div className=' bg-linear-45 from-blk via-background to-neutral-800 min-h-screen text-fontz'>
			<div className=''>
				<Header />
				<main className='flex-grow '>
					<Outlet />
					<Footer />
				</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
