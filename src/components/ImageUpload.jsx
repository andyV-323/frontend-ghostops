import { useState } from "react";
import { Button } from "@material-tailwind/react";
import { uploadOperatorImage } from "@/api/OperatorsApi";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const ImageUpload = ({ currentImage, onImageUpload }) => {
	const [selectedFile, setSelectedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(currentImage || "");
	const [uploading, setUploading] = useState(false);

	// Handle file selection
	const handleFileSelect = (e) => {
		const file = e.target.files[0];

		if (!file) return;

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
		if (!allowedTypes.includes(file.type)) {
			toast.error("Only JPG, JPEG, and PNG files are allowed");
			return;
		}

		// Validate file size (5MB max)
		const maxSize = 5 * 1024 * 1024; // 5MB in bytes
		if (file.size > maxSize) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setSelectedFile(file);

		// Create preview URL
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewUrl(reader.result);
		};
		reader.readAsDataURL(file);
	};

	// Handle upload
	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select an image first");
			return;
		}

		setUploading(true);

		try {
			const response = await uploadOperatorImage(selectedFile);

			// Call the callback with the new image URL
			onImageUpload(response.imageUrl);

			toast.success("Image uploaded successfully!");
			setSelectedFile(null);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload image");
		} finally {
			setUploading(false);
		}
	};

	// Clear selection
	const handleClear = () => {
		setSelectedFile(null);
		setPreviewUrl(currentImage || "");
	};

	return (
		<div className='w-full'>
			<label className='block mb-2 font-medium text-fontz'>
				Upload Custom Image
			</label>

			{/* Preview */}
			{previewUrl && (
				<div className='mb-4'>
					<img
						src={previewUrl}
						alt='Preview'
						className='w-32 h-32 object-cover rounded-lg border-2 border-gray-600'
					/>
				</div>
			)}

			{/* File Input */}
			<div className='flex flex-col gap-3'>
				<input
					type='file'
					accept='image/jpeg,image/jpg,image/png'
					onChange={handleFileSelect}
					className='block w-full text-sm text-gray-400
						file:mr-4 file:py-2 file:px-4
						file:rounded-lg file:border-0
						file:text-sm file:font-semibold
						file:bg-btn file:text-white
						hover:file:bg-opacity-80
						cursor-pointer'
				/>

				{/* Buttons */}
				{selectedFile && (
					<div className='flex gap-2'>
						<Button
							onClick={handleUpload}
							disabled={uploading}
							className='btn flex-1'>
							{uploading ? "Uploading..." : "Upload Image"}
						</Button>
						<Button
							onClick={handleClear}
							disabled={uploading}
							className='bg-gray-600 hover:bg-gray-700 flex-1'>
							Clear
						</Button>
					</div>
				)}
			</div>

			<p className='mt-2 text-xs text-gray-400'>
				Accepted formats: JPG, JPEG, PNG (max 5MB)
			</p>
		</div>
	);
};

ImageUpload.propTypes = {
	currentImage: PropTypes.string,
	onImageUpload: PropTypes.func.isRequired,
};

export default ImageUpload;
