import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TooltipLegacy({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
