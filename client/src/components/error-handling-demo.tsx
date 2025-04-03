import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Bug, RefreshCw, Server, Terminal, XCircle } from 'lucide-react';

/**
 * Component that demonstrates various error handling scenarios
 */
export const ErrorHandlingDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Error Handling Demonstration</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundaryExample />
        <ErrorHookExample />
        <ToastErrorExample />
        <AsyncErrorExample />
      </div>
    </div>
  );
};

/**
 * Example of using ErrorBoundary to catch rendering errors
 */
const ErrorBoundaryExample: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);
  
  // This will cause a rendering error when shouldError is true
  const BuggyComponent = () => {
    if (shouldError) {
      throw new Error('This is a simulated render error!');
    }
    return <p className="mt-2">Component is rendering normally. Click the button to trigger an error.</p>;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bug className="mr-2 h-5 w-5 text-red-500" />
          Error Boundary Example
        </CardTitle>
        <CardDescription>
          Demonstrates how ErrorBoundary catches rendering errors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorBoundary>
          <BuggyComponent />
        </ErrorBoundary>
      </CardContent>
      <CardFooter>
        <Button 
          variant={shouldError ? 'default' : 'destructive'} 
          onClick={() => setShouldError(!shouldError)}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {shouldError ? 'Reset Component' : 'Trigger Render Error'}
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * Example of using the useErrorHandler hook
 */
const ErrorHookExample: React.FC = () => {
  const { error, setError, clearError } = useErrorHandler();
  
  const handleTriggerError = () => {
    setError(new Error('This is a manually triggered error via the error hook.'), {
      context: 'ErrorHookExample',
      timestamp: new Date().toISOString(),
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Terminal className="mr-2 h-5 w-5 text-blue-500" />
          Error Hook Example
        </CardTitle>
        <CardDescription>
          Demonstrates the useErrorHandler hook for manual error management
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error.hasError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Detected</AlertTitle>
            <AlertDescription>
              <p>{error.message}</p>
              {error.details && (
                <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <p className="mt-2">No errors currently. Click the button to trigger an error.</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="destructive" 
          onClick={handleTriggerError}
          disabled={error.hasError}
          className="flex items-center"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Trigger Error
        </Button>
        {error.hasError && (
          <Button 
            onClick={clearError}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Error
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

/**
 * Example of using Toast notifications for errors
 */
const ToastErrorExample: React.FC = () => {
  const { toast } = useToast();
  
  const showSuccessToast = () => {
    toast({
      title: 'Operation Successful',
      description: 'The action was completed successfully.',
      variant: 'success',
    });
  };
  
  const showErrorToast = () => {
    toast({
      title: 'Error Occurred',
      description: 'Failed to complete the operation. Please try again.',
      variant: 'destructive',
    });
  };
  
  const showWarningToast = () => {
    toast({
      title: 'Warning',
      description: 'This action might have unexpected consequences.',
      variant: 'warning',
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
          Toast Notification Example
        </CardTitle>
        <CardDescription>
          Demonstrates using Toast notifications for different scenarios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mt-2">Click the buttons below to trigger different types of toast notifications.</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          variant="default" 
          onClick={showSuccessToast}
          className="flex items-center"
        >
          Success Toast
        </Button>
        <Button 
          variant="destructive" 
          onClick={showErrorToast}
          className="flex items-center"
        >
          Error Toast
        </Button>
        <Button 
          variant="outline" 
          onClick={showWarningToast}
          className="flex items-center"
        >
          Warning Toast
        </Button>
      </CardFooter>
    </Card>
  );
};

/**
 * Example of handling async errors
 */
const AsyncErrorExample: React.FC = () => {
  const { error, setError, clearError, withErrorHandling } = useErrorHandler();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate a successful API call
  const handleSuccessfulCall = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'API Call Successful',
        description: 'Data was retrieved successfully.',
        variant: 'success',
      });
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simulate a failing API call
  const handleFailingCall = withErrorHandling(async () => {
    setIsLoading(true);
    // Simulate API call that fails
    await new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network request failed: API endpoint is unavailable')), 1500)
    );
    setIsLoading(false);
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Server className="mr-2 h-5 w-5 text-purple-500" />
          Async Error Handling
        </CardTitle>
        <CardDescription>
          Demonstrates handling errors in asynchronous operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error.hasError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Error</AlertTitle>
            <AlertDescription>
              <p>{error.message}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="mt-2">Simulate API calls and see how errors are handled.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          variant="default" 
          onClick={handleSuccessfulCall}
          disabled={isLoading}
          className="flex items-center"
        >
          {isLoading ? 'Loading...' : 'Successful Call'}
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleFailingCall}
          disabled={isLoading}
          className="flex items-center"
        >
          {isLoading ? 'Loading...' : 'Failing Call'}
        </Button>
        {error.hasError && (
          <Button 
            variant="outline" 
            onClick={clearError}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Error
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};