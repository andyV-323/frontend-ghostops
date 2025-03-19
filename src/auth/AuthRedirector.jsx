import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";

// Redirect only if the user is on landing page, allow all /dashboard/* routes
const AuthRedirector = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		if (auth.isAuthenticated && location.pathname === "/") {
			navigate("/dashboard");
		}
	}, [auth.isAuthenticated, navigate, location.pathname]);

	return null;
};

export default AuthRedirector;
