import { useState } from "react";
import { about } from "@/config";
import { Card, CardHeader, Typography, Button } from "@material-tailwind/react";

const About = () => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleToggle = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<div className='flex flex-col items-center w-full bg-neutral-800'>
			<h1 className='text-3xl md:text-5xl font-bold text-white mb-6'>About</h1>

			<div className='grid grid-cols-1 gap-6 px-6 md:px-10 lg:px-20'>
				{about.map((section, index) => {
					const fullTextLines = section.text.split("\n");
					const displayedLines = isExpanded
						? fullTextLines
						: fullTextLines.slice(0, 1);

					return (
						<Card
							key={index}
							className='bg-background/50 border-4 border-lines p-6 md:p-8 text-white shadow-black shadow-2xl rounded-2xl max-w-md w-full'>
							<CardHeader className='text-xl md:text-2xl font-bold text-white bg-transparent mb-4 text-center'>
								{section.title}
							</CardHeader>
							<Typography className='text-sm md:text-base text-gray-300 text-center'>
								{displayedLines.map((line, i) => (
									<span key={i}>
										{line.trim()}
										<br />
										<br />
									</span>
								))}
							</Typography>
							{fullTextLines.length > 2 && (
								<Button
									onClick={handleToggle}
									className='bg-btn hover:bg-highlight hover:text-white text-black font-semibold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow-lg transition duration-300 ease-in-out mt-4 md:mt-6'>
									{isExpanded ? "Show Less" : "Read More"}
								</Button>
							)}
						</Card>
					);
				})}
			</div>
		</div>
	);
};

export default About;
