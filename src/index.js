import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthContextProvider } from "./context/AuthContext";
import { ChatContextProvider } from "./context/ChatContext";
import { CallContextProvider } from "./context/CallContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthContextProvider>
    <ChatContextProvider>
      <CallContextProvider>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </CallContextProvider>
    </ChatContextProvider>
  </AuthContextProvider>
);
