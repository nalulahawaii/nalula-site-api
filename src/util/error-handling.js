import * as Sentry from '@sentry/node'
import util from 'util'
import { newLogger } from 'src/services/logging'

const log = newLogger('dev reportError')

log.level = 'error'

/**
 * Send error report to error logging service if on production, or just log it.
 *
 * @param {Error|string} e
 * @param context
 */
export const reportError = ({ e, ...context }) => {
  const err = typeof e === 'string' ? new Error(e) : e
  if(process.env.NODE_ENV === 'production') {
    Sentry.captureException(err, context)
  } else {
    log.error(e, util.inspect(context, { depth: 10, colors: true }))
  }
}
