import { newLogger } from 'src/services/logging'
import { logValDetailed } from 'src/util/debug'

const log = newLogger('Development Error Logging')
log.level = 'info'

if(process.env.NODE_ENV === 'development') log.info('Sentry.io-bound errors will be logged here in development environment')

/**
 * Send error report to error logging service if on production, or just log it.
 *
 * @param {Error|string} e
 * @param context
 */
export const reportError = ({ e, ...context }) => {
  const err = typeof e === 'string' ? new Error(e) : e
  if(process.env.NODE_ENV === 'production') {
    // TODO: Enable when Sentry.io account created.
    // Sentry.captureException(err, context)
    log.error(err, logValDetailed(context))
  } else {
    log.error(err, logValDetailed(context))
  }
}
