
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SettingsPageContent = dynamic(
  () => import('@/components/page-specific/SettingsPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-8">
        <Skeleton className="h-[250px] w-full rounded-lg bg-card/80" />
        <Skeleton className="h-[400px] w-full rounded-lg bg-card/80" />
        <Skeleton className="h-[200px] w-full rounded-lg bg-card/80" />
      </div>
    ),
  }
);

export default function SettingsPage() {
  return (
    <AppWrapper>
      <SettingsPageContent />
    </AppWrapper>
  );
}
