import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const AuthRedirector = () => {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated) {
            console.log("✅ User logged in, redirecting to Dashboard...");
            navigate("/dashboard");
        }
    }, [auth.isAuthenticated, navigate]);

    return null; // ✅ This component only handles redirection
};

export default AuthRedirector;
