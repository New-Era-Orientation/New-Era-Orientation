import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { StudySidebar } from "@/client/components/study/StudySidebar";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <div className="flex">
                <StudySidebar />
                <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
