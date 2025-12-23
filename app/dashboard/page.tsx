import { requireAuthForPage } from '@/lib/utils/validation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default async function DashboardPage() {
  const user = await requireAuthForPage();

  return (
    <DashboardLayout userEmail={user.email}>
      <DashboardContent />
    </DashboardLayout>
  );
}

