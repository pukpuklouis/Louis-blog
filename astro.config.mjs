import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import icon from "astro-icon";
import pageInsight from "astro-page-insight";
import metaTags from "astro-meta-tags";
import partytown from "@astrojs/partytown";
import tailwindConfigViewer from "astro-tailwind-config-viewer";

// https://astro.build/config
export default defineConfig({
  site: 'https://blogs.itslouis.cc',
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    react(),
    icon(),
    pageInsight(),
    metaTags(),
    tailwindConfigViewer(),
    partytown({
      config: {
        debug: true, 
        forward: [
          'dataLayer.push',
          'h8OQRUhXvvY2LPkuL7o0IQ'
        ],
        proxies: [
          {
            host: 'analytics.ahrefs.com',
          }
        ]
      },
    }),
  ],
  vite: {
    build: {
      // minify: false
    },
  },
});