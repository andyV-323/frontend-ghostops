import { Routes, Route } from "react-router-dom";
import { PrivateRoute, AuthRedirector } from "@/auth";
import { Home, UnifiedDashboard } from "@/pages";
import {
	Memorial,
	Roster,
	Teams,
	Infirmary,
	Garage,
} from "@/components/tables";
import {
	NewOperatorForm,
	EditOperatorForm,
	EditTeamForm,
	NewTeamForm,
	NewVehicleForm,
	EditVehicleForm,
} from "@/components/forms";
import MainLayout from "./layout/MainLayout";
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
							<UnifiedDashboard />
						</PrivateRoute>
					}>
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
						path='garage'
						element={<Garage />}
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
					<Route
						path='newVehicle'
						element={<NewVehicleForm />}
					/>
					<Route
						path='editVehicle'
						element={<EditVehicleForm />}
					/>
				</Route>
			</Routes>
		</>
	);
};

export default AppRoutes;
