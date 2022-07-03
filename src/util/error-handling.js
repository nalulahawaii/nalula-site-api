import * as Sentry from '@sentry/node'
import { newLogger } from 'src/services/logging'
import { logValDetailed } from 'src/util/debug'

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
    log.error(e, logValDetailed(context))
  }
}
