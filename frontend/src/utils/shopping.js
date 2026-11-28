const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (amount) => (amount == null ? '' : inr.format(amount));

// Plain marketplace search URLs — real searches the user can run themselves.
export function marketplaceSearchLinks(query) {
  const q = query.trim();
  return [
    { platform: 'Myntra', url: `https://www.myntra.com/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}` },
    { platform: 'Amazon', url: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
    { platform: 'Flipkart', url: `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
    { platform: 'AJIO', url: `https://www.ajio.com/search/?text=${encodeURIComponent(q)}` },
    { platform: 'Nykaa Fashion', url: `https://www.nykaafashion.com/catalogsearch/result/?q=${encodeURIComponent(q)}` },
  ];
}
