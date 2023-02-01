// @ts-nocheck
// import pkg from '../package.json' assert { type: 'json' }
import path from 'node:path'
import { dirname } from 'dirname-filename-esm'
import fse from 'fs-extra'
import { log } from '@qqlwwq/utils'
import { program } from 'commander'
import semver from 'semver'

const __dirname = dirname(import.meta)
const pkgPath = path.resolve(__dirname, '../package.json')
const pkg = fse.readJSONSync(pkgPath)

// 最低要求node版本
const LOWEST_NODE_VERSION = '14.0.0'
// node版本
function checkNodeVersion() {
  if (!semver.gte(process.version, LOWEST_NODE_VERSION)) {
    throw new Error(`需要安装${LOWEST_NODE_VERSION}以上版本的Node.js`)
  }
}

function preAction() {
  // 检查node版本
  checkNodeVersion()
}
export default function () {
  console.log('node version', process.version)
  log.success('version', pkg.version)

  // 初始化
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]') // 提示option
    .version(pkg.version) // 获取版本号
    .option('-d,--debug', '是否开启调试模式', false)
    .hook('preAction', preAction)

  program.on('command:*', function (obj) {
    log.error('未知的命令:', obj[0])
  })

  program.on('option:debug', function () {
    if (program.opts().debug) {
      log.verbose('debug', 'launch debug mode')
    }
  })
  return program
}
