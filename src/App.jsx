import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthRedirector from "./components/AuthRedirector"; // New Component for Redirection

function App() {
    const auth = useAuth();

    return (
        
        <Router> {/* ✅ Wrap Everything Inside Router */}
        <Navbar />
            {!auth.isAuthenticated }
            <AuthRedirector /> {/* ✅ Handles redirection inside the Router */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;
