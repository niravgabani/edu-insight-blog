export const truncate = (text, n = 150) => (text.length > n ? text.slice(0, n) + '...' : text);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
