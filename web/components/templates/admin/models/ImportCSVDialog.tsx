import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ImportCSVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: any[]) => void;
}

export function ImportCSVDialog({
  open,
  onOpenChange,
  onImport,
}: ImportCSVDialogProps) {
  const [csvContent, setCsvContent] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    try {
      // Simple CSV parsing for model costs
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim());
      const requiredHeaders = ["model_id", "provider", "prompt_cost", "completion_cost"];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setError(`Missing required headers: ${missingHeaders.join(", ")}`);
        return;
      }

      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }

      onImport(data);
      onOpenChange(false);
      setCsvContent("");
      setError("");
    } catch (err) {
      setError("Failed to parse CSV. Please check the format.");
    }
  };

  const sampleCSV = `model_id,provider,prompt_cost,completion_cost,creator,context_window
gpt-4-turbo,openai,0.00001,0.00003,OpenAI,128000
gpt-4-turbo,azure,0.00001,0.00003,OpenAI,128000
claude-3-opus,anthropic,0.000015,0.000075,Anthropic,200000`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Models from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Import model costs in CSV format. Required columns: model_id, provider, prompt_cost, completion_cost
            </AlertDescription>
          </Alert>

          <div>
            <Label>CSV Content</Label>
            <Textarea
              placeholder="Paste your CSV content here..."
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="font-mono text-sm"
              rows={10}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Example CSV Format:</Label>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {sampleCSV}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!csvContent.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}