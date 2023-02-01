// @ts-nocheck
import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import fse from 'fs-extra'
import ora from 'ora'
import { printErrorLog, log } from '@qqlwwq/utils'
import { execa } from 'execa'

// 创建目录时必须有node_modules才能下载
function getCacheDir(targetPath) {
  return path.resolve(targetPath, 'node_modules')
}
// 判断缓存目录是否存在
function makeCacheDir(targetPath) {
  const cacheDir = getCacheDir(targetPath)
  if (!pathExistsSync(cacheDir)) {
    // 不存在创建目录
    fse.mkdirpSync(cacheDir)
  }
}
// 下载模板
async function downloadAddTemplate(targetPath, template) {
  const { npmName, version } = template
  const installCommand = 'npm'
  const installArgs = ['install', `${npmName}@${version}`]
  // 安装目录
  const cwd = targetPath
  await execa(installCommand, installArgs, { cwd })
}
export default async function (selectTemplact) {
  const { template, targetPath } = selectTemplact
  // 创建缓存目录
  makeCacheDir(targetPath)
  // 进度条
  const spinner = ora('正在下载模板...').start()
  // 模板下载
  try {
    await downloadAddTemplate(targetPath, template)
    spinner.stop()
    log.success('下载模板成功')
  } catch (e) {
    spinner.stop()
    printErrorLog(e)
  }
}
