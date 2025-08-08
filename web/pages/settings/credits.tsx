import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Settings, ExternalLink, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const CreditsSettings: NextPageWithLayout<void> = () => {
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Mock data - replace with actual data fetching
  const currentBalance = 0;
  const transactions: any[] = [];

  return (
    <div className="flex w-full max-w-6xl flex-col border border-border bg-background">
      {/* Coming Soon Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-3">
        <div className="text-sm text-yellow-800 text-center font-medium">
          🚧 Coming Soon - Credits system is currently under development
        </div>
      </div>

      {/* Current Balance */}
      <div className="border-b border-border p-4">
        <div className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Credits</h2>
          </div>
          <Button variant="ghost" size="icon">
            <RefreshCcw className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-2xl font-bold mt-2">
          ${currentBalance.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Buy Credits */}
        <div className="p-4 md:border-r border-b border-border">
          <h3 className="text-sm font-semibold mb-3">Buy Credits</h3>
          <div className="space-y-1">
            <Button className="w-full" size="sm" disabled>
              Add Credits
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <span>View Usage</span>
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Auto Top-Up */}
        <div className="p-4 border-b border-t md:border-t-0 border-border md:border-l-0">
          <div className="flex flex-row items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Auto Top-Up</h3>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={autoTopUpEnabled} 
                onCheckedChange={setAutoTopUpEnabled}
              />
              <Settings className="h-3 w-3" />
              <span className="text-xs">Enable</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically purchase credits when your balance is below a certain threshold. Your most recent payment method will be used.
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-4">
        <div className="flex flex-row items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <Button variant="outline" size="sm">
            <span>Payment History</span>
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-1">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between border-b pb-1 last:border-b-0 last:pb-0">
                <div className="text-sm">{transaction.date}</div>
                <div className="text-sm font-medium">${transaction.amount}</div>
                <Button variant="ghost" size="sm">
                  <span className="text-xs">Get invoice</span>
                  <FileText className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {transactions.length > 0 && (
          <div className="flex items-center justify-center space-x-2 mt-4">
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