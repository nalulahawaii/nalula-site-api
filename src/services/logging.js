import log4js from 'log4js'

export const newLogger = (name, devLevel='debug', prodLevel='info') => {
  const logger = log4js.getLogger(name)
  logger.level = process.env.NODE_ENV === 'production' ? prodLevel : devLevel
  return logger
}
