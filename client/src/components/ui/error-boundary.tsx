import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  /**
   * Content to be rendered inside the error boundary
   */
  children: ReactNode;
  
  /**
   * Custom fallback component to render when an error occurs
   * If not provided, a default error message will be shown
   */
  fallback?: ReactNode;
  
  /**
   * Callback function that will be called when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /**
   * Whether an error has been caught
   */
  hasError: boolean;
  
  /**
   * The error that was caught, if any
   */
  error: Error | null;
  
  /**
   * Additional error information
   */
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch and handle JavaScript errors in child components
 * 
 * This prevents the entire application from crashing when an error occurs in a component,
 * and allows us to display a fallback UI instead.
 * 
 * Usage:
 * ```jsx
 * <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <ComponentThatMightThrow />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * React lifecycle method called when an error is thrown in a descendant component
   * Use this to update state so the next render shows the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * React lifecycle method called after an error is thrown in a descendant component
   * Use this for side effects like logging the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error information
    this.setState({
      error,
      errorInfo,
    });
    
    // Call optional error callback prop
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  /**
   * Reset the error state
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    // If there's an error, render the fallback UI
    if (this.state.hasError) {
      // Use the provided fallback component if available
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, render a default error message
      return (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 flex items-start gap-3">
          <div className="text-red-500 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">An error occurred</h3>
            <p className="text-sm opacity-90 mb-2">
              {this.state.error?.message || 'The application encountered an unexpected error.'}
            </p>
            <button
              onClick={this.resetErrorBoundary}
              className="text-sm bg-white border border-red-300 hover:bg-red-100 rounded-md px-2.5 py-1 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    
    // If there's no error, render the children normally
    return this.props.children;
  }
}

export default ErrorBoundary;