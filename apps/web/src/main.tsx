import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { setBaseUrl } from "@resume-ai/api-client-react";

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
setBaseUrl(apiUrl?.replace(/\/+$/, "") || null);

createRoot(document.getElementById("root")!).render(<App />);
