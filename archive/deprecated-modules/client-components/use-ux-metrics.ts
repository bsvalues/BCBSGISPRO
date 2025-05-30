/**
 * UX Metrics Collection Hook
 * 
 * This hook provides a way to collect UX metrics from the client side
 * and send them to the server for analysis.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { UxEventType, InteractionType, PerformanceMetricType } from '../../../server/devops/ux-metrics';

// Generate a session ID if one doesn't exist
const SESSION_ID_KEY = 'uxSessionId';
const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

// Store the session ID in localStorage
const sessionId = getSessionId();

/**
 * Queue for batching events before sending them to the server
 */
const eventQueue: any[] = [];
let queueTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Process the event queue by sending events to the server
 */
const processQueue = async () => {
  if (eventQueue.length === 0) return;
  
  try {
    const events = [...eventQueue];
    eventQueue.length = 0;
    
    // Send events to the server
    await fetch('/api/ux-metrics/events/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });
  } catch (error) {
    console.error('Failed to send UX metrics', error);
    // Add the events back to the queue to try again later
    eventQueue.push(...eventQueue);
  }
};

/**
 * Add an event to the queue and schedule processing
 */
const queueEvent = (event: any) => {
  eventQueue.push(event);
  
  // If there's no timer running, start one
  if (!queueTimer) {
    queueTimer = setTimeout(() => {
      queueTimer = null;
      processQueue();
    }, 5000); // Process queue every 5 seconds
  }
};

/**
 * Hook for UX metrics collection
 * 
 * @param userId Optional user ID for tracking authenticated users
 */
export function useUxMetrics(userId?: string) {
  const [location] = useLocation();
  const previousLocation = useRef<string | null>(null);
  
  // Track page views
  useEffect(() => {
    if (location !== previousLocation.current) {
      previousLocation.current = location;
      
      queueEvent({
        type: UxEventType.PAGE_VIEW,
        sessionId,
        userId,
        page: location,
      });
      
      // Also track page load performance
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        queueEvent({
          type: UxEventType.PERFORMANCE,
          sessionId,
          userId,
          page: location,
          subtype: PerformanceMetricType.PAGE_LOAD,
          duration: navigationEntry.loadEventEnd - navigationEntry.startTime,
          details: {
            dnsTime: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
            connectionTime: navigationEntry.connectEnd - navigationEntry.connectStart,
            responseTime: navigationEntry.responseEnd - navigationEntry.responseStart,
            domTime: navigationEntry.domComplete - navigationEntry.domLoading,
          },
        });
      }
    }
  }, [location, userId]);
  
  // Set up performance monitoring for resource loading
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Only track resources that took more than 500ms to load
          if (resourceEntry.duration > 500) {
            queueEvent({
              type: UxEventType.PERFORMANCE,
              sessionId,
              userId,
              page: location,
              subtype: PerformanceMetricType.RESOURCE_LOAD,
              duration: resourceEntry.duration,
              details: {
                name: resourceEntry.name,
                initiatorType: resourceEntry.initiatorType,
                size: resourceEntry.transferSize,
              },
            });
          }
        }
      });
    });
    
    // Start observing resource timing entries
    observer.observe({ entryTypes: ['resource'] });
    
    return () => {
      observer.disconnect();
    };
  }, [location, userId]);
  
  // Track user interactions
  const trackInteraction = useCallback((
    interactionType: InteractionType,
    component?: string,
    details?: Record<string, any>
  ) => {
    queueEvent({
      type: UxEventType.INTERACTION,
      sessionId,
      userId,
      page: location,
      component,
      subtype: interactionType,
      details,
    });
  }, [location, userId]);
  
  // Track feature usage
  const trackFeatureUse = useCallback((
    featureName: string,
    details?: Record<string, any>
  ) => {
    queueEvent({
      type: UxEventType.FEATURE_USE,
      sessionId,
      userId,
      page: location,
      subtype: featureName,
      details,
    });
  }, [location, userId]);
  
  // Track workflow steps
  const trackWorkflow = useCallback((
    workflowName: string,
    status: 'started' | 'completed' | 'abandoned' | 'failed',
    details?: Record<string, any>
  ) => {
    queueEvent({
      type: UxEventType.WORKFLOW,
      sessionId,
      userId,
      page: location,
      subtype: workflowName,
      details: {
        status,
        ...details,
      },
    });
  }, [location, userId]);
  
  // Track errors
  const trackError = useCallback((
    errorType: string,
    message: string,
    details?: Record<string, any>
  ) => {
    queueEvent({
      type: UxEventType.ERROR,
      sessionId,
      userId,
      page: location,
      subtype: errorType,
      details: {
        message,
        ...details,
      },
    });
  }, [location, userId]);
  
  // Track component performance
  const trackComponentPerformance = useCallback((
    componentName: string,
    duration: number,
    details?: Record<string, any>
  ) => {
    queueEvent({
      type: UxEventType.PERFORMANCE,
      sessionId,
      userId,
      page: location,
      component: componentName,
      subtype: PerformanceMetricType.COMPONENT_RENDER,
      duration,
      details,
    });
  }, [location, userId]);
  
  // Track user feedback
  const submitFeedback = useCallback((
    rating: number,
    comment?: string,
    category?: string
  ) => {
    fetch('/api/ux-metrics/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userId,
        page: location,
        rating,
        comment,
        category,
      }),
    }).catch(error => {
      console.error('Failed to submit feedback', error);
    });
  }, [location, userId]);
  
  // Make sure to process any remaining events when the component unmounts
  useEffect(() => {
    return () => {
      if (queueTimer) {
        clearTimeout(queueTimer);
        queueTimer = null;
      }
      processQueue();
    };
  }, []);
  
  return {
    trackInteraction,
    trackFeatureUse,
    trackWorkflow,
    trackError,
    trackComponentPerformance,
    submitFeedback,
  };
}