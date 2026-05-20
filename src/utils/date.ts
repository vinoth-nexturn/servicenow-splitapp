/**
 * Date Utility
 * Formats dates for human readability and relative time expressions.
 */

export function formatRelativeTime(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  const now = new Date();
  const elapsedMs = now.getTime() - date.getTime();
  const elapsedSec = Math.floor(elapsedMs / 1000);

  if (elapsedSec < 5) return 'just now';
  if (elapsedSec < 60) return `${elapsedSec}s ago`;

  const elapsedMin = Math.floor(elapsedSec / 60);
  if (elapsedMin < 60) return `${elapsedMin}m ago`;

  const elapsedHrs = Math.floor(elapsedMin / 60);
  if (elapsedHrs < 24) return `${elapsedHrs}h ago`;

  const elapsedDays = Math.floor(elapsedHrs / 24);
  if (elapsedDays === 1) return 'yesterday';
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
