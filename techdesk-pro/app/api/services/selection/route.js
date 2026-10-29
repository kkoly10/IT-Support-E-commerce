import { requireUser } from '../../../../lib/supabase/route-auth'
import { createServiceRequestHandlers } from '../../../../lib/service-request'

export const dynamic = 'force-dynamic'
const handlers = createServiceRequestHandlers({ requireUser })
export const GET = handlers.GET
export const POST = handlers.POST
