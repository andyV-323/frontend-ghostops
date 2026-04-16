import { useState } from "react";
import { features } from "@/config";
import PropTypes from "prop-types";

const FeatureCard = ({ title, icon, description }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const visible = isExpanded ? description : description.slice(0, 2);

	return (
		<div className='flex flex-col bg-neutral-900 border border-neutral-700/50 rounded-sm p-5 w-full shadow-black shadow-xl hover:border-neutral-600/60 transition-colors'>
			{/* Header */}
			<div className='flex items-center gap-3 mb-4'>
				<img src={icon} alt={`${title} icon`} className='w-7 h-7 shrink-0' />
				<h3 className='font-mono text-[11px] tracking-widest uppercase text-white'>
					{title}
				</h3>
			</div>

			{/* Bullet list */}
			<ul className='flex flex-col gap-2 flex-1'>
				{visible.map((item, i) => (
					<li key={i} className='flex items-start gap-2 text-fontz text-sm leading-relaxed'>
						<span className='mt-1.5 w-1 h-1 rounded-full bg-btn shrink-0' />
						{item}
					</li>
				))}
			</ul>

			{/* Toggle */}
			{description.length > 2 && (
				<button
					onClick={() => setIsExpanded((p) => !p)}
					className='mt-4 self-start font-mono text-[9px] tracking-widest uppercase text-neutral-400 hover:text-btn transition-colors'>
					{isExpanded ? "Show less ↑" : "Show more ↓"}
				</button>
			)}
		</div>
	);
};

FeatureCard.propTypes = {
	title: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	description: PropTypes.array.isRequired,
};

const Features = () => (
	<div className='w-full bg-neutral-800 py-20 px-6 md:px-10 lg:px-20'>
		<div className='mb-12 text-center'>
			<p className='font-mono text-[10px] tracking-[0.3em] uppercase text-btn mb-3'>
				Capabilities
			</p>
			<h2 className='text-3xl md:text-4xl font-bold text-white'>
				Everything Your Unit Needs
			</h2>
		</div>
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
			{features.map((feature, i) => (
				<FeatureCard key={i} {...feature} />
			))}
		</div>
	</div>
);

export default Features;
