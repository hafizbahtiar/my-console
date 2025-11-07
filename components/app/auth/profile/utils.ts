/**
 * Get user initials from email
 */
export function getInitials(email: string): string {
  return email.substring(0, 2).toUpperCase()
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

