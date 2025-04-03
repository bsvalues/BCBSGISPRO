import React from 'react';
import { ErrorHandlingDemo } from '@/components/error-handling-demo';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const ErrorHandlingPage: React.FC = () => {
  return (
    <ErrorBoundary
      fallback={<div className="p-8 text-center">Something went very wrong with the entire page!</div>}
    >
      <div className="container mx-auto py-8">
        <ErrorHandlingDemo />
      </div>
    </ErrorBoundary>
  );
};