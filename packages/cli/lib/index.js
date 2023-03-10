// @ts-nocheck
import { program } from 'commander'
import createInitCommand from '@qqlwwq/init'
import createInstallCommand from '@qqlwwq/install'
import createLintCommand from '@qqlwwq/lint'
import createCommitCommand from '@qqlwwq/commit'
import createCLI from './createCLI.js'
import './exception.js'

export default function () {
  // 初始化
  createCLI()
  // 注册命令
  createInitCommand(program)
  // 注册命令
  createInstallCommand(program)
  // 注册命令
  createLintCommand(program)
  // 注册命令
  createCommitCommand(program)
  // 结束
  program.parse(process.argv)
}
