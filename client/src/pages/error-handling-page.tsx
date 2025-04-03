import React from 'react';
import { ErrorHandlingDemo } from '@/components/error-handling-demo';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const ErrorHandlingPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="container mx-auto py-8">
          <ErrorHandlingDemo />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
};