"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, LogIn } from "lucide-react";

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
}

interface UserProfileProps {
  userInfo?: UserInfo;
  onLogout?: () => void;
}

export default function UserProfile({
  userInfo,
  onLogout
}: UserProfileProps) {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/landing/login');
  };

  if (!userInfo) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">👤</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-white">Guest User</p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSignIn}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 h-auto p-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={userInfo.avatar} />
            <AvatarFallback className="text-xs">
              {userInfo.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-white truncate">{userInfo.name}</p>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
