import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute, AuthRedirector } from "@/auth";
import MainLayout from "./layout/MainLayout";

// Eagerly load public pages — on the critical render path
import Home  from "@/pages/Home";
import Login from "@/pages/Login";

// Lazy-load everything behind auth — split into separate chunks at build time
const UnifiedDashboard = lazy(() => import("@/pages/UnifiedDashboard"));
const Memorial         = lazy(() => import("@/components/tables/Memorial"));
const Roster           = lazy(() => import("@/components/tables/Roster"));
const Teams            = lazy(() => import("@/components/tables/Teams"));
const Infirmary        = lazy(() => import("@/components/tables/Infirmary"));
const Garage           = lazy(() => import("@/components/tables/Garage"));
const NewOperatorForm  = lazy(() => import("@/components/forms/NewOperatorForm"));
const EditOperatorForm = lazy(() => import("@/components/forms/EditOperatorForm"));
const EditTeamForm     = lazy(() => import("@/components/forms/EditTeamForm"));
const NewTeamForm      = lazy(() => import("@/components/forms/NewTeamForm"));
const NewVehicleForm   = lazy(() => import("@/components/forms/NewVehicleForm"));
const EditVehicleForm  = lazy(() => import("@/components/forms/EditVehicleForm"));

const AppRoutes = () => {
	return (
		<>
			<AuthRedirector />
			<Routes>
				{/* Public */}
				<Route path='/' element={<MainLayout />}>
					<Route index element={<Home />} />
				</Route>
				<Route path='login' element={<Login />} />

				{/* Private — single Suspense covers the whole dashboard tree */}
				<Route
					path='/dashboard'
					element={
						<PrivateRoute>
							<Suspense fallback={null}>
								<UnifiedDashboard />
							</Suspense>
						</PrivateRoute>
					}>
					<Route path='memorial'     element={<Memorial />} />
					<Route path='roster'       element={<Roster />} />
					<Route path='teams'        element={<Teams />} />
					<Route path='infirmary'    element={<Infirmary />} />
					<Route path='garage'       element={<Garage />} />
					<Route path='newOperator'  element={<NewOperatorForm />} />
					<Route path='editOperator' element={<EditOperatorForm />} />
					<Route path='editTeam'     element={<EditTeamForm />} />
					<Route path='newTeam'      element={<NewTeamForm />} />
					<Route path='newVehicle'   element={<NewVehicleForm />} />
					<Route path='editVehicle'  element={<EditVehicleForm />} />
				</Route>
			</Routes>
		</>
	);
};

export default AppRoutes;
