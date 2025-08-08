import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
    <div className="settings-container">
      {/* Coming Soon Banner */}
      <div className="settings-warning-banner border-b p-3">
        <div className="text-center text-sm font-medium">
          🚧 Coming Soon - Credits system is currently under development
        </div>
      </div>

      {/* Current Balance */}
      <div className="settings-section-header">
        <div className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <h2 className="settings-title">Credits</h2>
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
        <div className="settings-section-content border-b border-border md:border-r">
          <h3 className="settings-title mb-3">Buy Credits</h3>
          <div className="space-y-1">
            <Button className="settings-btn-small w-full" disabled>
              Add Credits
            </Button>
            <Button
              variant="outline"
              className="settings-btn-small w-full justify-start"
            >
              <span>View Usage</span>
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Auto Top-Up */}
        <div className="settings-section-content border-b border-t border-border md:border-l-0 md:border-t-0">
          <div className="mb-3 flex flex-row items-center justify-between">
            <h3 className="settings-title">Auto Top-Up</h3>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoTopUpEnabled}
                onCheckedChange={setAutoTopUpEnabled}
              />
              <Settings className="h-3 w-3" />
              <span className="settings-small">Enable</span>
            </div>
          </div>
          <p className="settings-description">
            Automatically purchase credits when your balance is below a certain
            threshold. Your most recent payment method will be used.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="settings-section-content">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h3 className="settings-title">Recent Transactions</h3>
          <Button variant="outline" className="settings-btn-small">
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
                  <span className="settings-small">Get invoice</span>
                  <FileText className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="settings-muted py-4 text-center">
              No transactions yet
            </div>
          )}
        </div>

        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            <Button
              variant="ghost"
              className="settings-btn-small"
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
              className="settings-btn-small"
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
