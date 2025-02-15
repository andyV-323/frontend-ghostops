/** @format */
import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

// ✅ Redirects to home if user is NOT authenticated
const PrivateRoute = ({ children }) => {
	const auth = useAuth();

	if (!auth.isAuthenticated) {
		console.log("Unauthorized access! Redirecting to Home...");
		return (
			<Navigate
				to='/'
				replace
			/>
		);
	}

	return children;
};

export default PrivateRoute;
