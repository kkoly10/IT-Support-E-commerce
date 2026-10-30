import { requireUser } from '../../../lib/supabase/route-auth'
import { createClientActivationHandlers } from '../../../lib/client-activation-api'

export const dynamic = 'force-dynamic'

const handlers = createClientActivationHandlers({ requireUser })
export const GET = handlers.GET
export const POST = handlers.POST
