import { SITE_URL, OG_BASE } from '../../lib/seo'
import FreeAssessmentClient from './FreeAssessmentClient'

const title = 'Free IT Support Assessment for Small Businesses | Kocre IT Services'
const description =
  'Get a free, no-pressure IT assessment for your small business. Share your team size, tools, and recurring IT pain points and get an honest plan recommendation — remote-first helpdesk, Microsoft 365 / Google Workspace, and managed Windows devices.'

export const metadata = {
  title,
  description,
  alternates: { canonical: '/free-assessment' },
  openGraph: {
    ...OG_BASE,
    url: `${SITE_URL}/free-assessment`,
    title,
    description,
  },
}

export default function FreeAssessmentPage() {
  return <FreeAssessmentClient />
}
