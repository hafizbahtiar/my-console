/**
 * HTML Sanitization Utility
 * Provides secure HTML sanitization for blog content and user-generated HTML
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for HTML sanitization
 * Allows common formatting tags used in blog content while preventing XSS
 */
const sanitizeConfig = {
  // Allow common HTML tags used in blog content
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'table', 'thead',
    'tbody', 'tr', 'td', 'th', 'div', 'span', 'hr', 'sub', 'sup', 'mark',
    'del', 'ins', 'figure', 'figcaption', 'iframe', // iframe for YouTube embeds
  ],
  
  // Allowed attributes for tags
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'width', 'height', 'class', 'id',
    'target', 'rel', 'data-*', 'style', 'colspan', 'rowspan', 'align',
    'frameborder', 'allowfullscreen', 'allow', 'sandbox', // for iframes
  ],
  
  // Allowed URL schemes
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  
  // Additional configuration
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false,
  
  // Allow data URIs for images (base64 encoded images)
  ALLOW_DATA_ATTR: true,
  
  // Custom hooks for additional sanitization
  ADD_ATTR: ['target', 'rel'], // Ensure links have target and rel
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * Sanitize HTML content for blog posts
 * Removes dangerous scripts and attributes while preserving formatting
 * 
 * @param html - Raw HTML content to sanitize
 * @param options - Optional configuration overrides
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(
  html: string,
  options?: Partial<typeof sanitizeConfig>
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const config = { ...sanitizeConfig, ...options };

  try {
    // Sanitize the HTML
    const clean = DOMPurify.sanitize(html, config);

    // Post-process: Ensure all external links have rel="noopener noreferrer"
    const processed = clean.replace(
      /<a\s+([^>]*href=["'][^"']*["'][^>]*)>/gi,
      (match, attrs) => {
        // Check if target="_blank" is present
        if (attrs.includes('target="_blank"') || attrs.includes("target='_blank'")) {
          // Ensure rel attribute includes security attributes
          if (!attrs.includes('rel=')) {
            return `<a ${attrs} rel="noopener noreferrer">`;
          } else if (!attrs.includes('noopener')) {
            // Add noopener if rel exists but doesn't have it
            return match.replace(/rel=["']([^"']*)["']/, 'rel="$1 noopener noreferrer"');
          }
        }
        return match;
      }
    );

    return processed;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // Fallback: strip all HTML tags if sanitization fails
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Sanitize HTML for display (more restrictive)
 * Use this when displaying user-generated content
 * 
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML safe for display
 */
export function sanitizeHTMLForDisplay(html: string): string {
  return sanitizeHTML(html, {
    // Remove iframes for display (more restrictive)
    ALLOWED_TAGS: sanitizeConfig.ALLOWED_TAGS.filter(tag => tag !== 'iframe'),
  });
}

/**
 * Sanitize HTML for storage (allows more tags)
 * Use this when saving content to database
 * 
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML safe for storage
 */
export function sanitizeHTMLForStorage(html: string): string {
  return sanitizeHTML(html, sanitizeConfig);
}

/**
 * Strip all HTML tags, returning plain text
 * Useful for generating excerpts or previews
 * 
 * @param html - HTML content to strip
 * @returns Plain text without HTML tags
 */
export function stripHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // Use DOMPurify to parse and extract text
    const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    return clean.trim();
  } catch (error) {
    // Fallback: simple regex strip
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Validate HTML content before sanitization
 * Checks for common issues that might indicate malicious content
 * 
 * @param html - HTML content to validate
 * @returns Object with validation result and issues
 */
export function validateHTML(html: string): {
  isValid: boolean;
  issues: string[];
  sanitized: string;
} {
  const issues: string[] = [];

  if (!html || typeof html !== 'string') {
    return { isValid: false, issues: ['Content is empty or invalid'], sanitized: '' };
  }

  // Check for script tags
  if (/<script[\s>]/i.test(html)) {
    issues.push('Script tags detected');
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(html)) {
    issues.push('Event handlers detected');
  }

  // Check for javascript: URLs
  if (/javascript:/i.test(html)) {
    issues.push('JavaScript URLs detected');
  }

  // Check for data URLs in suspicious contexts
  if (/data:text\/html/i.test(html)) {
    issues.push('Data URLs with HTML content detected');
  }

  // Sanitize the content
  const sanitized = sanitizeHTML(html);

  return {
    isValid: issues.length === 0,
    issues,
    sanitized,
  };
}

/**
 * Sanitize an object containing HTML fields
 * Useful for sanitizing form data or API request bodies
 * 
 * @param obj - Object to sanitize
 * @param htmlFields - Array of field names that contain HTML
 * @returns Sanitized object
 */
export function sanitizeObjectHTML<T extends Record<string, any>>(
  obj: T,
  htmlFields: (keyof T)[]
): T {
  const sanitized = { ...obj };

  for (const field of htmlFields) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHTMLForStorage(sanitized[field] as string) as T[keyof T];
    }
  }

  return sanitized;
}

