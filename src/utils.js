export const truncate = (text, n = 150) => (text.length > n ? text.slice(0, n) + '...' : text);

// Dates are stored as YYYY-MM-DD (UTC); without timeZone, visitors west of UTC would see the previous day
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
