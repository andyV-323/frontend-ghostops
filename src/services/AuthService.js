import { useAuth } from "react-oidc-context";

//AWS Cognito Configuration
const cognitoAuthConfig = {
	authority: import.meta.env.VITE_COGNITO_AUTHORITY,
	client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
	redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
	response_type: "code",
	scope: import.meta.env.VITE_COGNITO_SCOPE,
};

export const useAuthService = () => {
	const auth = useAuth();

	const isAuthenticated = auth.isAuthenticated;
	const user = auth.user;

	// Handle Sign-in Redirect
	const signIn = () => {
		auth.signinRedirect();
	};

	// Handle Sign-up Redirect
	const signUp = () => {
		const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
		const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
		const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI;

		window.location.href = `${cognitoDomain}/signup?client_id=${clientId}&response_type=code&scope=email openid phone profile&redirect_uri=${encodeURIComponent(
			redirectUri
		)}`;
	};

	// Handle Sign-out Redirect
	const signOut = async () => {
		await auth.removeUser();
		const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
		const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
		const logoutUri = import.meta.env.VITE_LOGOUT_URI;

		window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
			logoutUri
		)}`;
	};

	return { auth, isAuthenticated, user, signIn, signUp, signOut };
};

export default cognitoAuthConfig;
