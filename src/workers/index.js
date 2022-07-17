import cron from 'node-cron'
import _ from 'lodash'
import { newLogger } from 'services/logging'
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
  const func = () => {
    if(message) log.info(message)
    worker()
  }
  tasks.push(cron.schedule(schedule, func, {
    scheduled: true,
    timezone,
  }))
  log.info(`Created worker "${name}"`)
  if(immediate) func()
}

export const initWorkers = () => {
  _.forEach(configs, createWorker)
}

