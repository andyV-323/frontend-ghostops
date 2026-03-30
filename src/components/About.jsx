import { about } from "@/config";

const About = () => (
	<div className='w-full bg-neutral-800 py-20 px-6 md:px-10 lg:px-20'>
		<div className='max-w-3xl mx-auto'>
			<div className='mb-10 text-center'>
				<p className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn mb-3'>
					Background
				</p>
				<h2 className='text-3xl md:text-4xl font-bold text-white'>About</h2>
			</div>

			{about.map((section, index) => {
				const paragraphs = section.text
					.split("\n")
					.map((p) => p.trim())
					.filter(Boolean);

				return (
					<div key={index} className='border border-neutral-700/50 rounded-sm p-6 md:p-8 bg-neutral-900'>
						<h3 className='font-mono text-[11px] tracking-widest uppercase text-btn mb-6'>
							{section.title}
						</h3>
						<div className='flex flex-col gap-4'>
							{paragraphs.map((para, i) => (
								<p key={i} className='text-sm md:text-base text-fontz leading-relaxed'>
									{para}
								</p>
							))}
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

export default About;
