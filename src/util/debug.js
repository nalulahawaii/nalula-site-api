import util from 'util'

export const logValDetailed = (val, depth = 10) => util.inspect(val, { depth, colors: true })
