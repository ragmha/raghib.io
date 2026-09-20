import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCanonicalUrl, getSeoMetadata, serializeJsonLd } from '../src/lib/seo'

test('page canonicals use the configured site and trailing slash without query or fragment', () => {
  const site = new URL('https://raghib.io')
  for (const [path, expected] of [
    ['/?ref=profile', 'https://raghib.io/'],
    ['/writing?ref=home#main', 'https://raghib.io/writing/'],
    ['/writing/example/', 'https://raghib.io/writing/example/'],
  ]) {
    assert.equal(
      getCanonicalUrl(new URL(path, 'http://localhost:4321'), site).href,
      expected,
    )
  }
})

test('archives are websites and draft previews expose no publication schema or date', () => {
  const input = {
    url: new URL('http://localhost:4321/projects/'),
    site: new URL('https://raghib.io'),
  }
  const archive = getSeoMetadata(input)
  assert.equal(archive.pageTitle, 'Raghib Hasan')
  assert.equal(archive.openGraphType, 'website')
  assert.ok(!archive.structuredData?.['@graph'].some((entry) => entry['@type'] === 'BlogPosting'))

  const draft = getSeoMetadata({
    ...input,
    noindex: true,
    article: { headline: 'Draft preview', date: new Date('2026-09-20') },
  })
  assert.equal(draft.structuredData, undefined)
  assert.equal(draft.datePublished, undefined)
  assert.equal(draft.openGraphType, 'website')
})

test('JSON-LD preserves content without allowing HTML to close the script element', () => {
  const metadata = getSeoMetadata({
    url: new URL('http://localhost:4321/writing/example/'),
    site: new URL('https://raghib.io'),
    article: {
      headline: '</script><script>alert("example")</script>',
      date: new Date('2026-09-18'),
    },
  })
  assert.ok(metadata.structuredData)
  const serialized = serializeJsonLd(metadata.structuredData)
  assert.ok(!serialized.includes('<'))
  assert.deepEqual(JSON.parse(serialized), metadata.structuredData)
})

test('missing site configuration and invalid publication dates fail explicitly', () => {
  assert.throws(
    () => getCanonicalUrl(new URL('http://localhost:4321/'), undefined),
    /site URL/,
  )
  assert.throws(() => getSeoMetadata({
    url: new URL('http://localhost:4321/'),
    site: new URL('https://raghib.io'),
    article: { headline: 'Article', date: new Date('invalid') },
  }), RangeError)
})

test('article metadata preserves the headline, author and date alongside a shorter search title', () => {
  const metadata = getSeoMetadata({
    url: new URL('http://localhost:4321/writing/example?ref=home'),
    site: new URL('https://raghib.io'),
    title: 'DNS Cutovers: Why Domains Hit the Old Host',
    description: 'A first-hand account of a DNS migration.',
    article: {
      headline: 'Deployed, Not Live: Why Your Domain Still Points at the Host You Left',
      date: new Date('2026-09-18'),
    },
  })
  assert.equal(metadata.pageTitle, 'DNS Cutovers: Why Domains Hit the Old Host · Raghib Hasan')
  assert.ok(metadata.pageTitle.length <= 60)
  assert.equal(metadata.openGraphType, 'article')
  assert.equal(metadata.image.url.href, 'https://raghib.io/social-card.png')
  assert.deepEqual([metadata.image.width, metadata.image.height], [1200, 630])

  const article = metadata.structuredData?.['@graph'].find((entry) => entry['@type'] === 'BlogPosting')
  assert.ok(article)
  assert.equal(article.headline, 'Deployed, Not Live: Why Your Domain Still Points at the Host You Left')
  assert.equal(article.url, 'https://raghib.io/writing/example/')
  assert.equal(article.author.name, 'Raghib Hasan')
  assert.equal(article.author.url, 'https://raghib.io/')
  assert.equal(article.datePublished, '2026-09-18T00:00:00.000Z')
})
