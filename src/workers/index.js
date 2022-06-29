import cron from 'node-cron'
import _ from 'lodash'
import { newLogger } from 'src/services/logging'
import searchConfig from './search'

const configs = [searchConfig]

const log = newLogger('Workers')

const tasks = []

/**
 * Create a function to execute a worker and schedule a cron for it.
 * Only call this function during or after execution of initWorkers.
 *
 * @param {string} name
 * @param {function} worker
 * @param {string} schedule - cron syntax
 * @param {string=} message - log this message each time worker executed
 * @param {boolean=} immediate - execute worker right after scheduling cron
 * @param {string=} timezone
 * @param {boolean=} enabled
 */
export const createWorker = ({
  name,
  worker,
  schedule,
  immediate = false,
  timezone,
  message,
  enabled = false,
}) => {
  if(!enabled) return
  log.info(`Creating worker "${name}"`)
  const func = () => {
    if(message) log.info(message)
    worker()
  }
  tasks.push(cron.schedule(schedule, func, {
    scheduled: true,
    timezone,
  }))
  if(immediate) func()
}

export const initWorkers = () => {
  _.forEach(configs, createWorker)
}
