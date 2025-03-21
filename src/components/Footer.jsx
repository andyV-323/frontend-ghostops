import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
	const location = useLocation();
	// Navigation logic based on the current route
	const navigation = {
		"/dashboard/briefing": {
			prev: null,
			next: { path: "/dashboard", label: "Dashboard", icon: faArrowRight },
		},
		/*"/dashboard/stats": {
			prev: {
				path: "/dashboard",
				label: "Dashboard",
				icon: faArrowLeft,
			},
			next: null,
		},*/
		"/dashboard": {
			prev: {
				path: "/dashboard/briefing",
				label: "Briefing",
				icon: faArrowLeft,
			},
			/*next: { path: "/dashboard/stats", label: "Stats", icon: faArrowRight },*/
			next: null,
		},
	};

	const currentNav = navigation[location.pathname];

	return (
		<footer className='bg-transparent py-4'>
			<div className='flex flex-row items-center justify-between text-white px-6'>
				{/* Left - Logo */}
				<img
					src='/icons/GhostOpsAI.svg'
					alt='GhostOpsAI Logo'
					className='h-5 md:h-5 lg:h-10 w-auto'
				/>

				{/* Right - Navigation Buttons */}
				<div className='flex flex-row space-x-12 font-bold'>
					{currentNav?.prev && (
						<Link
							to={currentNav.prev.path}
							className='btn flex items-center rounded-lg'>
							<FontAwesomeIcon
								icon={currentNav.prev.icon}
								className='mr-2'
							/>
							{currentNav.prev.label}
						</Link>
					)}

					{currentNav?.next && (
						<Link
							to={currentNav.next.path}
							className='btn flex items-center rounded-lg'>
							{currentNav.next.label}
							<FontAwesomeIcon
								icon={currentNav.next.icon}
								className='ml-2'
							/>
						</Link>
					)}
				</div>
			</div>
		</footer>
	);
};

export default Footer;
