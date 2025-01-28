import { Button } from "@/components/ui/button";
import { PiPlusBold } from "react-icons/pi";

export default function EvalsPanel() {
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Evals</h2>
        <Button variant="outline" size="square_icon" asPill>
          <PiPlusBold />
        </Button>
      </div>
    </div>
  );
}
