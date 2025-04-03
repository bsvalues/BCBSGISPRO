import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { createToastTypes } from '@/hooks/use-toast';

// Component that throws an error when render is called
const BuggyComponent: React.FC = () => {
  throw new Error('This is a simulated error in the component!');
  return <div>This won't render</div>;
};

// Component with a button that triggers an error
const ErrorButton: React.FC = () => {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(prevCount => {
      if (prevCount >= 2) {
        throw new Error('This is a simulated error from a button click!');
      }
      return prevCount + 1;
    });
  };
  
  return (
    <div>
      <p className="mb-2">Clicks: {count}</p>
      <Button onClick={handleClick}>
        {count < 2 ? 'Click me (safe)' : 'Click me (will error)'}
      </Button>
    </div>
  );
};

// Error handling demo
export const ErrorHandlingDemo: React.FC = () => {
  const { handleError, handleApiError, errorState, clearError } = useErrorHandler();
  const toast = createToastTypes();
  
  const simulateJsError = () => {
    try {
      // Deliberately cause a TypeError
      const obj = null;
      // @ts-ignore - deliberate error for demonstration
      const value = obj.nonExistentProperty;
      return value;
    } catch (error) {
      if (error instanceof Error) {
        handleError(error, 'simulateJsError');
      }
    }
  };
  
  const simulateApiError = async () => {
    // Simulate API call that fails
    const fakeApiCall = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error('API request failed with status 500'));
      }, 1000);
    });
    
    await handleApiError(fakeApiCall, {
      source: 'API Demo',
      customErrorMessage: 'Could not fetch data from the server.',
    });
  };
  
  const showSuccessToast = () => {
    toast.success({
      title: 'Success!',
      description: 'Operation completed successfully.',
    });
  };
  
  const showErrorToast = () => {
    toast.error({
      title: 'Error!',
      description: 'Something went wrong.',
    });
  };
  
  const showWarningToast = () => {
    toast.warning({
      title: 'Warning!',
      description: 'This action may have consequences.',
    });
  };
  
  const showInfoToast = () => {
    toast.info({
      title: 'Information',
      description: 'This is a helpful message.',
    });
  };
  
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Error Handling System Demo</h1>
      
      {/* Error State Display */}
      {errorState.hasError && (
        <Alert 
          variant="destructive"
          title="Current Error State"
          onClose={clearError}
        >
          <pre className="text-xs overflow-auto p-2 bg-red-50 rounded border border-red-200 max-h-32">
            {errorState.error?.toString()}
          </pre>
        </Alert>
      )}
      
      {/* JS Error Demo */}
      <Card>
        <CardHeader>
          <CardTitle>JavaScript Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demonstrates catching and handling a JavaScript error with useErrorHandler.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={simulateJsError} variant="destructive">
            Trigger JS Error
          </Button>
        </CardFooter>
      </Card>
      
      {/* API Error Demo */}
      <Card>
        <CardHeader>
          <CardTitle>API Error Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demonstrates handling a failed API call using handleApiError.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={simulateApiError} variant="destructive">
            Simulate API Error
          </Button>
        </CardFooter>
      </Card>
      
      {/* Error Boundary Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demonstrates how ErrorBoundary catches rendering errors.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Component with Error:</h3>
              <ErrorBoundary
                fallback={
                  <Alert
                    variant="destructive"
                    title="Component Error"
                  >
                    <p>This component failed to render.</p>
                  </Alert>
                }
              >
                <BuggyComponent />
              </ErrorBoundary>
            </div>
            <div>
              <h3 className="font-medium mb-2">Interactive Error:</h3>
              <ErrorBoundary
                fallback={(error, _, reset) => (
                  <Alert variant="destructive" title="Interactive Error">
                    <p className="mb-2">{error.message}</p>
                    <Button size="sm" onClick={reset}>Reset</Button>
                  </Alert>
                )}
              >
                <ErrorButton />
              </ErrorBoundary>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Toast Notifications Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This demonstrates the different types of toast notifications.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={showSuccessToast} variant="success">Success Toast</Button>
            <Button onClick={showErrorToast} variant="destructive">Error Toast</Button>
            <Button onClick={showWarningToast} variant="warning">Warning Toast</Button>
            <Button onClick={showInfoToast} variant="outline">Info Toast</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};