import { useEffect, useState, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Database } from "@/supabase/database.types";

const AcceptTermsModal = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const user = useUser();
  const supabase = useSupabaseClient<Database>();
  const jawn = useJawnClient();

  const handleAcceptTerms = useCallback(async () => {
    await jawn.POST("/v1/organization/user/accept_terms");
    supabase.auth.refreshSession();
    setShowTermsModal(false);
  }, [jawn, supabase]);

  const handleAccept = useCallback(async () => {
    setLoading(true);
    await handleAcceptTerms();
    setLoading(false);
  }, [handleAcceptTerms]);

  useEffect(() => {
    if (user && !user.user_metadata.accepted_terms_date) {
      setShowTermsModal(true);
    }
  }, [user]);

  const handleCheckedChange = useCallback((checked: boolean) => {
    setTermsAccepted(checked);
  }, []);

  return (
    <Dialog open={showTermsModal} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            We&apos;ve updated our Terms of Service
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            As Helicone continues to evolve, we&apos;ve updated our terms to
            better serve you. Your trust is paramount to us. Please review our
            updated terms to continue using Helicone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={handleCheckedChange}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none flex items-center gap-2"
            >
              I accept the
              <Link
                href="https://helicone.ai/terms"
                target="_blank"
                className="text-primary hover:underline underline"
              >
                Terms of Service
              </Link>
              and
              <Link
                href="https://helicone.ai/privacy"
                target="_blank"
                className="text-primary hover:underline underline"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAccept} disabled={loading || !termsAccepted}>
            {loading ? "Processing..." : "Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default memo(AcceptTermsModal);
