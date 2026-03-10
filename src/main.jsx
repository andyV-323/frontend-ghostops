import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import cognitoAuthConfig from "@/services/AuthService";
import App from "./App";
import "./index.css";

// Catch any JS errors and display them in WebView2
window.onerror = (msg, src, line, col, err) => {
	document.getElementById("root").innerHTML = `
        <div style="color:lime;background:#0a0a0a;padding:20px;font-family:monospace;font-size:12px;">
            <div style="color:#ff4444;margin-bottom:10px;">ERROR</div>
            <div>${msg}</div>
            <div style="color:#888;margin-top:8px;">${src}</div>
            <div style="color:#888;">Line: ${line} Col: ${col}</div>
            <pre style="color:#aaa;margin-top:10px;white-space:pre-wrap;">${err?.stack || "No stack"}</pre>
        </div>
    `;
};

window.onunhandledrejection = (e) => {
	document.getElementById("root").innerHTML = `
        <div style="color:lime;background:#0a0a0a;padding:20px;font-family:monospace;font-size:12px;">
            <div style="color:#ff4444;margin-bottom:10px;">UNHANDLED PROMISE</div>
            <pre style="color:#aaa;white-space:pre-wrap;">${e.reason?.stack || e.reason}</pre>
        </div>
    `;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
	<React.StrictMode>
		<AuthProvider {...cognitoAuthConfig}>
			<App />
		</AuthProvider>
	</React.StrictMode>,
);
