import { useState, useEffect, useCallback } from "react";
import { OperatorsApi, chatGPTApi } from "@/api";
import { Button } from "@material-tailwind/react";
import { OperatorPropTypes } from "@/propTypes/OperatorPropTypes";
import { PropTypes } from "prop-types";
import { toast } from "react-toastify";

const Bio = ({ operator, setOperator }) => {
	const [bio, setBio] = useState("No bio available.");
	const [loading, setLoading] = useState(false);

	// When a new operator is selected, update bio
	useEffect(() => {
		setBio((prevBio) =>
			operator?.bio !== prevBio ? operator?.bio || "No bio available." : prevBio
		);
	}, [operator]);

	const handleGenerateBio = useCallback(async () => {
		if (!operator || !operator._id) {
			toast.warn("No operator selected!");
			return;
		}

		setLoading(true);
		try {
			const response = await chatGPTApi("bio", {
				name: operator.name,
				callSign: operator.callSign,
				nationality: operator.nationality,
				class: operator.class,
				sf: operator.sf,
				status: operator.status,
			});

			if (response?.Response) {
				const generatedBio = response.Response;

				// Update bio state only if it changed
				if (generatedBio !== bio) {
					setBio(generatedBio);
					setOperator({ ...operator, bio: generatedBio });

					// Save to backend
					await OperatorsApi.updateOperatorBio(operator._id, generatedBio);
				}
			} else {
				throw new Error("Invalid API response format");
			}
		} catch (error) {
			console.error("ERROR fetching bio:", error);
			setBio("Error fetching bio.");
		} finally {
			setLoading(false);
		}
	}, [operator, setOperator, bio]);

	return (
		<div className='flex flex-col items-center'>
			<div className='block max-w-md p-6 bg-transparent rounded-lg'>
				<h5 className='mb-2 text-2xl font-bold tracking-tight text-fontz'>
					Bio:
				</h5>
				<p className='font-normal text-sm text-gray-400 whitespace-pre-line'>
					{bio}
				</p>
			</div>
			<Button
				type='button'
				className='bg-transparent flex flex-col items-center '
				onClick={handleGenerateBio}>
				<img
					src='/icons/ai.svg'
					alt='AI Icon'
					className='bg-blk/50 hover:bg-highlight rounded'
				/>
			</Button>
			{loading && (
				<div className='w-10 h-10 border-4 border-gray-300 border-t-highlight rounded-full animate-spin'></div>
			)}
		</div>
	);
};
Bio.propTypes = {
	operator: OperatorPropTypes,
	setOperator: PropTypes.func.isRequired,
};
export default Bio;
