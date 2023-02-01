// @ts-nocheck
import log from 'npmlog'
import isDebug from './isDebug.js'

// debug可以调试
if (isDebug()) {
  log.level = 'verbose'
} else {
  log.level = 'info'
}

log.heading = 'qqlwwqCli'

// 改变成功的样式
log.addLevel('success', 2000, { fg: 'green', bold: true })
log.addLevel('error', 2000, { fg: 'red' })

export default log
