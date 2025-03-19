import { useNavigate } from "react-router-dom";
import { useState } from "react";

const useActionButtons = () => {
	const [step, setStep] = useState(1);

	const navigate = useNavigate();
	const handleReturn = () => navigate("/dashboard");
	const handleCancel = () => navigate("/dashboard");

	// Function to move to the next step or jump to a specific step
	const nextStep = (targetStep = null) => {
		setStep((prev) => (targetStep !== null ? targetStep : prev + 1));
	};

	// Function to move to the previous step
	const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

	return { handleReturn, handleCancel, nextStep, prevStep, step };
};

export default useActionButtons;
