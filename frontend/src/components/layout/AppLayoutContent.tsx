import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

export default function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 pl-64">
          {children}
        </main>
      </div>
    </div>
  );
}
