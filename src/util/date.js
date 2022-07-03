import { DateTime } from 'luxon'

export const getNowISO = () => luxonDateTimeToISO(DateTime.now())

export const luxonDateTimeToISO = dateTime => dateTime.toFormat('yyyy-LL-dd\'T\'HH:mm:ss')
