import { Button } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Features, About, Contact, TacticalTerminal } from "@/components";
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
	const scrollToOpsBuilder = () =>
		document
			.getElementById("ops-builder")
			?.scrollIntoView({ behavior: "smooth" });

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
						<Button
							className='btn'
							onClick={signUp}>
							Get Started — It&apos;s Free
						</Button>
						<button
							type='button'
							onClick={scrollToOpsBuilder}
							className='font-mono text-xs tracking-widest uppercase text-lines/60 hover:text-btn transition-colors'>
							or build ops — no sign up required ↓
						</button>
					</div>
				</div>

				{/* Right — tactical terminal */}
				<div className='w-full lg:w-1/2 flex items-center justify-center p-6'>
					<TacticalTerminal />
				</div>
			</div>

			<Features />

			{/* ── Ops Builder promo ── */}
			<div
				id='ops-builder'
				className='w-full bg-black py-20 px-6 md:px-10 lg:px-20'>
				<div className='max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12'>
					{/* Left — copy */}
					<div className='flex-1 flex flex-col gap-6'>
						<div className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn'>
							No Account Required
						</div>
						<h2 className='text-3xl md:text-4xl font-bold text-white leading-tight'>
							Plan Your Next Operation.
							<br />
							Share It Instantly.
						</h2>
						<p className='text-sm text-fontz leading-relaxed max-w-md'>
							The Ops Builder lets you write a full mission brief — province
							phases, objectives, rules of engagement, loadout, vehicle
							restrictions — and generate a shareable link. No login. No
							backend. The mission lives in the URL.
						</p>
						<ul className='flex flex-col gap-2'>
							{[
								"Multi-phase ops — each phase can chain multiple provinces with directional approach",
								"Infil, bases, and exfil per phase",
								"Objective types: HVT, destroy, steal, recon, rescue, and more",
								"ROE checkboxes and custom rules",
								"Loadout locks with per-weapon attachment selection",
								"Item, perk, vehicle, and PC mod restrictions",
								"Draft autosaves locally — generate a link when ready",
							].map((item, i) => (
								<li
									key={i}
									className='flex items-start gap-2 text-fontz text-sm leading-relaxed'>
									<span className='mt-1.5 w-1 h-1 rounded-full bg-btn shrink-0' />
									{item}
								</li>
							))}
						</ul>
						<div className='flex items-center gap-4 mt-2'>
							<Link
								to='/ops/builder'
								className='btn font-mono text-[10px] tracking-widest uppercase py-2.5 px-6 rounded-sm'>
								Open Ops Builder
							</Link>
							{/*<Link
								to='/ops/reader'
								className='font-mono text-[10px] tracking-widest uppercase text-lines/40 hover:text-btn transition-colors'>
								View Sample Brief →
							</Link>*/}
						</div>
					</div>

					{/* Right — mock brief card */}
					<div className='w-full lg:w-80 shrink-0 border border-neutral-700/50 rounded-sm bg-neutral-900 p-5 flex flex-col gap-4 shadow-2xl shadow-black'>
						<div className='flex flex-col gap-0.5'>
							<span className='font-mono text-[8px] tracking-[0.4em] uppercase text-btn/60'>
								Mission Brief
							</span>
							<span className='font-mono text-base text-white tracking-wide'>
								Operation Blackthorn
							</span>
							<div className='flex gap-2 mt-1'>
								{["Ghost", "PC", "Night"].map((tag) => (
									<span
										key={tag}
										className='font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 border border-neutral-700 text-neutral-500 rounded'>
										{tag}
									</span>
								))}
							</div>
						</div>

						<div className='h-px bg-neutral-800' />

						<div className='flex flex-col gap-3'>
							<div className='flex flex-col gap-1 pl-2 border-l border-neutral-700/50'>
								<span className='font-mono text-[8px] tracking-[0.3em] uppercase text-neutral-600'>
									Phase 1 — Silent Mountain
								</span>
								<span className='font-mono text-[10px] text-neutral-400'>
									Obj 1: <span className='text-btn/70'>Eliminate HVT</span> —
									Col. Vasquez
								</span>
								<span className='font-mono text-[10px] text-neutral-400'>
									Obj 2: <span className='text-btn/70'>Recover Intel</span> —
									Comm Tower
								</span>
							</div>
							<div className='flex flex-col gap-1 pl-2 border-l border-neutral-700/50'>
								<div className='flex items-center gap-1.5 flex-wrap'>
									<span className='font-mono text-[8px] tracking-[0.3em] uppercase text-neutral-600'>
										Phase 2 — Cape North → Lake Country
									</span>
									<span className='font-mono text-[7px] tracking-widest uppercase px-1 py-0.5 border border-amber-800/40 text-amber-500/70 rounded'>
										From North
									</span>
								</div>
								<span className='font-mono text-[10px] text-neutral-400'>
									Obj 1: <span className='text-btn/70'>Destroy</span> — Fuel
									Depot
								</span>
							</div>
						</div>

						<div className='h-px bg-neutral-800' />

						<div className='flex flex-col gap-1'>
							<span className='font-mono text-[8px] tracking-[0.3em] uppercase text-neutral-600'>
								ROE
							</span>
							<div className='flex flex-col gap-0.5'>
								{[
									"Suppressed Weapons Only",
									"No Revives",
									"Stealth Mandatory",
								].map((r) => (
									<div
										key={r}
										className='flex items-center gap-1.5'>
										<span className='w-1 h-1 rounded-full bg-red-700/60 shrink-0' />
										<span className='font-mono text-[9px] text-neutral-500'>
											{r}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

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
					<Button
						className='btn'
						onClick={signUp}>
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
