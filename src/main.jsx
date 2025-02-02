import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import App from "./App";

const cognitoAuthConfig = {
    authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_GMrBu64Hs", // Use the issuer URL
    client_id: "6f6mo3220ct1sdu9dum08hdk96",
    redirect_uri: "http://localhost:5173",
    response_type: "code",
    scope: "email openid phone profile",

}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <AuthProvider {...cognitoAuthConfig}>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
