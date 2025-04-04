import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import icon from "astro-icon";
import pageInsight from "astro-page-insight";
import metaTags from "astro-meta-tags";
import partytown from "@astrojs/partytown";
import tailwindConfigViewer from "astro-tailwind-config-viewer";
import minify from "astro-min";

// https://astro.build/config
export default defineConfig({
  site: "https://blogs.itslouis.cc",
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
        debug: false,
        forward: ["dataLayer.push", "h8OQRUhXvvY2LPkuL7o0IQ"],
        proxies: [
          {
            host: "analytics.ahrefs.com",
          },
        ],
      },
    }),
    minify({
      do_not_minify_doctype: false,
      ensure_spec_compliant_unquoted_attribute_values: false,
      keep_closing_tags: true,
      keep_comments: false,
      keep_html_and_head_opening_tags: true,
      keep_input_type_text_attr: false,
      keep_spaces_between_attributes: false,
      keep_ssi_comments: false,
      minify_css: true,
      minify_js: true,
      preserve_brace_template_syntax: false,
      preserve_chevron_percent_template_syntax: false,
      remove_bangs: false,
      remove_processing_instructions: false,
    }),
  ],
  vite: {
    build: {
      // minify: false
    },
  },
  image: {
    domains: ["images.unsplash.com", "res.cloudinary.com", "blogs.itslouis.cc"],
  },
});
