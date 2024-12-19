import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layout/auth/authLayout";
import { useJawnClient } from "@/lib/clients/jawnHook";
import Link from "next/link";

export default function OnboardingPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get pi_session from URL query parameters
    const { pi_session } = router.query;
    if (pi_session && typeof pi_session === "string") {
      setSessionId(pi_session);
    }
  }, [router.query]);

  const jawn = useJawnClient();

  return (
    <AuthLayout>
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
              <Link href="/api-keys">API keys page</Link>.
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
    </AuthLayout>
  );
}
