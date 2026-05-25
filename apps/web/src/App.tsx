import { useEffect, useRef } from "react";
import { ThemeProvider } from "@/lib/theme";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import type React from "react";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Analyze from "@/pages/analyze";
import Billing from "@/pages/billing";
import Pricing from "@/pages/pricing";
import NotFound from "@/pages/not-found";

// Use the publishable key directly from env in development.
const effectiveClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// Proxy URL is empty in dev (Clerk hits FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!effectiveClerkKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: [shadcn],
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(262 83% 58%)",
    colorForeground: "hsl(210 40% 96%)",
    colorMutedForeground: "hsl(215 16% 56%)",
    colorDanger: "hsl(0 72% 51%)",
    colorBackground: "hsl(240 6% 7%)",
    colorInput: "hsl(240 6% 18%)",
    colorInputForeground: "hsl(210 40% 96%)",
    colorNeutral: "hsl(240 6% 18%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-[440px] max-w-full overflow-hidden rounded-2xl",
    card: "!shadow-none !border-0 !bg-[hsl(240_6%_7%)] !rounded-none",
    footer: "!shadow-none !border-0 !bg-[hsl(240_6%_7%)] !rounded-none",
    headerTitle: "text-[hsl(210_40%_96%)]",
    headerSubtitle: "text-[hsl(215_16%_56%)]",
    socialButtonsBlockButtonText: "text-[hsl(210_40%_96%)]",
    formFieldLabel: "text-[hsl(210_40%_96%)]",
    footerActionLink: "text-[hsl(262_83%_72%)]",
    footerActionText: "text-[hsl(215_16%_56%)]",
    dividerText: "text-[hsl(215_16%_56%)]",
    identityPreviewEditButton: "text-[hsl(262_83%_72%)]",
    formFieldSuccessText: "text-[hsl(142_71%_45%)]",
    alertText: "text-[hsl(210_40%_96%)]",
    logoBox: "mt-2",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "border-[hsl(240_6%_18%)] bg-[hsl(240_6%_12%)]",
    formButtonPrimary: "bg-[hsl(262_83%_58%)] hover:bg-[hsl(262_83%_50%)]",
    formFieldInput: "bg-[hsl(240_6%_12%)] border-[hsl(240_6%_20%)] text-[hsl(210_40%_96%)]",
    footerAction: "bg-[hsl(240_6%_5%)]",
    dividerLine: "bg-[hsl(240_6%_18%)]",
    alert: "border-[hsl(240_6%_18%)]",
    otpCodeFieldInput: "bg-[hsl(240_6%_12%)] border-[hsl(240_6%_20%)]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [pathname] = useLocation();
  const redirect = `${basePath}/sign-in?redirect_url=${encodeURIComponent(pathname || "/dashboard")}`;
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to={redirect} />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) {
        qc.clear();
      }
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function AppRouter() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={effectiveClerkKey}
      proxyUrl={clerkProxyUrl || undefined}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ __internal_clerkJSUrl: "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js" } as any)}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your ResumeAI account" } },
        signUp: { start: { title: "Create your account", subtitle: "Start analyzing your resume for free" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/dashboard">
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            </Route>
            <Route path="/analyze">
              <ProtectedRoute><Analyze /></ProtectedRoute>
            </Route>
            <Route path="/billing">
              <ProtectedRoute><Billing /></ProtectedRoute>
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <AppRouter />
      </WouterRouter>
    </ThemeProvider>
  );
}
