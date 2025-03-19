import { Button } from "@material-tailwind/react";
import { useEffect } from "react";
import { useOperatorsStore } from "@/zustand";
import { useFormActions, useActionButtons } from "@/hooks";
import {
	GhostID,
	ClassLoadout,
	SecondaryClassLoadout,
} from "@/components/forms";

const NewOperatorForm = () => {
	const { handleCreateOperator } = useFormActions();
	const { initializeNewOperator, loading } = useOperatorsStore();
	const { nextStep, prevStep, step } = useActionButtons();

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
			<div className='py-8 px-4 mx-auto max-w-2xl lg:py-16'>
				<form>
					{/*ID*/}
					{step === 1 && (
						<div>
							<GhostID />
							<br />
							<Button
								className='btn mt-4 ml-2 '
								onClick={() => nextStep(3)}>
								Skip to submit
							</Button>{" "}
							<Button
								className='btn mt-4'
								onClick={() => nextStep(2)}>
								Next
							</Button>
						</div>
					)}
					{step === 2 && (
						<div>
							{/* Class Loadout Setup */}
							<ClassLoadout />
							<br />

							<Button
								className='btn mt-4 ml-2'
								onClick={prevStep}>
								Previous
							</Button>
							<Button
								className='btn mt-4 ml-2'
								onClick={() => nextStep(3)}>
								Next
							</Button>
						</div>
					)}
					{step === 3 && (
						<div>
							<SecondaryClassLoadout />
							<br />
							{/* Navigation */}
							<Button
								className='btn mt-4 ml-2'
								onClick={prevStep}>
								Previous
							</Button>

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
