import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { RabbitIcon, TurtleIcon } from "lucide-react";
import { Database } from "@/supabase/database.types";
import { useCallback } from "react";
import { signOut } from "@/components/shared/utils/utils";
import { useRouter } from "next/navigation";

const OnboardingDemoModal = ({
  open,
  quickStart,
  quickTour,
}: {
  open: boolean;
  quickStart: () => void;
  quickTour: () => void;
}) => {
  const jawn = useJawnClient();
  const supabaseClient = useSupabaseClient<Database>();
  const router = useRouter();
  const handleSignOut = useCallback(() => {
    signOut(supabaseClient).then(() => router.push("/"));
  }, [supabaseClient, router]);

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-11/12 sm:max-w-2xl gap-8 rounded-md"
        closeButton={false}
      >
        <DialogHeader className="space-y-2">
          <div className="flex justify-between items-center">
            <DialogTitle>Welcome to Helicone!</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={quickStart}
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <TurtleIcon className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-4">
                  Get integrated
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Jump straight to integrating Helicone into your LLM app
                </p>
              </div>
            </div>
          </div>
          <div
            className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={quickTour}
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <RabbitIcon className="w-6 h-6 text-blue-500" />
                <div className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                  2 Min Tour
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-4">
                  Watch how it works
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  See how top companies monitor and improve their LLM apps with
                  Helicone
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDemoModal;
