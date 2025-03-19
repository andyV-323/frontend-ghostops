import { BrowserRouter as Router } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import AppRoutes from "@/routes";
import { ToastContainer } from "react-toastify";

const App = () => {
	const auth = useAuth();
	const [tokenSet, setTokenSet] = useState(false);

	// Store Auth Token in LocalStorage
	useEffect(() => {
		if (auth.isAuthenticated && auth.user?.access_token && !tokenSet) {
			localStorage.setItem("authToken", auth.user.access_token);
			setTokenSet(true);
		}
	}, [auth.isAuthenticated, auth.user, tokenSet]);

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
