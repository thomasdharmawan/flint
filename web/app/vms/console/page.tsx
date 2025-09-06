"use client"
import dynamic from 'next/dynamic';
import { PageLayout } from '@/components/shared/page-layout';
import { useSearchParams } from 'next/navigation';

const VMSerialConsole = dynamic(
  () => import('@/components/vm-serial-console').then(mod => mod.VMSerialConsole),
  { ssr: false }
);

export default function ConsolePage() {
  const searchParams = useSearchParams();
  const vmUuid = searchParams.get('id'); // ✅ extract vmUuid safely

  return (
    <PageLayout
      title="Serial Console"
      description="Connect to the VM's serial console for direct access"
    >
    <VMSerialConsole vmUuid={vmUuid || ''} />
    </PageLayout>
  );
}