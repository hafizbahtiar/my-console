/**
 * SafeHTML Component
 * Safely renders HTML content with sanitization
 */

'use client';

import * as React from 'react';
import { sanitizeHTMLForDisplay } from '@/lib/html-sanitizer';
import { cn } from '@/lib/utils';

interface SafeHTMLProps {
  /** HTML content to display */
  html: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to sanitize the content (default: true) */
  sanitize?: boolean;
}

/**
 * Component that safely renders HTML content
 * Automatically sanitizes HTML to prevent XSS attacks
 */
export function SafeHTML({ html, className, sanitize = true }: SafeHTMLProps) {
  const sanitizedContent = React.useMemo(() => {
    if (!html) return '';
    return sanitize ? sanitizeHTMLForDisplay(html) : html;
  }, [html, sanitize]);

  if (!sanitizedContent) {
    return null;
  }

  return (
    <div
      className={cn('safe-html-content', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

