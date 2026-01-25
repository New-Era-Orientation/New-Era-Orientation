import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { StudySidebar } from "@/client/components/study/StudySidebar";
import { StudyChapterProvider } from "@/client/contexts/StudyChapterContext";
import { SidebarProvider } from "@/client/contexts/SidebarContext";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <StudyChapterProvider>
                <div className="min-h-screen bg-background">
                    <DashboardHeader />
                    <div className="flex">
                        {/* Sidebar - Hidden on mobile */}
                        <div className="hidden md:block">
                            <StudySidebar />
                        </div>
                        <main className="flex-1 overflow-y-auto">{children}</main>
                    </div>
                </div>
            </StudyChapterProvider>
        </SidebarProvider>
    );
}
