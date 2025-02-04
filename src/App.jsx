import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import {About,Features,Contact,Home, OperatorDashboard} from "./pages";
import {Header,Footer} from "./components";
import AuthRedirector from "./auth/AuthRedirector"; // New Component for Redirection

function App() {
    const auth = useAuth();

    return (
        
        <Router> 
        <Header />
            {!auth.isAuthenticated }
            <AuthRedirector /> {/*Handles redirection inside the Router */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dashboard" element={<OperatorDashboard />} />
            </Routes>
           
        </Router>
    );
}

export default App;
