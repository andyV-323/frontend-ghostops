/** @format */
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";

// Redirect only if the user is on "/" (home), allow all /dashboard/* routes
const AuthRedirector = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const location = useLocation(); // Get the current page

	useEffect(() => {
		if (auth.isAuthenticated && location.pathname === "/") {
			console.log("User logged in, redirecting to Dashboard...");
			navigate("/dashboard"); // Redirect only from "/"
		}
	}, [auth.isAuthenticated, navigate, location.pathname]);

	return null;
};

export default AuthRedirector;
