import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
	const auth = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (auth.isAuthenticated) {
			navigate("/dashboard");
		} else {
			auth.signinRedirect(); // This sends to Cognito
		}
	}, [auth, navigate]);

	return <p>Redirecting...</p>;
};
export default Login;
