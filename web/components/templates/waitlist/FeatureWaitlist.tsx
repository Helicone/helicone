import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { H3, P, Small } from "@/components/ui/typography";
import { CheckIcon, Loader2, Mail } from "lucide-react";

import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { $JAWN_API } from "@/lib/clients/jawn";

interface FeatureWaitlistProps {
  feature: string;
  title?: string;
  description?: string;
  organizationId?: string;
}

export function FeatureWaitlist({
  feature,
  title = "Join the Waitlist",
  description = "Be the first to know when this feature becomes available.",
  organizationId,
}: FeatureWaitlistProps) {
  const user = useHeliconeAuthClient();

  const email = user.user?.email ?? "";
  const [error, setError] = useState<string | null>(null);
  const { data: isOnWaitlist, refetch: refetchIsOnWaitlist } =
    $JAWN_API.useQuery("get", "/v1/public/waitlist/feature/status", {
      params: {
        query: {
          email,
          feature,
          organizationId: organizationId ?? "",
        },
      },
    });

  const { mutateAsync: addToWaitlist, isPending } = $JAWN_API.useMutation(
    "post",
    "/v1/public/waitlist/feature",
    {
      onSuccess: () => {
        refetchIsOnWaitlist();
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const result = await addToWaitlist({
      body: {
        email,
        feature,
        organizationId,
      },
    });

    if (result.error) {
      if (result.error === "already_on_waitlist") {
        setError("You're already on the waitlist for this feature");
      } else {
        setError("Failed to join waitlist. Please try again.");
      }
    }
  };

  if (isOnWaitlist?.data?.isOnWaitlist) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <H3 className="mb-2">You&lsquo;re on the list!</H3>
              <P className="text-muted-foreground">
                We&lsquo;ll notify you at <strong>{email}</strong> when this feature
                is available.
              </P>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <H3>{title}</H3>
            <Small className="text-muted-foreground">{description}</Small>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              disabled={true}
              className="w-full"
              aria-label="Email address"
            />
            {error && <Small className="text-destructive">{error}</Small>}
          </div>
          <Button
            type="submit"
            disabled={isPending || !email}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Waitlist"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
