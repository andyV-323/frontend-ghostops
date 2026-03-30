import { Button } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Features, About, Contact } from "@/components";
import { useAuthService } from "@/services/AuthService";

const Home = () => {
	const { signUp } = useAuthService();
	const [showTopButton, setShowTopButton] = useState(false);

	useEffect(() => {
		const handleScroll = () => setShowTopButton(window.scrollY > 300);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

	return (
		<div className='flex flex-col items-center bg-black'>
			{/* ── Hero ── */}
			<div className="flex flex-col lg:flex-row h-screen w-full bg-[url('/img/Ghosts.png')] bg-cover bg-center bg-neutral-800">
				{/* Left — headline + CTA */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10'>
					<div className='flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg gap-6'>
						<div className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn'>
							Ghost Recon Tactical Sim
						</div>
						<h1 className='text-4xl md:text-5xl font-bold text-white leading-tight'>
							Command Your Unit.
							<br />
							Powered by AI.
						</h1>
						<p className='text-sm md:text-base text-fontz leading-relaxed'>
							Build and manage an elite special operations team. Generate
							AI-driven missions, track operator injuries, run persistent
							campaigns — all from a single tactical dashboard.
						</p>
						<Button className='btn' onClick={signUp}>
							Get Started — It&apos;s Free
						</Button>
					</div>
				</div>

				{/* Right — dashboard preview */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6'>
					<img
						src='/img/dash.png'
						alt='GhostOpsAI Dashboard'
						className='shadow-black shadow-2xl rounded-sm'
					/>
				</div>
			</div>

			<Features />
			<About />
			<Contact />

			{/* ── Bottom CTA ── */}
			<div className="flex h-screen w-full bg-[url('/img/Ghost2.png')] bg-cover bg-center bg-neutral-800">
				<div className='flex flex-col items-center justify-center text-center p-6 md:p-10 text-white w-full gap-6'>
					<div className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn'>
						Awaiting Orders
					</div>
					<h2 className='text-3xl md:text-4xl lg:text-5xl font-bold'>
						Ready to Deploy?
					</h2>
					<p className='text-sm md:text-base text-fontz max-w-md leading-relaxed'>
						Your operators are standing by. Take command, plan your next
						operation, and lead your team into Auroa.
					</p>
					<Button className='btn' onClick={signUp}>
						Take Command
					</Button>
				</div>
			</div>

			{showTopButton && (
				<button
					onClick={scrollToTop}
					className='btn fixed bottom-8 right-8 font-mono text-[10px] tracking-widest uppercase py-2 px-5 rounded-sm shadow-lg transition duration-300'>
					↑ Top
				</button>
			)}
		</div>
	);
};

export default Home;
