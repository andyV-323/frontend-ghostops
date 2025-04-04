import { Button } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Features, About, Contact } from "@/components";
import { useAuthService } from "@/services/AuthService";
const Home = () => {
	const { signUp } = useAuthService();
	const [showTopButton, setShowTopButton] = useState(false);

	// Show or hide "Back to Top" button based on scroll position
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 300) {
				setShowTopButton(true);
			} else {
				setShowTopButton(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Scroll smoothly to the top when the button is clicked
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};
	const content = (
		<div className='flex flex-col items-center bg-black'>
			{/* Background Section */}

			<div className="flex flex-col lg:flex-row h-screen w-full bg-[url('/img/Ghosts.png')] bg-cover bg-center bg-neutral-800">
				{/* Left Section - Text Content */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10'>
					<div className='flex flex-col items-center text-center lg:text-left max-w-lg'>
						<h1 className='text-3xl md:text-5xl font-bold text-white'>
							Manage your Ghost AI Team using a dynamic Dashboard
						</h1>
						<p className='p-6 text-sm md:text-lg text-fontz'>
							Like to role play or Milsim? Use AI teammates? Now you can manage
							a full team of ghosts or whatever Spec ops unit you like.
						</p>
						<Button
							className='btn'
							onClick={signUp}>
							Try it Free
						</Button>
					</div>
				</div>

				{/* Right Section - Image */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6'>
					<img
						src='/img/dash.png'
						alt='Auroa Map'
						className=' shadow-black shadow-2xl '
					/>
				</div>
			</div>

			<Features />
			<About />
			<Contact />

			{showTopButton && (
				<button
					onClick={scrollToTop}
					className='btn fixed bottom-8 right-8 font-semibold py-3 px-8 rounded-lg shadow-lg transition duration-300 ease-in-out mt-6'>
					Back to Top ↑
				</button>
			)}
			<div className="flex h-screen w-full bg-[url('/img/Ghost2.png')] bg-cover bg-center bg-neutral-800">
				<div className='flex flex-col items-center justify-center text-center p-6 md:p-10 text-white w-full'>
					<h2 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-4'>
						Ready to Lead Your Team?
					</h2>
					<p className='text-sm md:text-base lg:text-lg text-fontz mb-6 max-w-lg'>
						Manage your operators, use AI-generated operations, and explore
						Auroa with an interactive dashboard.
					</p>

					<Button
						className='btn'
						onClick={signUp}>
						Get Started Now
					</Button>
				</div>
			</div>
		</div>
	);
	return content;
};
export default Home;
