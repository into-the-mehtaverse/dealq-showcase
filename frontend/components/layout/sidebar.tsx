"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

import { ChevronDown, BarChart3, FileText, Columns3, Search, Receipt, Zap, Settings } from "lucide-react";
import SidebarHeaderComponent from "./sidebar-header";
import UserProfile from "./user-profile";

// Types for modular navigation
interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
  subItems?: {
    id: string;
    label: string;
    href: string;
    icon: string;
    description?: string;
  }[];
}

interface SidebarProps {
  navigationItems?: NavigationItem[];
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

// Default navigation items
const defaultNavigationItems: NavigationItem[] = [
  {
    id: "upload",
    label: "Upload",
    href: "/dashboard/deals",
    icon: "BarChart3",
    description: "View and manage your recent deals"
  },
  {
    id: "pipeline",
    label: "Pipeline",
    href: "/dashboard/pipeline",
    icon: "Columns3",
    description: "Manage your deal pipeline"
  },
  {
    id: "templates",
    label: "Templates",
    href: "/dashboard/models",
    icon: "FileText",
    description: "Access your model templates"
  },
  // {
  //   id: "tools",
  //   label: "Tools",
  //   href: "/tools",
  //   icon: "Zap",
  //   description: "Analysis and research tools",
  //   subItems: [
  //     {
  //       id: "underwrite",
  //       label: "Playground",
  //       href: "/dashboard/underwrite",
  //       icon: "Receipt",
  //       description: "Financial underwriting tools"
  //     },
  //     {
  //       id: "extract",
  //       label: "Extract",
  //       href: "/tools/extract",
  //       icon: "FileText",
  //       description: "Extract data from documents"
  //     },
  //     {
  //       id: "market-research",
  //       label: "Market Research",
  //       href: "/tools/market-research",
  //       icon: "Search",
  //       description: "Market research tools"
  //     }
  //   ]
  // }
];



// Main Sidebar Component
export default function Sidebar({
  navigationItems = defaultNavigationItems,
  userInfo,
  onLogout
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const toggleSubMenu = (itemId: string) => {
    setOpenSubMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleMenuButtonClick = (item: NavigationItem) => {
    if (item.subItems) {
      // Only toggle if this is the same menu item being clicked
      toggleSubMenu(item.id);
    } else {
      // Close all submenus when clicking on a main menu item
      setOpenSubMenus(new Set());
      handleNavigate(item.href);
    }
  };

  // Keep submenu open when clicking on submenu items
  const handleSubMenuButtonClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleNavigate(href);
  };

  return (
    <SidebarComponent>
      <SidebarHeaderComponent />

                          <SidebarContent className="px-3">
          <SidebarMenu>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const isSubMenuOpen = openSubMenus.has(item.id);

              // Get the icon component based on the icon name
              const getIconComponent = (iconName: string) => {
                switch (iconName) {
                  case 'BarChart3':
                    return <BarChart3 className="h-4 w-4" />;
                  case 'Zap':
                    return <Zap className="h-4 w-4" />;
                  case 'FileText':
                    return <FileText className="h-4 w-4" />;
                  case 'Columns3':
                    return <Columns3 className="h-4 w-4" />;
                  case 'Receipt':
                    return <Receipt className="h-4 w-4" />;
                  case 'Search':
                    return <Search className="h-4 w-4" />;
                  default:
                    return <span className="text-lg">{item.icon}</span>;
                }
              };

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleMenuButtonClick(item)}
                    isActive={isActive}
                    tooltip={item.description}
                    className="text-white"
                  >
                    {getIconComponent(item.icon)}
                    <span>{item.label}</span>
                    {item.subItems && (
                      <ChevronDown className={`h-4 w-4 ml-auto transition-transform text-white ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                    )}
                  </SidebarMenuButton>

                  {item.subItems && isSubMenuOpen && (
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');

                        return (
                          <SidebarMenuSubItem key={subItem.id}>
                            <SidebarMenuSubButton
                              href={subItem.href}
                              isActive={isSubActive}
                              onClick={(e) => handleSubMenuButtonClick(subItem.href, e)}
                              className="text-white"
                            >
                              {getIconComponent(subItem.icon)}
                              <span>{subItem.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

      <SidebarFooter>
        <div className="p-2 space-y-2">
          <SidebarMenuButton
            onClick={() => router.push('/dashboard/preferences')}
            tooltip="Manage your preferences"
            className="text-white"
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </SidebarMenuButton>
          <SidebarSeparator />
          <UserProfile userInfo={userInfo} onLogout={onLogout} />
        </div>
      </SidebarFooter>
    </SidebarComponent>
  );
}
