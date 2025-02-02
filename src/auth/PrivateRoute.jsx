import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
    const auth = useAuth();
    return auth.isAuthenticated ? children : <Navigate to="/dashboard" />;
}

export default PrivateRoute;
