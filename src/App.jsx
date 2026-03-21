import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import AppRoutes from "@/routes";
import { ToastContainer } from "react-toastify";

const App = () => {
	const auth = useAuth();
	// Keep localStorage token in sync — runs every time the token is silently renewed
	useEffect(() => {
		if (auth.user?.access_token) {
			localStorage.setItem("authToken", auth.user.access_token);
		}
	}, [auth.user?.access_token]);

	return (
		<Router>
			<AppRoutes />
			<ToastContainer
				position='top-right'
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop
				closeOnClick
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme='dark'
			/>
		</Router>
	);
};

export default App;
