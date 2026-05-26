import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Kocre IT Services — Remote-First Tech Support & Operations for Small Businesses',
  description:
    'Remote-first IT support and cloud/SaaS administration for small businesses. AI-assisted, human-supervised service with clear support boundaries and business-hours coverage.',
  keywords: [
    'managed IT support',
    'small business IT',
    'remote IT helpdesk',
    'cloud administration',
    'Microsoft 365 support',
    'Google Workspace support',
  ],
  openGraph: {
    title: 'Kocre IT Services — Remote-First IT Support for Small Businesses',
    description:
      'Day-to-day helpdesk, cloud admin, and user support — delivered through a structured portal with real onboarding and human-supervised AI.',
    siteName: 'Kocre IT Services',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Kocre IT Services — remote-first IT support for small businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kocre IT Services — Remote-First IT Support for Small Businesses',
    description:
      'Day-to-day helpdesk, cloud admin, and user support for U.S. small businesses, with real onboarding and human-supervised AI.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Inter+Tight:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}