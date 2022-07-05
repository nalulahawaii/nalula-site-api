import * as Sentry from '@sentry/node'
import { newLogger } from 'src/services/logging'
import { logValDetailed } from 'src/util/debug'

const log = newLogger('Development Error Logging')

if(process.env.NODE_ENV === 'development') log.info('Sentry.io-bound errors will be logged here in development environment')

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
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
    log.error(err, logValDetailed(context))
  }
}
