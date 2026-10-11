export const SITE_NAME = 'Raghib Hasan'
export const SITE_DESCRIPTION =
  'Independent writing on software, AI, systems, and the ideas shaping how technology is built and used.'

export function getCanonicalUrl(url: URL, site: URL | undefined): URL {
  if (!site) {
    throw new Error('SEO metadata requires the site URL in astro.config.mjs.')
  }
  return new URL(`${url.pathname.replace(/\/+$/, '')}/`, site)
}

export interface ArticleMetadata {
  headline: string
  date: Date
}

interface SeoInput {
  url: URL
  site: URL | undefined
  title?: string
  description?: string
  article?: ArticleMetadata
  noindex?: boolean
}

export function getSeoMetadata({
  url,
  site,
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  article,
  noindex = false,
}: SeoInput) {
  const canonical = getCanonicalUrl(url, site)
  const home = new URL('/', canonical)
  const author = {
    '@type': 'Person' as const,
    '@id': `${home.href}#author`,
    name: SITE_NAME,
    url: home.href,
    sameAs: ['https://github.com/ragmha', 'https://www.linkedin.com/in/ragmha/'],
  }
  const image = {
    url: new URL('/social-card.png', home),
    width: 1200,
    height: 630,
    alt: `${SITE_NAME}: independent writing on software, AI, and systems.`,
  }
  const datePublished = article && !noindex ? article.date.toISOString() : undefined
  const graph = [
    author,
    {
      '@type': 'WebSite' as const,
      '@id': `${home.href}#website`,
      url: home.href,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': author['@id'] },
    },
    ...(article && !noindex ? [{
      '@type': 'BlogPosting' as const,
      '@id': `${canonical.href}#article`,
      url: canonical.href,
      mainEntityOfPage: canonical.href,
      headline: article.headline,
      description,
      datePublished,
      inLanguage: 'en',
      image: image.url.href,
      author,
      publisher: { '@id': author['@id'] },
      isPartOf: { '@id': `${home.href}#website` },
    }] : []),
  ]

  return {
    pageTitle: title === SITE_NAME ? title : `${title} \u00b7 ${SITE_NAME}`,
    description,
    canonical,
    image,
    openGraphType: article && !noindex ? 'article' : 'website',
    datePublished,
    structuredData: noindex ? undefined : {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  }
}

export function serializeJsonLd(data: NonNullable<ReturnType<typeof getSeoMetadata>['structuredData']>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
