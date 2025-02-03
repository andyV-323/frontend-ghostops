import { useAuth } from "react-oidc-context";
import { useEffect, useState } from "react";
import { Navbar, Image, Button } from "@material-tailwind/react";

const Header = () => {
  const auth = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated);
  }, [auth.isAuthenticated, auth.user]);

  const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;

  const signUpRedirect = () => {
    window.location.href = `${cognitoDomain}/signup?client_id=${clientId}&response_type=code&scope=email openid phone profile&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const signOutRedirect = async () => {
    await auth.removeUser();
    const logoutUri = import.meta.env.VITE_LOGOUT_URI;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <div className="bg-black w-full">
      <header className="w-full">
        <Navbar className="flex flex-col md:flex-row items-center justify-between top-0 left-0 w-full z-50 px-6 py-4 bg-black border-none shadow-none">
          
          {/* Left Section: Logo */}
          {!isAuthenticated && (
           <img
           src="/icons/GhostOpsAI.svg"
           alt="GhostOpsAI Logo"
           className="h-5  md:h-10 lg:h-20 w-auto"
         />
          )}

          {/* Right Section: Login, Signup, and User Info */}
          <div className="flex items-center space-x-4 ml-auto">
            {!isAuthenticated ? (
              <>
                <button 
                  onClick={() => auth.signinRedirect()} 
                  className="text-white hover:text-fontz py-2 px-6 text-sm md:py-3 md:px-8 md:text-base lg:py-4 lg:px-10 lg:text-lg"
                >
                  Sign in
                </button>
                <Button onClick={signUpRedirect} className="bg-btn hover:bg-highlight hover:text-white text-black font-semibold py-3 px-6 md:py-3 md:px-8 rounded-lg shadow-lg transition duration-300 ease-in-out">
                  Sign up
                </Button>
              </>
            ) : (
              <>
                <span className="text-white text-sm md:text-base lg:text-lg">
                  👤 {auth.user?.profile.email || "User"}
                </span>
                <Button onClick={signOutRedirect} className="btn">
                  Sign out
                </Button>
              </>
            )}
          </div>
        </Navbar>
      </header>
    </div>
  );
};

export default Header;
