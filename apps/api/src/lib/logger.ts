import { Logtail } from '@logtail/edge'

export function createLogger(sourceToken: string): Logtail {
  return new Logtail(sourceToken)
}
