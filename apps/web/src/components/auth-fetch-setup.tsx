import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@resume-ai/api-client-react";

/**
 * Registers Clerk's getToken with the API client so customFetch (cover letter, tailoring, etc.)
 * always sends Authorization after the session is loaded.
 */
export function AuthFetchSetup({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isLoaded || !isSignedIn) return null;
      try {
        return (await getToken()) ?? null;
      } catch {
        return null;
      }
    });
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

  return <>{children}</>;
}
