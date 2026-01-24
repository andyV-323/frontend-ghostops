import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";

const OperatorImageView = ({ operator }) => {
	// Get the full image URL - prioritize imageKey (full body) over image (thumbnail)
	const getImageUrl = (imagePath) => {
		if (!imagePath) {
			return null;
		}

		// If it's an uploaded image (starts with /uploads/), prepend the API base URL
		if (imagePath.startsWith("/uploads/")) {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "http://localhost:8080";

			// Remove /api from the end of API_BASE_URL if it exists
			const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, "");

			return `${cleanBaseUrl}${imagePath}`;
		}

		// Otherwise it's a preset Ghost image
		return imagePath;
	};

	// Use imageKey (full body) if available, otherwise fall back to image (thumbnail)
	const fullBodyImageUrl = getImageUrl(operator?.imageKey);
	const thumbnailImageUrl =
		getImageUrl(operator?.image) || "/ghost/Default.png";

	// Decide which image to show
	const displayImageUrl = fullBodyImageUrl || thumbnailImageUrl;
	const hasFullBodyImage = !!fullBodyImageUrl;

	// Debug logging
	console.log("Debug - imageKey from DB:", operator?.imageKey);
	console.log("Debug - Full body URL:", fullBodyImageUrl);
	console.log("Debug - Display URL:", displayImageUrl);

	return (
		<section className='bg-transparent text-md text-fontz p-4'>
			<div className='flex flex-col items-center'>
				{/* Operator Info Header */}
				<div className='mb-6 text-center'>
					<h2 className='text-2xl font-bold text-fontz mb-2'>
						{operator?.callSign || "Unknown Operator"}
					</h2>
					<p className='text-gray-400'>
						{operator?.class || "No Class"}{" "}
						{operator?.role && `• ${operator.role}`}
					</p>
					<div className='flex items-center justify-center mt-2'>
						<div
							className={`h-3 w-3 rounded-full ${
								operator?.status === "Active" ? "bg-green-500"
								: operator?.status === "Injured" ? "bg-yellow-500"
								: "bg-red-500"
							} me-2`}
						/>
						<span className='text-sm text-gray-400'>
							{operator?.status || "Unknown Status"}
						</span>
					</div>
				</div>

				{/* Image Display */}
				<div className='w-full flex justify-center mb-4'>
					<div className='relative group'>
						<img
							src={displayImageUrl}
							alt={operator?.callSign || "Operator"}
							className='max-w-full max-h-[600px] rounded-lg shadow-lg border-2 border-gray-700 object-contain bg-gray-800'
							onError={(e) => {
								console.error("Image failed to load:", displayImageUrl);
								e.target.src = "/ghost/Default.png";
							}}
						/>
						{/* Overlay with callsign on hover */}
						<div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-end justify-center pb-4'>
							<span className='text-white text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
								{operator?.callSign}
							</span>
						</div>
					</div>
				</div>

				{/* Additional Info */}
				<div className='w-full space-y-3 mt-4 text-sm'>
					{operator?.support && (
						<div className='flex items-center justify-center gap-2 bg-blue-900/20 border border-blue-700 rounded-lg px-4 py-2'>
							<span className='text-blue-400 font-semibold'>
								⚡ SUPPORT SPECIALIST
							</span>
						</div>
					)}

					{operator?.aviator && (
						<div className='flex items-center justify-center gap-2 bg-sky-900/20 border border-sky-700 rounded-lg px-4 py-2'>
							<span className='text-sky-400 font-semibold'>✈️ AVIATOR</span>
						</div>
					)}

					{operator?.bio && (
						<div className='bg-gray-800/40 rounded-lg p-4 border border-gray-700'>
							<h3 className='text-fontz font-semibold mb-2'>Bio</h3>
							<p className='text-gray-400 text-sm whitespace-pre-wrap'>
								{operator.bio}
							</p>
						</div>
					)}
				</div>

				{/* Image Info */}
				<div className='mt-6 text-xs text-gray-500 text-center'>
					{hasFullBodyImage ?
						<p>Full Body Image (Custom Upload)</p>
					: operator?.image?.startsWith("/uploads/") ?
						<p>Thumbnail Image (Custom Upload)</p>
					:	<p>Preset Ghost Image</p>}
				</div>
			</div>
		</section>
	);
};

OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
};

export default OperatorImageView;
