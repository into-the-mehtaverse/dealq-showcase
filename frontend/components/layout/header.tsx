"use client";


import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, HelpCircle } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import SearchBar from "./search-bar";

interface HeaderProps {
  className?: string;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Header({ className }: HeaderProps) {
  const router = useRouter();

  const handleAddNewDeal = () => {
    router.push('/upload');
  };

  const handleHelp = () => {
    // TODO: Implement help functionality
    console.log('Help clicked');
  };

  return (
    <header className={`bg-background px-6 -mb-2 pt-6 ${className || ''}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Search Bar */}
        <div className="flex-1 max-w-md">
          <SearchBar placeholder="Search deals..." />
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-3">
          {/* Add New Deal Button */}
          <Button
            onClick={handleAddNewDeal}
            className="inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Deal
          </Button>

          {/* Help Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleHelp}
                className="h-9 w-9"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                sideOffset={2}
                className={cn(
                  "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance"
                )}
              >
                Help
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </Tooltip>

        </div>
      </div>
    </header>
  );
}
