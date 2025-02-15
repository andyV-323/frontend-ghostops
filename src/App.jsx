/** @format */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import {
	About,
	Features,
	Contact,
	Home,
	OperatorDashboard,
	Briefing,
} from "./pages";
import { Header, Memorial } from "./components";

import { AuthRedirector, PrivateRoute } from "./auth";
import { useEffect, useState } from "react";
import EditOperatorForm from "./components/forms/EditOperatorForm";
import EditTeamForm from "./components/forms/EditTeamForm";
import NewTeamForm from "./components/forms/NewTeamForm";
import NewOperatorForm from "./components/forms/NewOperatorForm";

function App() {
	const auth = useAuth();
	const [tokenSet, setTokenSet] = useState(false); // ✅ New state to track token update

	useEffect(() => {
		if (auth.isAuthenticated && auth.user?.access_token && !tokenSet) {
			localStorage.setItem("authToken", auth.user.access_token); // ✅ Store token
			console.log(
				"DEBUG: New token saved in localStorage:",
				auth.user.access_token
			);

			setTokenSet(true); // ✅ Prevents infinite loop
		}
	}, [auth.isAuthenticated, auth.user, tokenSet]); // ✅ Includes `tokenSet` to break the loop

	return (
		<Router>
			<Header />
			{!auth.isAuthenticated}
			<AuthRedirector /> {/*Handles redirection inside the Router */}
			<Routes>
				<Route
					path='/'
					element={<Home />}
				/>
				<Route
					path='/about'
					element={<About />}
				/>
				<Route
					path='/features'
					element={<Features />}
				/>
				<Route
					path='/contact'
					element={<Contact />}
				/>
				<Route
					path='/dashboard'
					element={
						<PrivateRoute>
							<OperatorDashboard />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/briefing'
					element={
						<PrivateRoute>
							<Briefing />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/Memorial'
					element={
						<PrivateRoute>
							<Memorial />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/edit'
					element={
						<PrivateRoute>
							<EditOperatorForm />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/editTeam'
					element={
						<PrivateRoute>
							<EditTeamForm />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/newTeam'
					element={
						<PrivateRoute>
							<NewTeamForm />
						</PrivateRoute>
					}
				/>
				<Route
					path='/dashboard/new'
					element={
						<PrivateRoute>
							<NewOperatorForm />
						</PrivateRoute>
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;
