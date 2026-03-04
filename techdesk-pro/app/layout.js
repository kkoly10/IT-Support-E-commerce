import './globals.css'

export const metadata = {
  title: 'TechDesk Pro — IT Support & E-Commerce Solutions',
  description: 'Affordable, AI-powered IT helpdesk and e-commerce support for small businesses and startups. Based in Stafford, VA.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}