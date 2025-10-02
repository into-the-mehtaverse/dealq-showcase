"use client";

import { cn } from "@/lib/utils";

export type PipelineTab = "all" | "active" | "draft" | "dead";

interface PipelineTabsProps {
  selectedTab: PipelineTab;
  onTabChange: (tab: PipelineTab) => void;
  className?: string;
}

const tabs: { value: PipelineTab; label: string; count?: number }[] = [
  { value: "all", label: "All Deals" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "dead", label: "Dead" },
];

export default function PipelineTabs({
  selectedTab,
  onTabChange,
  className = "",
}: PipelineTabsProps) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            selectedTab === tab.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
