import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetOverlay,
} from "@/components/ui/sheet";

export const CreateNewEvaluator: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm_sleek">
            Create New Evaluator
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => handleOptionSelect("Custom")}>
            Custom
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>LLM As a Judge</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => handleOptionSelect("Humor")}>
              Humor
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOptionSelect("SQL")}>
              SQL
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOptionSelect("Moderation")}>
              Moderation
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOptionSelect("Language")}>
              Language
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOptionSelect("Summary")}>
              Summary
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>RAG</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => handleOptionSelect("ContextRecall")}
            >
              ContextRecall
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleOptionSelect("AnswerSimilarity")}
            >
              AnswerSimilarity
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleOptionSelect("Source properly")}
            >
              Source properly
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Composite</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => handleOptionSelect("String contains")}
            >
              String contains
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleOptionSelect("ValidJSON")}>
              ValidJSON
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetOverlay className="bg-black opacity-0" />
        <SheetContent side="right" className="h-full w-full min-w-[500px]">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-lg font-medium">
                Drawer Title
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <p>
                  Once upon a time, in a far-off land, there was a very lazy
                  king who spent all day lounging on his throne. One day, his
                  advisors came to him with a problem: the kingdom was running
                  out of money.
                </p>
                <p>
                  Jokester began sneaking into the castle in the middle of the
                  night and leaving jokes all over the place: under the king's
                  pillow, in his soup, even in the royal toilet. The king was
                  furious, but he couldn't seem to stop Jokester.
                </p>
                <p>
                  And then, one day, the people of the kingdom discovered that
                  the jokes left by Jokester were so funny that they couldn't
                  help but laugh. And once they started laughing, they couldn't
                  stop.
                </p>
                <p>
                  The king thought long and hard, and finally came up with a
                  brilliant plan: he would tax the jokes in the kingdom.
                </p>
                <blockquote>
                  "After all," he said, "everyone enjoys a good joke, so it's\n
                  only fair that they should pay for the privilege."
                </blockquote>
                <h3>The Joke Tax</h3>
                <p>
                  The king's subjects were not amused. They grumbled and
                  complained, but the king was firm:
                </p>
                <ul>
                  <li>1st level of puns: 5 gold coins</li>
                  <li>2nd level of jokes: 10 gold coins</li>
                  <li>3rd level of one-liners : 20 gold coins</li>
                </ul>
                <p>
                  As a result, people stopped telling jokes, and the kingdom
                  fell into a gloom. But there was one person who refused to let
                  the king's foolishness get him down: a court jester named
                  Jokester.
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
