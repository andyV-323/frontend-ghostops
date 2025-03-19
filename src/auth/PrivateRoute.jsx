import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { PropTypes } from "prop-types";

//Redirects to landing page if user is NOT authenticated
const PrivateRoute = ({ children }) => {
	const auth = useAuth();

	if (!auth.isAuthenticated) {
		return (
			<Navigate
				to='/'
				replace
			/>
		);
	}

	return children;
};
PrivateRoute.propTypes = {
	children: PropTypes.node.isRequired,
};

export default PrivateRoute;
