import { createClient } from '../../../../lib/supabase/server'
import { getService } from '../../../../lib/supabase/route-auth'
import { createSignupHandler } from '../../../../lib/signup-completion'

export const POST = createSignupHandler({ createSessionClient: createClient, getService })
