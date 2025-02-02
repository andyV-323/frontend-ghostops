import { useAuth } from "react-oidc-context";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";


const Navbar = () => {
    const auth = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated);

    useEffect(() => {
        console.log("🔍 Checking authentication state...");
        console.log("Auth isAuthenticated:", auth.isAuthenticated);
        
        if (auth.isAuthenticated) {
            console.log("✅ User is logged in.");
        } else {
            console.log("❌ User is NOT logged in.");
        }

        setIsAuthenticated(auth.isAuthenticated);
    }, [auth.isAuthenticated, auth.user]); // ✅ Reactively update auth state

    const cognitoDomain = "https://us-east-1gmrbu64hs.auth.us-east-1.amazoncognito.com";
    const clientId = "6f6mo3220ct1sdu9dum08hdk96";
    const redirectUri = "http://localhost:5173";

    const signUpRedirect = () => {
      window.location.href = `${cognitoDomain}/signup?client_id=${clientId}&response_type=code&scope=email openid phone profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
    };
  
    const signOutRedirect = async () => {
      console.log("🚪 Logging out user...");
      
      // Remove the user session locally
      await auth.removeUser();
      
      // Redirect to Cognito logout endpoint
      const logoutUri = "http://localhost:5173"; // Change this for production
      window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };
  

    

    return (
      <nav style={{ display: "flex", justifyContent: "space-between", padding: "10px" }}>
      {!isAuthenticated && (
          <div>
              <Link to="/about" style={{ marginLeft: "10px" }}>About</Link>
              <Link to="/features" style={{ marginLeft: "10px" }}>Features</Link>
              <Link to="/contact" style={{ marginLeft: "10px" }}>Contact</Link>
          </div>
      )}
  
      <div>
          {!isAuthenticated ? (
              <>
                  <button onClick={signUpRedirect} style={{ marginRight: '10px' }}>Sign up</button>
                  <button onClick={() => auth.signinRedirect()} style={{ marginRight: '10px' }}>Sign in</button>
              </>
          ) : (
              <>
                  <span style={{ marginRight: "10px" }}>👤 {auth.user?.profile.email || "User"}</span>

                  <button onClick={signOutRedirect} style={{ marginRight: '10px' }}>Sign out</button>
              </>
          )}
      </div>
  </nav>
  
    );
};

export default Navbar;