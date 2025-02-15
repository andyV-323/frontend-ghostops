/** @format */

import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import { Button } from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
	const auth = useAuth();
	const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		setIsAuthenticated(auth.isAuthenticated);
	}, [auth.isAuthenticated, auth.user]);

	const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
	const clientId = import.meta.env.VITE_CLIENT_ID;
	const redirectUri = import.meta.env.VITE_REDIRECT_URI;

	const signUpRedirect = () => {
		window.location.href = `${cognitoDomain}/signup?client_id=${clientId}&response_type=code&scope=email openid phone profile&redirect_uri=${encodeURIComponent(
			redirectUri
		)}`;
	};

	const signOutRedirect = async () => {
		await auth.removeUser();
		const logoutUri = import.meta.env.VITE_LOGOUT_URI;
		window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
			logoutUri
		)}`;
	};

	return (
		<>
			{/* === TOP NAVBAR (VISIBLE ONLY WHEN NOT LOGGED IN) === */}
			{!isAuthenticated && (
				<header className='fixed top-0 left-0 w-full  bg-black backdrop-blur-lg p-4 flex justify-between items-center'>
					<img
						src='/icons/GhostOpsAI.svg'
						alt='GhostOpsAI Logo'
						className='h-10'
					/>

					<div className='flex space-x-4'>
						<button
							onClick={() => auth.signinRedirect()}
							className='text-white hover:text-gray-300'>
							Sign in
						</button>
						<Button
							onClick={signUpRedirect}
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
						onClick={() => setSidebarOpen(!sidebarOpen)}
						className='fixed top-1 left-1 z-50 hover:text-white text-black bg-btn p-2 rounded-lg shadow-lg focus:outline-none hover:bg-highlight'>
						<FontAwesomeIcon
							icon={sidebarOpen ? faTimes : faBars}
							className='text-lg '
						/>
					</button>

					{/* Sidebar Panel */}
					<div
						className={`fixed top-0 left-0 h-full w-64 bg-black z-1 text-white transform ${
							sidebarOpen ? "translate-x-0" : "-translate-x-64"
						} transition-transform duration-300 ease-in-out shadow-lg p-6`}>
						{/* User Info */}
						<div className='flex flex-col items-center'>
							<img
								src={auth.user?.profile.picture || "/icons/default-avatar.png"}
								className='h-16 w-16 rounded-full border-2 border-gray-700'
								alt='User Avatar'
							/>
							<p className='mt-2 text-lg'>
								{auth.user?.profile.email || "User"}
							</p>
						</div>

						{/* Logout Button */}
						<Button
							onClick={signOutRedirect}
							className='bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg mt-6 w-full'>
							Sign out
						</Button>
					</div>
				</>
			)}
		</>
	);
};

export default Header;
