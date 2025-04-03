import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Info, Zap } from 'lucide-react';

/**
 * Error Handling Demo Page
 * 
 * Demonstrates the various error handling components and utilities
 * available in the application.
 */
export default function ErrorHandlingPage() {
  const { toast, success, error, warning, info } = useToast();
  const [counter, setCounter] = useState(0);

  // Intentionally throw an error to demonstrate error boundary
  const causeError = () => {
    throw new Error('This is a simulated error to demonstrate the error boundary');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Error Handling Demonstration</h1>
      
      {/* Toast Notifications Demo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>
            Display various types of notifications to the user
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => 
              info({
                title: 'Information',
                description: 'This is an informational message.'
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <Info className="h-4 w-4" />
            Info Toast
          </Button>
          
          <Button
            onClick={() => 
              success({
                title: 'Success!',
                description: 'Operation completed successfully.'
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Success Toast
          </Button>
          
          <Button
            onClick={() => 
              warning({
                title: 'Warning',
                description: 'This action might be problematic.'
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Warning Toast
          </Button>
          
          <Button
            onClick={() => 
              error({
                title: 'Error',
                description: 'An error occurred during the operation.'
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <XCircle className="h-4 w-4" />
            Error Toast
          </Button>
          
          <Button
            onClick={() => 
              toast({
                title: 'Custom Toast',
                description: 'This is a custom toast with an action.',
                action: (
                  <Button size="sm" variant="outline" onClick={() => alert('Custom action')}>
                    Action
                  </Button>
                )
              })
            }
            variant="outline"
            className="flex gap-2"
          >
            <Zap className="h-4 w-4" />
            Custom Toast
          </Button>
        </CardContent>
      </Card>
      
      {/* Error Boundary Demo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Error Boundary</CardTitle>
          <CardDescription>
            Demonstrates how the application handles uncaught exceptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Clicking the button below will intentionally trigger an error to demonstrate
            how error boundaries catch and handle errors gracefully.
          </p>
          <Button 
            variant="destructive"
            onClick={causeError}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Trigger Error
          </Button>
        </CardContent>
      </Card>
      
      {/* State Error Handling Demo */}
      <Card>
        <CardHeader>
          <CardTitle>State Error Handling</CardTitle>
          <CardDescription>
            Demonstrates handling errors in state updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Current counter value: <strong>{counter}</strong>
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  setCounter((prev) => prev + 1);
                  success({
                    title: 'Counter Incremented',
                    description: `New value: ${counter + 1}`
                  });
                } catch (err) {
                  error({
                    title: 'State Update Failed',
                    description: 'Failed to increment counter.'
                  });
                }
              }}
            >
              Increment
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                if (counter <= 0) {
                  warning({
                    title: 'Operation Blocked',
                    description: 'Counter cannot go below zero.'
                  });
                  return;
                }
                try {
                  setCounter((prev) => prev - 1);
                  info({
                    title: 'Counter Decremented',
                    description: `New value: ${counter - 1}`
                  });
                } catch (err) {
                  error({
                    title: 'State Update Failed',
                    description: 'Failed to decrement counter.'
                  });
                }
              }}
            >
              Decrement
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                try {
                  setCounter(0);
                  success({
                    title: 'Counter Reset',
                    description: 'Counter has been reset to zero.'
                  });
                } catch (err) {
                  error({
                    title: 'Reset Failed',
                    description: 'Failed to reset counter.'
                  });
                }
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}