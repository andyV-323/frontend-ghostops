const MainFooter = () => {
	return (
		<footer className='bg-black text-white text-center py-4'>
			<p className='text-sm'>
				&copy; {new Date().getFullYear()} GhostOpsAI. All Rights Reserved.
			</p>
			<p className='text-gray-600'>
				{" "}
				This project is not affiliated with Ubisoft Entertainment. Tom Clancy’s,
				Ghost Recon Breakpoint, and all related marks are trademarks of Ubisoft
				Entertainment in the U.S. and/or other countries. The GhostOpsAI project
				is an independent initiative and is not endorsed or sponsored by Ubisoft
				Entertainment. The use of any trademarks or copyrighted material is for
				educational and informational purposes only. All other trademarks,
				logos, and copyrights are the property of their respective owners.
				GhostOpsAI is a community-driven project and is not intended for
				commercial use. By using this project, you agree to comply with all
				applicable laws and regulations.{" "}
			</p>
		</footer>
	);
};

export default MainFooter;
