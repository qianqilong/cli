// @ts-nocheck
import isDebug from './isDebug.js'
import log from './log.js'

export default function printErrorLog(e) {
  if (isDebug()) {
    console.log(e)
  } else {
    log.error(e.message)
  }
}
