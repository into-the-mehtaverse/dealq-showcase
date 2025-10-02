import { SidebarHeader } from "@/components/ui/sidebar";
import Image from "next/image";

export default function SidebarHeaderComponent() {
  return (
    <SidebarHeader>
      <div className="flex items-center justify-center p-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <Image src="/icon.svg" alt="DealQ" width={40} height={40}  className="h-10 w-10 invert" />
        </div>
        <div className="ml-2">
          <span className="text-xl font-semibold text-white pb-1">DealQ</span>
        </div>
      </div>
    </SidebarHeader>
  );
}
