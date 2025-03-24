/** @format */
import { Routes, Route } from "react-router-dom";
import { PrivateRoute, AuthRedirector } from "@/auth";

// Import Pages
import { Home, OperatorDashboard, Briefing } from "@/pages";
import { Memorial, Roster, Teams, Infirmary } from "@/components/tables";
import {
	NewOperatorForm,
	EditOperatorForm,
	EditTeamForm,
	NewTeamForm,
} from "@/components/forms";
import DashboardLayout from "./layout/DashboardLayout";
import MainLayout from "./layout/MainLayout";
import Stats from "./pages/Stats";
import Login from "./pages/Login";

// Define Routes
const AppRoutes = () => {
	return (
		<>
			<AuthRedirector /> {/* Handles authentication redirection */}
			<Routes>
				{/* Public Routes */}

				<Route
					path='/'
					element={<MainLayout />}>
					<Route
						index
						element={<Home />}
					/>{" "}
				</Route>
				<Route
					path='login'
					element={<Login />}
				/>

				<Route
					path='/dashboard'
					element={
						<PrivateRoute>
							<DashboardLayout />
						</PrivateRoute>
					}>
					<Route
						index
						element={<OperatorDashboard />}
					/>{" "}
					{/* Default Dashboard Page */}
					<Route
						path='briefing'
						element={<Briefing />}
					/>
					<Route
						path='stats'
						element={<Stats />}
					/>
					<Route
						path='memorial'
						element={<Memorial />}
					/>
					<Route
						path='roster'
						element={<Roster />}
					/>
					<Route
						path='teams'
						element={<Teams />}
					/>
					<Route
						path='infirmary'
						element={<Infirmary />}
					/>
					<Route
						path='newOperator'
						element={<NewOperatorForm />}
					/>
					<Route
						path='editOperator'
						element={<EditOperatorForm />}
					/>
					<Route
						path='editTeam'
						element={<EditTeamForm />}
					/>
					<Route
						path='newTeam'
						element={<NewTeamForm />}
					/>
				</Route>
			</Routes>
		</>
	);
};

export default AppRoutes;
