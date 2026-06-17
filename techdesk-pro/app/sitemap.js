import { SITE_URL, REGIONS, SERVICES } from '../lib/seo'

export default function sitemap() {
  const now = new Date()

  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/free-assessment', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/pilot', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/support-transparency', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const servicePages = SERVICES.map((s) => ({
    path: `/services/${s.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  }))

  const regionPages = REGIONS.map((r) => ({
    path: `/service-areas/${r.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly',
  }))

  return [...staticPages, ...servicePages, ...regionPages].map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))
}
