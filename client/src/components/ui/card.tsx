import React, { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Properties for the Card component
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card
   */
  className?: string;
}

/**
 * Properties for the CardHeader component
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card header content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card header
   */
  className?: string;
}

/**
 * Properties for the CardTitle component
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Card title content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card title
   */
  className?: string;
}

/**
 * Properties for the CardDescription component
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /**
   * Card description content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card description
   */
  className?: string;
}

/**
 * Properties for the CardContent component
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card content
   */
  className?: string;
}

/**
 * Properties for the CardFooter component
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card footer content
   */
  children: ReactNode;
  
  /**
   * Additional CSS class names for the card footer
   */
  className?: string;
}

/**
 * Card component for containing content in a bordered container
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border border-gray-200 bg-white shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader component for the top section of a card
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle component for the title of a card
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-none tracking-tight text-gray-900',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription component for the description text in a card header
 */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-gray-500', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContent component for the main content area of a card
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter component for the bottom section of a card
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center p-6 pt-0', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';