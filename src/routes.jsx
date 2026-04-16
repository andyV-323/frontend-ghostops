import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PrivateRoute, AuthRedirector } from "@/auth";
import MainLayout from "./layout/MainLayout";

// Eagerly load the two public pages — they're on the critical path
import Home    from "@/pages/Home";
import Login   from "@/pages/Login";

// Lazy-load everything behind auth — none of this is needed for first paint
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

				{/* Private — wrapped in Suspense so lazy chunks load gracefully */}
				<Route
					path='/dashboard'
					element={
						<PrivateRoute>
							<Suspense fallback={null}>
								<UnifiedDashboard />
							</Suspense>
						</PrivateRoute>
					}>
					<Route path='memorial'     element={<Suspense fallback={null}><Memorial /></Suspense>} />
					<Route path='roster'       element={<Suspense fallback={null}><Roster /></Suspense>} />
					<Route path='teams'        element={<Suspense fallback={null}><Teams /></Suspense>} />
					<Route path='infirmary'    element={<Suspense fallback={null}><Infirmary /></Suspense>} />
					<Route path='garage'       element={<Suspense fallback={null}><Garage /></Suspense>} />
					<Route path='newOperator'  element={<Suspense fallback={null}><NewOperatorForm /></Suspense>} />
					<Route path='editOperator' element={<Suspense fallback={null}><EditOperatorForm /></Suspense>} />
					<Route path='editTeam'     element={<Suspense fallback={null}><EditTeamForm /></Suspense>} />
					<Route path='newTeam'      element={<Suspense fallback={null}><NewTeamForm /></Suspense>} />
					<Route path='newVehicle'   element={<Suspense fallback={null}><NewVehicleForm /></Suspense>} />
					<Route path='editVehicle'  element={<Suspense fallback={null}><EditVehicleForm /></Suspense>} />
				</Route>
			</Routes>
		</>
	);
};

export default AppRoutes;
