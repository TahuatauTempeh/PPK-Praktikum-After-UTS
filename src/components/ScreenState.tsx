import React from 'react';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';

export type ScreenStatus = 'loading' | 'error' | 'empty' | 'ready';

interface ScreenStateProps {
  status: ScreenStatus;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyIcon?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  children?: React.ReactNode;
}

export function ScreenState({
  status,
  loadingMessage,
  errorTitle,
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  children,
}: ScreenStateProps) {
  if (status === 'loading') {
    return <LoadingState message={loadingMessage} />;
  }
  if (status === 'error') {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage ?? 'Terjadi kesalahan.'}
        onRetry={onRetry}
      />
    );
  }
  if (status === 'empty') {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle ?? 'Belum ada data'}
        subtitle={emptySubtitle}
      />
    );
  }
  return <>{children ?? null}</>;
}
