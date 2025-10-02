"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Upload, CheckCircle, Circle, FileText, BarChart3, Calculator } from "lucide-react";
import SidebarHeaderComponent from "@/components/layout/sidebar-header";
import UserProfile from "@/components/layout/user-profile";

interface UploadSidebarProps {
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

// Progress steps configuration
const progressSteps: Array<{
  id: string;
  label: string;
  href: string | null;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "upload",
    label: "Upload",
    href: "/upload",
    icon: Upload,
    description: "Upload your documents"
  },
  {
    id: "verify-details",
    label: "Verify Details",
    href: "/upload/details",
    icon: FileText,
    description: "Verify property details"
  },
  {
    id: "verify-rent-roll",
    label: "Verify Rent Roll",
    href: "/upload/rr",
    icon: BarChart3,
    description: "Verify rent roll data"
  },
  {
    id: "verify-t12",
    label: "Verify T-12",
    href: "/upload/t-12",
    icon: Calculator,
    description: "Verify T-12 data"
  },
  {
    id: "model-ready",
    label: "Model Ready",
    href: null, // Not clickable
    icon: CheckCircle,
    description: "Your model is ready"
  }
];

export default function UploadSidebar({
  userInfo,
  onLogout
}: UploadSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleReturnHome = () => {
    router.push('/dashboard/deals');
  };

  const getCurrentStep = () => {
    if (pathname === '/upload') return 0;
    if (pathname.includes('/upload/details')) return 1;
    if (pathname.includes('/upload/rr')) return 2;
    if (pathname.includes('/upload/t-12')) return 3;
    return 0;
  };

  const currentStep = getCurrentStep();

  const getStepIcon = (step: typeof progressSteps[0], index: number) => {
    const IconComponent = step.icon;

    if (index < currentStep) {
      // Completed step
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (index === currentStep) {
      // Current step
      return <IconComponent className="h-4 w-4 text-blue-600" />;
    } else {
      // Future step
      return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepStatus = (index: number) => {
    if (index < currentStep) {
      return "completed";
    } else if (index === currentStep) {
      return "current";
    } else {
      return "pending";
    }
  };

  return (
    <SidebarComponent>
      <SidebarHeaderComponent />

      <SidebarContent className="px-3">
        {/* Return to Home Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="w-full items-center gap-2 text-white"
            onClick={handleReturnHome}
          >
            <Home className="h-4 w-4" />
            <span>Return</span>
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <h3 className="text-sm font-medium items-center justify-center text-white mb-4 px-2">
            Upload Progress
          </h3>
          <SidebarMenu>
            {progressSteps.map((step, index) => {
              const status = getStepStatus(index);
              const isActive = step.href ? (pathname === step.href || pathname.startsWith(step.href + '/')) : false;
              const isClickable = step.href !== null;

              return (
                <div key={step.id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={isClickable ? () => router.push(step.href!) : undefined}
                      isActive={isActive}
                      tooltip={step.description}
                      className={`transition-all duration-200 text-white ${
                        !isClickable ? 'cursor-default opacity-60' :
                        status === 'completed' ? 'text-green-400' :
                        status === 'current' ? 'text-blue-400' :
                        'text-gray-300'
                      }`}
                    >
                      {getStepIcon(step, index)}
                      <span className="flex-1 text-left">{step.label}</span>
                      {status === 'completed' && (
                        <Badge variant="secondary" className="text-xs">
                          Done
                        </Badge>
                      )}
                                      </SidebarMenuButton>
                </SidebarMenuItem>
              </div>
              );
            })}
          </SidebarMenu>
        </div>

        {/* Progress Indicator */}
        <div className="px-2 mb-6">
          <div className="flex items-center justify-between text-xs text-white mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentStep + 1) / progressSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / progressSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="p-2">
          <UserProfile userInfo={userInfo} onLogout={onLogout} />
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
