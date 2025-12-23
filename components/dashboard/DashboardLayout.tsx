import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function DashboardLayout({ children, userEmail }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-8 px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

