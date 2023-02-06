// @ts-nocheck
import path from 'node:path'
import {
  cretaePlatformPath,
  getGitPlatform,
  cretaeTokenTempPath,
  Gitee,
  Github,
  makeList,
  cretaeOwnPath,
  cretaeLoginPath,
  getGitOwn,
  getGitLogin,
} from '../index.js'
import fse from 'fs-extra'

/**初始化选择列表 */
export async function initGenerateGitAPI() {
  let platform = getGitPlatform()
  if (!platform) {
    platform = await makeList({
      message: '请选择Git平台',
      choices: [
        { name: 'GitHub', value: 'github' },
        { name: 'Gitee', value: 'gitee' },
      ],
    })
  }

  const gitAPI = platform === 'github' ? new Github() : new Gitee()
  // 初始化
  await gitAPI.init()
  fse.writeFileSync(cretaePlatformPath(), platform)
  return { platform, gitAPI }
}
/**初始化用户信息 */
export async function initGitType(gitAPI) {
  // 仓库类型
  let gitOwn = getGitOwn()
  // 仓库登录名/组织名
  let gitLogin = getGitLogin()
  if (!gitLogin || !gitOwn) {
    const platform = getGitPlatform()
    const user = platform === 'gitee' ? (await gitAPI.getUser()).data : await gitAPI.getUser()
    const org = platform === 'gitee' ? (await gitAPI.getOrg()).data : await gitAPI.getOrg()
    if (!gitOwn) {
      gitOwn = await makeList({
        message: '请选择仓库类型',
        choices: [
          { name: 'User', value: 'user' },
          { name: 'Organization', value: 'org' },
        ],
      })
    }
    if (gitOwn === 'user') {
      gitLogin = user.login
    } else {
      // 选择组织
      gitLogin = await makeList({
        message: '请选择组织名称',
        choices: org.map((item) => ({
          name: item.name || item.login,
          value: item.login,
        })),
      })
    }
    if (!gitLogin || !gitOwn) {
      throw new Error('未获取到用户的Git登录名,请使用 qqlcli commit -c 清除缓存后重试')
    }
  }
  gitAPI.saveOwn(gitOwn)
  gitAPI.saveLogin(gitLogin)
  return gitLogin
}
/**创建远程仓库 */
export async function initRemoteRepo(gitAPI, name) {
  const platform = getGitPlatform()
  // 创建仓库
  const ret = platform === 'gitee' ? (await gitAPI.createRepo(name)).data : await gitAPI.createRepo(name)

  // console.log(ret)
}
/**清除缓存信息 */
export function clearCache() {
  const tempPath = cretaePlatformPath()
  const tokenPath = cretaeTokenTempPath()
  const ownPath = cretaeOwnPath()
  const LoginPath = cretaeLoginPath()
  fse.removeSync(tempPath)
  fse.removeSync(tokenPath)
  fse.removeSync(ownPath)
  fse.removeSync(LoginPath)
}
/**是否清除缓存 */
export async function isClearCache() {
  const tempPath = cretaePlatformPath()
  if (!tempPath) return
  const isClear = await makeList({
    message: '是否使用默认Git设置',
    choices: [
      { name: 'YES', value: 'yes' },
      { name: 'NO', value: 'no' },
    ],
  })
  isClear === 'yes' ? '' : clearCache()
}
