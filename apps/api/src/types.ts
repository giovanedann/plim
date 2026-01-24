import type { Bindings } from './lib/env'
import type { AuthVariables } from './middleware/auth.middleware'

export type Env = {
  Bindings: Bindings
  Variables: AuthVariables
}
