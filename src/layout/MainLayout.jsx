import { Outlet } from "react-router-dom";
import { Header, MainFooter } from "@/components";

const MainLayout = () => {
	return (
		<div className='flex flex-col min-h-screen'>
			<div className='fixed top-0 left-0 w-full z-[1000]'>
				<Header />
			</div>
			<div className='pt-[4rem]'>
				{" "}
				<Outlet />
			</div>
			<MainFooter />
		</div>
	);
};

export default MainLayout;
