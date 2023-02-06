// @ts-nocheck
import { homedir } from 'node:os'
import path from 'node:path'
import { pathExistsSync } from 'path-exists'
import fse from 'fs-extra'
import { log, makePassword, makeList, Gitee, Github } from '../index.js'
import { execa } from 'execa'

const TEMP_HOME = '.qql-cli'
const TEMP_PLATFORM = '.git_platform'
const TEMP_TOKEN = '.token'
const TEMP_OWN = '.git_own'
const TEMO_LOGIN = '.git_login'

// 拼错了不想改
function cretaeTokenTempPath() {
  return path.resolve(homedir(), TEMP_HOME, TEMP_TOKEN)
}
function cretaePlatformPath() {
  return path.resolve(homedir(), TEMP_HOME, TEMP_PLATFORM)
}
function cretaeOwnPath() {
  return path.resolve(homedir(), TEMP_HOME, TEMP_OWN)
}
function cretaeLoginPath() {
  return path.resolve(homedir(), TEMP_HOME, TEMO_LOGIN)
}
/**获取git平台类型 */
function getGitPlatform() {
  if (pathExistsSync(cretaePlatformPath())) {
    return fse.readFileSync(cretaePlatformPath()).toString()
  }
  return null
}

/**获取仓库类型 */
function getGitOwn() {
  if (pathExistsSync(cretaeOwnPath())) {
    return fse.readFileSync(cretaeOwnPath()).toString()
  }
  return null
}
/** 获取组织*/
function getGitLogin() {
  if (pathExistsSync(cretaeLoginPath())) {
    return fse.readFileSync(cretaeLoginPath()).toString()
  }
  return null
}
class GitServer {
  constructor() {}
  async init() {
    // 判断token是否录入
    const tokenPath = cretaeTokenTempPath()
    if (pathExistsSync(tokenPath)) {
      this.token = fse.readFileSync(tokenPath).toString()
    } else {
      this.token = await this.getToken()
      fse.writeFileSync(tokenPath, this.token)
    }
    log.verbose('token', this.token)
    log.verbose('tokenPath', tokenPath)
  }
  getToken() {
    return makePassword({
      message: '请输入token信息',
    })
  }
  savePlatform(platform) {
    this.platform = platform
  }
  saveOwn(gitOwn) {
    this.own = gitOwn
    fse.writeFileSync(cretaeOwnPath(), gitOwn)
    log.verbose(gitOwn)
  }
  saveLogin(gitLogin) {
    this.login = gitLogin
    fse.writeFileSync(cretaeLoginPath(), gitLogin)
    log.verbose(gitLogin)
  }
  getPlatform() {
    return this.platform
  }
  // 克隆仓库
  cloneRepo(fullName, tag) {
    // git clone .. -b v1.0.0
    if (tag) {
      return execa('git', ['clone', this.getRepoUrl(fullName), '-b', tag])
    }
    return execa('git', ['clone', this.getRepoUrl(fullName), '-b'])
  }
  // 安装依赖
  async instanceDependencies(cwd, fullName, pack) {
    const projectPath = this.getProjectPath(cwd, fullName)
    if (pathExistsSync(projectPath)) {
      if (pack === 'npm') {
        return execa('npm', ['install'], { cwd: projectPath, stdout: 'inherit' })
      } else {
        return execa('yarn', { cwd: projectPath, stdout: 'inherit' })
      }
    }
  }
  // 运行项目
  async runRepo(cwd, fullName, pack) {
    const projectPath = this.getProjectPath(cwd, fullName)
    const pkg = this.getPackagePath(cwd, fullName)
    if (pkg) {
      const { scripts, bin, name } = pkg
      if (bin) {
        await execa('npm', ['install', '-g', name], { cwd: projectPath, stdout: 'inherit' })
      }
      if (scripts && scripts.dev) {
        return execa('npm', ['run', 'dev'], { cwd: projectPath, stdout: 'inherit' })
      } else if (scripts && scripts.start) {
        return execa('npm', ['run', 'start'], { cwd: projectPath, stdout: 'inherit' })
      } else {
        log.warn('未找到启动命令')
      }
    }
  }
  // 获取项目路径
  getProjectPath(cwd, fullName) {
    const projectName = fullName.split('/')[1]
    return path.resolve(cwd, projectName)
  }
  // 获取package.json地址
  getPackagePath(cwd, fullName) {
    const projectPath = this.getProjectPath(cwd, fullName)
    const pkg = path.resolve(projectPath, 'package.json')
    if (!pathExistsSync(pkg)) {
      return false
    }
    return fse.readJSONSync(pkg)
  }
  // 获取用户资料
  getUser() {
    throw new Error('the method must be implemented!')
  }
  // 获取组织
  getOrg() {
    throw new Error('the method must be implemented!')
  }
  /**创建仓库 */
  createRepo() {
    throw new Error('the method must be implemented!')
  }
}
export {
  getGitPlatform,
  GitServer,
  cretaePlatformPath,
  cretaeTokenTempPath,
  cretaeOwnPath,
  cretaeLoginPath,
  getGitOwn,
  getGitLogin,
}
