
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HomePageContent = dynamic(
  () => import('@/components/page-specific/HomePageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-[420px] w-full rounded-lg bg-card/80" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 w-full bg-card/80" />
          <Skeleton className="h-16 w-full bg-card/80" />
        </div>
        <Skeleton className="h-10 w-full bg-muted" /> {/* TabsList skeleton */}
        <Skeleton className="h-[250px] w-full rounded-lg bg-card/80" /> {/* Tab content skeleton */}
      </div>
    ),
  }
);

export default function HomePage() {
  return (
    <AppWrapper>
      <HomePageContent />
    </AppWrapper>
  );
}
