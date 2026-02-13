import { Logtail } from '@logtail/browser'

const sourceToken = import.meta.env.VITE_BETTERSTACK_SOURCE_TOKEN

export const logger = sourceToken ? new Logtail(sourceToken) : null
