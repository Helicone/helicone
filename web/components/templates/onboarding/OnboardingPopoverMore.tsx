import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

export const OnboardingPopoverAccordion = ({
  icon,
  title,
  children,
  button,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  button?: {
    text: string;
    link: string;
  };
}) => {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value="item-1"
        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md px-4 max-h-[calc(100vh-20rem)] overflow-y-auto"
      >
        <AccordionTrigger className="hover:no-underline text-[13px] text-slate-700 dark:text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-[13px] text-slate-500">
          {children}
          {button && (
            <Link href={button.link} target="_blank">
              <Button
                variant="secondary"
                className="text-slate-900 dark:text-slate-100 w-full mt-4"
              >
                {button.text}
                <ArrowUpRightIcon className="h-4 w-4 text-slate-500" />
              </Button>
            </Link>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
