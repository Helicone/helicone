import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { NavLink, useSearchParams } from "react-router";
import { useEffect, useState } from "react";

export default function PiOnboardingShell() {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const jawn = useJawnClient();

  useEffect(() => {
    const piSession = searchParams.get("pi_session");
    if (piSession) {
      setSessionId(piSession);
    }
  }, [searchParams]);

  return (
    <>
      <Helmet>
        <title>PI Onboarding | Helicone</title>
      </Helmet>
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Welcome! 👋</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              This will link your new PI device to your Helicone account. Are
              you sure you want to link your account?
            </p>
            <p className="text-center text-muted-foreground">
              You can always revoke access in the{" "}
              <NavLink to="/api-keys">API keys page</NavLink>.
            </p>
            {sessionId && (
              <Button
                className="w-full"
                onClick={() => {
                  jawn.POST("/v1/pi/session", {
                    body: {
                      sessionUUID: sessionId,
                    },
                  });
                }}
              >
                Link my account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
