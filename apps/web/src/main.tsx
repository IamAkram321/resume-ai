import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { setBaseUrl, setAuthTokenGetter } from "@resume-ai/api-client-react";

setBaseUrl("https://resume-ai-api-7965.onrender.com");

setAuthTokenGetter(async () => {
  return await (window as any).Clerk?.session?.getToken?.() ?? null;
});

createRoot(document.getElementById("root")!).render(<App />);