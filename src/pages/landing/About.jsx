/** @format */

import { about } from "../../config/about";
import { Card, CardHeader, Typography } from "@material-tailwind/react";

const About = () => {
	return (
		<div className='flex flex-col items-center w-full bg-neutral-800 p-6 md:p-10'>
			<h1 className='text-3xl md:text-5xl font-bold text-white mb-6'>About </h1>

			{/* Responsive Grid Layout */}
			<div className='grid grid-cols-1 gap-6 px-6 md:px-10 lg:px-20 place-items-center'>
				{about.map((section, index) => (
					<Card
						key={index}
						className='bg-bckground/50 border-4 border-lines p-6 md:p-8 text-white shadow-black shadow-2xl rounded-2xl max-w-md w-full'>
						<CardHeader className='text-xl md:text-2xl font-bold text-white bg-transparent mb-4 text-center'>
							{section.title}
						</CardHeader>
						<Typography className='text-sm md:text-base text-gray-300 text-center'>
							{section.text}
						</Typography>
					</Card>
				))}
			</div>
		</div>
	);
};

export default About;
