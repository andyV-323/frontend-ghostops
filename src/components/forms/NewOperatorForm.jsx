import { Button } from "@material-tailwind/react";
import { useEffect } from "react";
import { useOperatorsStore } from "@/zustand";
import { useFormActions, useActionButtons } from "@/hooks";
import { GhostID } from "@/components/forms";

const NewOperatorForm = () => {
	const { handleCreateOperator } = useFormActions();
	const { initializeNewOperator, loading } = useOperatorsStore();
	const { step } = useActionButtons();

	useEffect(() => {
		initializeNewOperator();
	}, [initializeNewOperator]);

	// Show Loading State
	if (loading) {
		return (
			<div className='text-center text-gray-400 p-4'>Creating operator...</div>
		);
	}

	return (
		<section className='bg-transparent text-sm text-fontz'>
			<div className='py-8 px-4 mx-auto w-full max-w-[600px] lg:py-16'>
				<form>
					{/*ID*/}
					{step === 1 && (
						<div>
							<GhostID />
							<br />

							<Button
								type='submit'
								className='btn mt-4 ml-2'
								onClick={(e) => handleCreateOperator(e)}>
								Submit
							</Button>
						</div>
					)}
				</form>
			</div>
		</section>
	);
};

export default NewOperatorForm;
