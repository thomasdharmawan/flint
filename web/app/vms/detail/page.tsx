"use client"
import dynamic from 'next/dynamic';
import { PageLayout } from '@/components/shared/page-layout';
import { ErrorBoundary } from '@/components/error-boundary';

const VMDetailView = dynamic(
  () => import('@/components/vm-detail-view').then(mod => mod.VMDetailView),
  { ssr: false }
);

export default function VMDetailPage() {
  return (
    <PageLayout
      title="Virtual Machine Details"
      description="View and manage virtual machine configuration and performance"
    >
      <ErrorBoundary>
        <VMDetailView />
      </ErrorBoundary>
    </PageLayout>
  );
}