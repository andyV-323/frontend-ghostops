import { useState } from "react";
import { useAuthService } from "@/services/AuthService";
import { Button } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Header = () => {
	// AWS Cognito
	const { isAuthenticated, user, signIn, signUp, signOut } = useAuthService();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<>
			{/* === TOP NAVBAR (VISIBLE ONLY WHEN NOT LOGGED IN) === */}
			{!isAuthenticated && (
				<header className='fixed top-0 left-0 w-full bg-black backdrop-blur-lg p-4 flex justify-between items-center z-[1002]'>
					<img
						src='/icons/GhostOpsAI.svg'
						alt='GhostOpsAI Logo'
						className='h-10'
					/>

					<div className='flex space-x-4'>
						<button
							onClick={signIn}
							className='text-white hover:text-btn'>
							Sign in
						</button>
						<Button
							onClick={signUp}
							className='btn px-6 py-2 rounded-lg transition-all duration-300'>
							Sign up
						</Button>
					</div>
				</header>
			)}

			{/* === SIDEBAR (VISIBLE AFTER LOGIN) === */}
			{isAuthenticated && (
				<>
					{/* Sidebar Toggle Button */}
					<button
						onClick={() => setSidebarOpen((prev) => !prev)}
						className='fixed top-1 left-1 z-[1001] hover:text-black text-white bg-blk p-2 rounded-lg shadow-lg focus:outline-none hover:bg-lines'>
						<FontAwesomeIcon
							icon={sidebarOpen ? faTimes : faBars}
							className='text-lg'
						/>
					</button>

					{/* Click-outside overlay (only when open) */}
					{sidebarOpen && (
						<div
							onClick={() => setSidebarOpen(false)}
							className='fixed inset-0 bg-black/40 z-[999]'
						/>
					)}

					{/* Sidebar Panel */}
					<div
						className={`fixed top-0 left-0 h-full w-64 bg-black z-[1000] text-white transform ${
							sidebarOpen ? "translate-x-0" : "-translate-x-64"
						} transition-transform duration-300 ease-in-out shadow-lg p-6 flex flex-col justify-between`}>
						{/* User Info */}
						<div className='flex flex-col items-center'>
							<img
								src={user?.profile?.picture || "/icons/GhostOpsAI.svg"}
								className='mt-10'
								alt='User Avatar'
							/>
							<p className='mt-2 text-sm'>{user?.profile?.email || "User"}</p>
						</div>

						{/* Quick Links */}
						<div className='flex flex-col items-center text-fontz'>
							<ul className='space-y-3'>
								<li>
									<Link
										to='/dashboard'
										className='hover:underline hover:text-white'>
										Home
									</Link>
								</li>
								<li>
									<Link
										to='/dashboard/briefing'
										className='hover:underline hover:text-white'>
										Mission Generator
									</Link>
								</li>
								<li>
									<Link
										to='/dashboard/newOperator'
										className='hover:underline hover:text-white'>
										New Operator
									</Link>
								</li>
								<li>
									<Link
										to='/dashboard/newTeam'
										className='hover:underline hover:text-white'>
										New Team
									</Link>
								</li>
								<li>
									<Link
										to='/dashboard/vehicleSimulator'
										className='hover:underline hover:text-white'>
										Assets
									</Link>
								</li>
								<li>
									<Link
										to='/dashboard/newVehicle'
										className='hover:underline hover:text-white'>
										New Asset
									</Link>
								</li>
							</ul>
						</div>

						{/* Logout Button */}
						<Button
							onClick={signOut}
							className='btn px-6 py-2 rounded-lg mt-6 w-full'>
							Sign out
						</Button>
					</div>
				</>
			)}
		</>
	);
};

export default Header;
