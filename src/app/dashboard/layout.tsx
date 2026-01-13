import { DashboardHeader } from "@/client/components/layout/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            {children}
        </div>
    );
}
