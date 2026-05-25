import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { setBaseUrl } from "@resume-ai/api-client-react";

setBaseUrl("https://resume-ai-api-7965.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);