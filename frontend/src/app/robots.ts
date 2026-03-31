import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't let bots hammer live API routes — all data is accessible via the UI
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://ai-canada-pulse.vercel.app/sitemap.xml',
  }
}
