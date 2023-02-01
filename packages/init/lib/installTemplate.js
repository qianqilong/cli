// @ts-nocheck
import fse from 'fs-extra'
import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import { log, makeList } from '@qqlwwq/utils'
import ora from 'ora'
import ejs from 'ejs'
import glob from 'glob'

export default async function (selectTemplact, opts) {
  const { force = false } = opts

  const { targetPath, template, name } = selectTemplact
  const rootDir = process.cwd() // 执行命令目录
  fse.ensureDirSync(targetPath)

  const installDir = path.resolve(`${rootDir}/${name}`)

  if (pathExistsSync(installDir)) {
    if (!force) {
      log.error(`当前目录已存在 ${installDir} 文件夹`)
      return
    } else {
      // 强制安装
      fse.removeSync(installDir)
      fse.ensureDirSync(installDir)
    }
  } else {
    fse.ensureDirSync(installDir)
  }

  copyFile(targetPath, template, installDir)
  await ejsRender(targetPath, installDir, name, template)
}

/**
 * 拷贝模板文件
 * @param {缓存目录} targetPath
 * @param {模板信息} template
 * @param {安装目录} installDir
 */
function copyFile(targetPath, template, installDir) {
  const originFile = getCacheFilePath(targetPath, template)
  const fileList = fse.readdirSync(originFile)
  const spinner = ora('正在拷贝模板文件').start()
  fileList.map((file) => {
    fse.copySync(`${originFile}/${file}`, `${installDir}/${file}`)
  })
  spinner.stop()
  log.success('模板拷贝成功')
}

/**
 * 获取缓存目录
 * @param {缓存目录} targetPath
 * @param {模板信息} template
 * @return {返回的缓存目录}
 */
function getCacheFilePath(targetPath, template) {
  return path.resolve(targetPath, 'node_modules', template.npmName, 'template')
}

/**
 * 对缓存文件进行ejs解析
 *  @param {缓存目录} targetPath
 *  @param {安装目录} installDir
 *  @param {模板信息} template
 */
async function ejsRender(targetPath, installDir, name, template) {
  // 获取插件地址
  const pluginFilePath = getPluginFilePath(targetPath, template)
  // 存在插件
  let data
  if (pathExistsSync(pluginFilePath)) {
    const plugins = (await import('/workCode/FrontEndCode/webpack/template/vue-template/plugins/index.js')).default
    data = await plugins({ makeList })
  }

  console.log(data)
  const ejsData = {
    data: { name, ...data },
  }
  glob(
    '**',
    {
      cwd: installDir,
      nodir: true,
      ignore: ['**/public/**', '**/node_modules/**'],
    },
    (err, files) => {
      // 对安装的目录文件进行解析
      files.map((file) => {
        const filePath = path.join(installDir, file)
        ejs.renderFile(filePath, ejsData, (err, result) => {
          if (!err) {
            fse.writeFileSync(filePath, result)
          } else {
            log.error(err)
          }
        })
      })
    },
  )
}
/**
 * 获取插件目录
 * @param {缓存目录} targetPath
 * @param {模板信息} template
 * @return {返回的插件目录}
 */
function getPluginFilePath(targetPath, template) {
  return path.resolve(targetPath, 'node_modules', template.npmName, 'plugins', 'index.js')
}
