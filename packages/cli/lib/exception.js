// 监听异常
import { printErrorLog } from '@qqlwwq/utils'

// 监听普通异常
process.on('uncaughtException', printErrorLog)

// 监听promise异常
process.on('unhandledRejection', printErrorLog)
