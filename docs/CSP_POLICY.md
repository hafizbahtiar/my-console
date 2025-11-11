# Content Security Policy (CSP) Documentation

## Overview

This document describes the Content Security Policy (CSP) implementation for My Console. CSP is a security feature that helps prevent cross-site scripting (XSS) attacks and other code injection attacks.

## Current CSP Configuration

### Production CSP

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data: https:;
connect-src 'self' <APPWRITE_ENDPOINT> https://openrouter.ai https://api.openrouter.ai;
media-src 'self' blob:;
object-src 'none';
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
block-all-mixed-content;
```

### Development CSP

Development CSP is less restrictive to allow:
- WebSocket connections for hot reloading
- Localhost connections
- Mixed content (for local development)

## CSP Directives Explained

### default-src 'self'
- Default source for all resource types
- Only allows resources from the same origin

### script-src
- **'self'**: Scripts from same origin
- **'unsafe-inline'**: Required for Next.js inline scripts
- **'unsafe-eval'**: Required for TipTap editor (dynamic code evaluation)

**Note**: `unsafe-inline` and `unsafe-eval` reduce security but are necessary for Next.js and TipTap. Consider using nonces in the future.

### style-src
- **'self'**: Styles from same origin
- **'unsafe-inline'**: Required for Tailwind CSS and component styles

### img-src
- **'self'**: Images from same origin
- **data:**: Data URIs (for inline images)
- **https:**: HTTPS images from any domain
- **blob:**: Blob URLs (for generated images)

### font-src
- **'self'**: Fonts from same origin
- **data:**: Data URIs (for inline fonts)
- **https:**: HTTPS fonts from any domain

### connect-src
- **'self'**: Same-origin connections
- **Appwrite endpoint**: API calls to Appwrite backend
- **OpenRouter API**: AI API calls

### media-src
- **'self'**: Media from same origin
- **blob:**: Blob URLs (for generated media)

### object-src 'none'
- Disallows `<object>`, `<embed>`, and `<applet>` elements
- Prevents plugin-based attacks

### frame-src 'none'
- Disallows `<iframe>` elements
- Prevents clickjacking attacks

### frame-ancestors 'none'
- Prevents the page from being embedded in frames
- Prevents clickjacking

### base-uri 'self'
- Restricts `<base>` tag to same origin
- Prevents base tag injection attacks

### form-action 'self'
- Restricts form submissions to same origin
- Prevents form hijacking

### upgrade-insecure-requests
- Automatically upgrades HTTP requests to HTTPS
- Prevents mixed content issues

### block-all-mixed-content
- Blocks all mixed content (HTTP resources on HTTPS pages)
- Prevents downgrade attacks

## Security Considerations

### Current Limitations

1. **unsafe-inline and unsafe-eval**: Required for Next.js and TipTap but reduce security
   - **Mitigation**: Consider implementing nonce-based CSP in the future
   - **Risk**: Medium - allows inline scripts and eval

2. **Broad img-src and font-src**: Allows HTTPS resources from any domain
   - **Mitigation**: Monitor for unexpected resource loads
   - **Risk**: Low - only allows HTTPS

### Strengths

1. **Strict frame-src**: Prevents clickjacking
2. **object-src 'none'**: Prevents plugin-based attacks
3. **base-uri 'self'**: Prevents base tag injection
4. **form-action 'self'**: Prevents form hijacking
5. **upgrade-insecure-requests**: Forces HTTPS

## Future Enhancements

### Nonce-Based CSP

Implement nonce-based CSP for inline scripts:

```javascript
// Generate nonce for each request
const nonce = crypto.randomBytes(16).toString('base64')

// Add to CSP header
script-src 'self' 'nonce-${nonce}'

// Use in inline scripts
<script nonce={nonce}>
  // Inline script
</script>
```

### CSP Reporting

Enable CSP violation reporting:

```javascript
// Add to CSP header
report-uri /api/csp-report
report-to csp-endpoint

// Create reporting endpoint
POST /api/csp-report
```

### Stricter Policies

Consider stricter policies:
- Restrict `img-src` to specific domains
- Remove `unsafe-eval` if TipTap can be configured differently
- Implement nonce-based inline scripts

## Testing CSP

### Browser Console

Check for CSP violations in browser console:
- Look for messages like "Content Security Policy violation"
- Check Network tab for blocked resources

### CSP Evaluator

Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to test your CSP:
1. Paste your CSP header
2. Review warnings and suggestions
3. Implement recommended improvements

### Development Testing

1. Test in development mode (less restrictive)
2. Test in production mode (more restrictive)
3. Verify all features work correctly
4. Check for CSP violations in console

## Configuration

CSP is configured in:
- `middlewares/security-headers.ts` - CSP header configuration
- `middlewares/middleware.ts` - Middleware that applies headers

## Troubleshooting

### Resources Blocked by CSP

If resources are blocked:
1. Check browser console for CSP violations
2. Identify the blocked resource
3. Add appropriate directive to CSP
4. Test in development first

### TipTap Not Working

If TipTap editor doesn't work:
1. Verify `unsafe-eval` is in `script-src`
2. Check for CSP violations in console
3. Ensure all required directives are present

### API Calls Blocked

If API calls are blocked:
1. Verify API endpoint is in `connect-src`
2. Check for CORS issues (separate from CSP)
3. Ensure endpoint uses HTTPS

## Compliance

CSP helps with:
- **OWASP Top 10**: Prevents XSS attacks
- **Security Headers**: Industry best practice
- **PCI DSS**: Required for payment processing
- **GDPR**: Helps protect user data

## References

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

