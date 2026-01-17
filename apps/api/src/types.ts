import type { Bindings } from './lib/supabase'
import type { AuthVariables } from './middleware/auth.middleware'

export type Env = {
  Bindings: Bindings
  Variables: AuthVariables
}
