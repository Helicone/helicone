import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Small, XSmall, Muted } from "@/components/ui/typography";
import {
  RefreshCcw,
  Settings,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "@/styles/settings.css";

const CreditsSettings: NextPageWithLayout<void> = () => {
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data - replace with actual data fetching
  const currentBalance = 0;
  const transactions: any[] = [];

  return (
    <div className="flex w-full max-w-6xl flex-col border border-border bg-background">
      {/* Coming Soon Banner */}
      <div className="border-b border-yellow-200 bg-yellow-50 p-3 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
        <div className="text-center text-sm font-medium">
          🚧 Coming Soon - Credits system is currently under development
        </div>
      </div>

      {/* Current Balance */}
      <div className="border-b border-border p-4">
        <div className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <Small className="font-semibold">Credits</Small>
          </div>
          <Button variant="ghost" size="icon">
            <RefreshCcw className="h-3 w-3" />
          </Button>
        </div>
        <div className="mt-2 text-2xl font-bold">
          ${currentBalance.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Buy Credits */}
        <div className="border-b border-border p-4 md:border-r">
          <Small className="mb-3 font-semibold">Buy Credits</Small>
          <div className="space-y-1">
            <Button size="sm" className="w-full" disabled>
              Add Credits
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <span>View Usage</span>
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Auto Top-Up */}
        <div className="border-b border-t border-border p-4 md:border-l-0 md:border-t-0">
          <div className="mb-3 flex flex-row items-center justify-between">
            <Small className="font-semibold">Auto Top-Up</Small>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoTopUpEnabled}
                onCheckedChange={setAutoTopUpEnabled}
              />
              <Settings className="h-3 w-3" />
              <XSmall>Enable</XSmall>
            </div>
          </div>
          <Muted className="text-xs">
            Automatically purchase credits when your balance is below a certain
            threshold. Your most recent payment method will be used.
          </Muted>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-4">
        <div className="mb-4 flex flex-row items-center justify-between">
          <Small className="font-semibold">Recent Transactions</Small>
          <Button variant="outline" size="sm">
            <span>Payment History</span>
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-1">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b pb-1 last:border-b-0 last:pb-0"
              >
                <div className="text-sm">{transaction.date}</div>
                <div className="text-sm font-medium">${transaction.amount}</div>
                <Button variant="ghost" size="sm">
                  <span>Get invoice</span>
                  <FileText className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">
              <Muted>No transactions yet</Muted>
            </div>
          )}
        </div>

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {currentPage}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

CreditsSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default CreditsSettings;
