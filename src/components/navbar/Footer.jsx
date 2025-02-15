/** @format */

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const Footer = () => {
	return (
		<footer className='bg-transparent  py-4'>
			<div className='flex flex-row items-center justify-between text-white px-6'>
				{/* Left - Logo */}
				<img
					src='/icons/GhostOpsAI.svg'
					alt='GhostOpsAI Logo'
					className='h-5 md:h-5 lg:h-10 w-auto'
				/>

				{/* Right - Navigation Buttons */}
				<div className='flex flex-row space-x-12'>
					<Link
						to='/dashboard/briefing'
						className='btn flex items-center'>
						<FontAwesomeIcon
							icon={faArrowLeft}
							className='mr-2'
						/>
						Briefing
					</Link>
					<Link
						to='/dashboard/stats'
						className='btn flex items-center'>
						Stats
						<FontAwesomeIcon
							icon={faArrowRight}
							className='ml-2'
						/>
					</Link>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
