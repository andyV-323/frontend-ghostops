import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { useOperatorsStore } from "@/zustand";
import { useEffect } from "react";

const OperatorImageView = ({ operator }) => {
	const { selectedOperator, fetchOperatorById } = useOperatorsStore();

	// Fetch fresh operator when sheet opens
	useEffect(() => {
		if (operator?._id) {
			fetchOperatorById(operator._id);
		}
	}, [operator?._id, fetchOperatorById]);

	if (!selectedOperator) {
		return (
			<div className='p-6 text-center text-gray-400'>
				Loading operator profile...
			</div>
		);
	}

	// Prefer full body image (S3), fallback to thumbnail, then default
	const displayImage =
		selectedOperator.imageKey || selectedOperator.image || "/ghost/Default.png";

	return (
		<section className='bg-transparent text-fontz p-4'>
			<div className='flex flex-col items-center'>
				{/* HEADER */}
				<div className='mb-6 text-center'>
					<h2 className='text-2xl font-bold mb-1'>
						{selectedOperator.callSign || "Unknown Operator"}
					</h2>

					<p className='text-gray-400'>
						{selectedOperator.class || "No Class"}
						{selectedOperator.role && ` • ${selectedOperator.role}`}
					</p>

					<div className='flex items-center justify-center mt-2'>
						<div
							className={`h-3 w-3 rounded-full me-2 ${
								selectedOperator.status === "Active" ? "bg-green-500"
								: selectedOperator.status === "Injured" ? "bg-yellow-500"
								: "bg-red-500"
							}`}
						/>
						<span className='text-sm text-gray-400'>
							{selectedOperator.status || "Unknown Status"}
						</span>
					</div>
				</div>

				{/* IMAGE */}
				<div className='w-full flex justify-center mb-6'>
					<img
						src={displayImage}
						alt={selectedOperator.callSign}
						className='max-w-full max-h-[600px] object-contain rounded-xl border-2 border-gray-700 shadow-lg'
						onError={(e) => {
							console.error("Image failed to load:", displayImage);
							e.currentTarget.src = "/ghost/Default.png";
						}}
					/>
				</div>

				{/* TAGS */}
				<div className='w-full space-y-3 text-sm'>
					{selectedOperator.support && (
						<div className='text-center bg-blue-900/20 border border-blue-700 rounded-lg py-2'>
							<span className='text-blue-400 font-semibold'>
								⚡ SUPPORT SPECIALIST
							</span>
						</div>
					)}

					{selectedOperator.aviator && (
						<div className='text-center bg-sky-900/20 border border-sky-700 rounded-lg py-2'>
							<span className='text-sky-400 font-semibold'>✈️ AVIATOR</span>
						</div>
					)}
				</div>

				{/* BIO */}
				{selectedOperator.bio && (
					<div className='mt-6 w-full bg-gray-800/40 rounded-lg p-4 border border-gray-700'>
						<h3 className='font-semibold mb-2'>Bio</h3>
						<p className='text-gray-400 whitespace-pre-wrap text-sm'>
							{selectedOperator.bio}
						</p>
					</div>
				)}

				{/* IMAGE INFO */}
				<div className='mt-6 text-xs text-gray-500 text-center'>
					{selectedOperator.imageKey ?
						"Full Body Image (S3)"
					: selectedOperator.image?.startsWith("https://") ?
						"Thumbnail Image (S3)"
					:	"Preset Ghost Image"}
				</div>
			</div>
		</section>
	);
};

OperatorImageView.propTypes = {
	operator: OperatorPropTypes,
};

export default OperatorImageView;
