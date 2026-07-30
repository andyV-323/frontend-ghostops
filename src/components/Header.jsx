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
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			{/* === TOP NAVBAR (VISIBLE ONLY WHEN NOT LOGGED IN) === */}
			{!isAuthenticated && (
				<header className='fixed top-0 left-0 w-full bg-black backdrop-blur-lg p-4 flex justify-between items-center z-[1002]'>
					<img
						src='/icons/GhostOpsAI.svg'
						alt='GhostOpsAI Logo'
						className='h-10 w-auto'
						width='160'
						height='40'
					/>

					{/* Desktop links */}
					<div className='hidden sm:flex items-center space-x-4'>
						<Link
							to='/ops/builder'
							className='flex items-center gap-2 hover:opacity-80 transition-opacity'>
							<img
								src='/icons/OpsBuilder.svg'
								alt='GhostOpsAI'
								className='h-8 w-auto'
							/>
						</Link>
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

					{/* Mobile menu toggle */}
					<button
						onClick={() => setMobileMenuOpen((prev) => !prev)}
						className='sm:hidden text-white p-2'
						aria-label='Menu'>
						<FontAwesomeIcon
							icon={mobileMenuOpen ? faTimes : faBars}
							className='text-xl'
						/>
					</button>
				</header>
			)}

			{/* === MOBILE MENU (VISIBLE ONLY WHEN NOT LOGGED IN + TOGGLED OPEN) === */}
			{!isAuthenticated && mobileMenuOpen && (
				<>
					<div
						onClick={() => setMobileMenuOpen(false)}
						className='fixed inset-0 bg-black/40 z-[1001] sm:hidden'
					/>
					<div className='fixed top-[4.5rem] left-0 w-full bg-black border-t border-lines/20 z-[1002] sm:hidden flex flex-col p-3 gap-1 shadow-lg'>
						<Link
							to='/ops/builder'
							onClick={() => setMobileMenuOpen(false)}
							className='flex items-center gap-2 text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors'>
							<img
								src='/icons/OpsBuilder.svg'
								alt=''
								className='h-6 w-auto'
							/>
						</Link>
						<button
							onClick={() => {
								setMobileMenuOpen(false);
								signIn();
							}}
							className='text-left text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors'>
							Sign in
						</button>
						<button
							onClick={() => {
								setMobileMenuOpen(false);
								signUp();
							}}
							className='text-left text-btn font-medium py-3 px-3 rounded-lg hover:bg-white/5 transition-colors'>
							Sign up
						</button>
					</div>
				</>
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
							<p className='mt-2 text-sm'>
								{user?.profile?.["cognito:username"] ||
									user?.profile?.preferred_username ||
									user?.profile?.email ||
									"User"}
							</p>
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
										to='/ops/builder'
										className='hover:underline hover:text-white'>
										Ops Builder
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

						<div className='flex flex-col gap-2'>
							<Button
								onClick={signOut}
								className='btn px-6 py-2 rounded-lg w-full'>
								Sign out
							</Button>
						</div>
					</div>
				</>
			)}
		</>
	);
};

export default Header;
