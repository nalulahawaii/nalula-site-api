import { DateTime } from 'luxon'

export const getNow = DateTime.now

export const getNowISO = () => luxonDateTimeToISO(getNow())

export const luxonDateTimeToISO = dateTime => dateTime.toFormat('yyyy-LL-dd\'T\'HH:mm:ss')
