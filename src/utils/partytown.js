// Partytown configuration for Louis-blog
export const partytownConfig = {
  debug: true,
  forward: ['dataLayer.push', 'fbq'],
  resolveUrl: (url, location, type) => {
    if (type === 'script') {
      return new URL(url, location);
    }
    return url;
  },
  // Prevent Partytown from hiding content
  mainWindowAccessors: ['document.documentElement.style.visibility', 'document.body.style.visibility'],
};
