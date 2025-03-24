## Supported Props

Propname | Type | Description
------------ | ------------- | -------------
title | string | The title of the page.
titleTemplate | string | Provide a title template to keep a consistent title style. `%s — Astro SEO`, `%s` will be replaced with your title, e.g. `Homepage — Astro SEO`
titleDefault | string | Fallback title that is used if no title is provided.
description | string | Text that gives a concise description of what your page is about.
canonical | string | Prevent duplicate content issues by specifying the "canonical" or "preferred" url of a web page. If you don't define this, `Astro.url.href` will be used as the default value.
noindex | boolean | Set this to true if you don't want search engines to index your page. Since this is an SEO component, this gets set to `false` by default. This way, indexing is strictly opt-out.
nofollow | boolean | Set this to true if you don't want search engines to follow links on your page. Since this is an SEO component, this gets set to `false` by default. This way, following links is strictly opt-out.
charset | string | Set the charset of the document. In almost all cases this should be UTF-8.
languageAlternates | Array<{ href: string; hrefLang: string }> | List of language alternates for the page.
openGraph.basic.title | string | Set the title Open Graph should use. __In most situations, this should be _different_ from the value of the `title` prop.__ See [this tweet](https://twitter.com/jon_neal/status/1428721238071988237) to gain an understanding of the difference between the two. If you define this, you must define two other OG basic properties as well: `type` and `image`. ([Learn more.](https://ogp.me/#metadata))
openGraph.basic.type | string | Set the [type](https://ogp.me/#types) Open Graph should use. If you define this, you must define two other OG basic properties as well: `title` and `image`. ([Learn more.](https://ogp.me/#metadata))
openGraph.basic.image | string | URL of the image that should be used in social media previews. If you define this, you must define two other OG basic properties as well: `title` and `type`. ([Learn more.](https://ogp.me/#metadata))
openGraph.basic.url | string | The canonical URL of your object that will be used as its permanent ID in the graph. Most likely either the url of the page or its canonical url (see above). If you define this, you must define the other 3 OG basic properties as well: `title`, `type` and `image`. ([Learn more.](https://ogp.me/#metadata)). If you define the other 3 OG basic properties but don't define this, `Astro.request.url.href` will be used as the default value.
openGraph.optional.audio | string | A URL to an audio file to accompany this object.
openGraph.optional.description | string | A one to two sentence description of your object.
openGraph.optional.determiner | string | The word that appears before this object's title in a sentence. An enum of (a, an, the, "", auto). If auto is chosen, the consumer of your data should chose between "a" or "an". Default is "" (blank).
openGraph.optional.locale | string | The locale these tags are marked up in. Of the format language_TERRITORY. Default is en_US.
openGraph.optional.localeAlternate | Array<string> | An array of other locales this page is available in.
openGraph.optional.siteName | string | If your object is part of a larger web site, the name which should be displayed for the overall site. e.g., "IMDb".
openGraph.optional.video | string | A URL to a video file that complements this object.
openGraph.image.url | string | For now, setting this is ignored. This is done because `og:image:url` is supposed to be identical to `og:image`. If you have a use case where it makes sense for these to be different, please feel free to contact me, and tell me about it and I will consider adding it. Until then, in the interest of enforcing best practices, the value of this property will be ignored and `og:image:url` set to the value of `openGraph.basic.image`.
openGraph.image.secureUrl | string | Sets `og:image:secure_url`: An alternate url to use if the webpage requires HTTPS.
openGraph.image.type | string | Sets `og:image:type`. A MIME type for the image. e.g. "image/jpeg"
openGraph.image.width | number | Sets `og:image:width`. The number of pixels wide.
openGraph.image.height | number | Sets `og:image:height`. The number of pixels high.
openGraph.image.alt | string | Sets `og:image:alt`. A description of what is in the image (not a caption). __If the page specifies `openGraph.basic.image` it should specify `openGraph.image.alt`__.
openGraph.article.publishedTime | string | Sets `article:published_time`. The date the article was published. Must be a ISO 8601 DateTime string.
openGraph.article.modifiedTime | string | Sets `article:modified_time`. The date the article was last modified. Must be a ISO 8601 DateTime string.
openGraph.article.expirationTime | string | Sets `article:expiration_time`. The date the article will no longer be relevant. Must be a ISO 8601 DateTime string.
openGraph.article.authors | string[] | Sets `article:author`. The author(s) of the article, if it's only one, pass an array with one entry. If there are multiple, multiple tags with descending relevance will be created.
openGraph.article.section | string | Sets `article:section`. A high-level section name. E.g. Technology
openGraph.article.tags | string[] | Sets `article:tag`. Tag words associated with this article. If it's only one, pass an array with one entry. If there are multiple, multiple tags with descending relevance will be created.
twitter.card | TwitterCardType (string) | Sets `twitter:card`. The card type. Must be one of “summary”, “summary_large_image”, “app”, or “player”.
twitter.site | string | Sets `twitter:site`. (Twitter) @username for the website used in the card footer.
twitter.creator | string | Sets `twitter:creator`. (Twitter) @username for the content creator / author.
twitter.title | string | Sets `twitter:title`. Title of the page or article (equivalent to Open Graph's og:title).
twitter.image | string | Sets `twitter:image`. Full link to the image you want to use for the page (equivalent to Open Graph's og:image).
twitter.imageAlt | string | Sets `twitter:image:alt`. A description of what is in the image (not a caption). __If the page specifies `twitter.image` it should specify `twitter.imageAlt`__.
twitter.description | string | Sets `twitter:description`. A one to two sentence description of your object.
extend.link | Array<Link extends HTMLLinkElement { prefetch: boolean; }> | An array of free-form `<link>` you'd like to define.
extend.meta | Array<Meta extends HTMLMetaElement { property: string; }> | An array of free-form `<meta>` tags you'd like to define.