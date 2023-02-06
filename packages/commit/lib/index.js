// @ts-nocheck
import Command from '@qqlwwq/command'
import {
  log,
  initGenerateGitAPI,
  initGitType,
  isClearCache,
  clearCache,
  initRemoteRepo,
  makeList,
  makeInput,
} from '@qqlwwq/utils'
import path from 'node:path'
import fs from 'node:fs'
import fse from 'fs-extra'
import simpleGit from 'simple-git'
import semver from 'semver'

class CommitCommand extends Command {
  get command() {
    return 'commit'
  }

  get description() {
    return 'commit project'
  }

  get options() {
    return [
      ['-c --clear', '清空缓存', false],
      ['-p --publish', '发布', false],
    ]
  }

  async action([params, publish]) {
    log.verbose('params', params)
    params.clear ? clearCache() : await isClearCache()
    // 创建远程仓库
    await this.createRemoteRepo()
    // 本地初始化
    await this.initLocal()
    // 代码自动提交
    await this.commit()
    // 发布
    if (publish) {
      this.publish()
    }
  }

  // 创建远程仓库
  async createRemoteRepo() {
    const { platform, gitAPI } = await initGenerateGitAPI()
    this.gitAPI = gitAPI
    log.verbose('platform', platform)
    // 仓库类型选择(组织，用户)
    await initGitType(gitAPI)
    // 创建仓库
    const dir = process.cwd()
    const pkg = fse.readJSONSync(path.resolve(dir, 'package.json'))
    this.name = pkg.name
    this.version = pkg.version || '1.0.0'
    await initRemoteRepo(gitAPI, pkg.name)
    // 生成忽略文件
    const gitIgnorePath = path.resolve(dir, '.gitignore')
    if (!fs.existsSync(gitIgnorePath)) {
      fs.writeFileSync(gitIgnorePath, 'node_modules')
    }
  }
  // 本地初始化
  async initLocal() {
    const dir = process.cwd()
    // 生成远程仓库地址
    const remoteUrl = this.gitAPI.getRepoUrl(`${this.gitAPI.login}/${this.name}`)
    // 初始化git对象
    this.git = simpleGit(dir)
    // 是否git初始化
    const gitDir = path.resolve(dir, '.git')
    if (!fs.existsSync(gitDir)) {
      // 初始化.git
      await this.git.init()
      log.success('完成git初始化')
    }
    // 获取所有remotes
    const remotes = await this.git.getRemotes()
    // 跟踪代码
    if (!remotes.find((remote) => remote.name === 'origin')) {
      this.git.addRemote('origin', remoteUrl)
      log.success('添加git remote', remoteUrl)
      // 检查未提交代码，并跟踪
      await this.checkAdded()
    }
    // 检查是否存在master分支
    const tags = await this.git.listRemote(['--refs'])
    log.verbose('tags', tags)
    if (tags.indexOf('refs/heads/master') >= 0) {
      // 本地提交
      await this.checkCommitted()
      // 同步远程master分支
      await this.pullRemoteRepo('master', { '--allow-unrelated-histories': null })
    } else {
      // 本地提交
      await this.checkCommitted()
      // 远程提交
      await this.git.push('origin', 'master')
    }
  }
  // 代码自动化提交
  async commit() {
    // 自动生成版本号
    await this.getCorrectVersion()
    //代码stash检测
    await this.checkStash()
    // 代码冲突检测
    await this.checkConflicted()
    // 代码提交
    await this.checkCommitted()
    // 切换分支
    await this.checkOutBranch(this.branch)
    //合并远程master分支和开发分支
    await this.pullRemoteMasterAndBranch()
    // 推送分支到远程开发分支
    await this.pushRemoteRepo(this.branch)
  }
  // 发布
  async publish() {
    await this.checkTag()
    await this.checkOutBranch('master')
    await this.mergeBranchToMaster()
    await this.pushRemoteRepo('master')
    await this.deleteLocalBranch()
    await this.deleteRemoteBranch()
  }
  // 删除本地分支
  async deleteLocalBranch() {
    log.info('开始删除本地分支', this.branch)
    await this.git.deleteLocalBranch(this.branch)
    log.success('删除本地分支成功', this.branch)
  }
  // 删除远程分支
  async deleteRemoteBranch() {
    log.info('开始删除远程分支', this.branch)
    await this.git.push(['origin', '--delete', this.branch])
    log.success('删除远程分支成功', this.branch)
  }
  // 合并代码
  async mergeBranchToMaster() {
    log.info('开始合并代码', `[${this.branch}] -> [master]`)
    await this.git.mergeFromTo(this.branch, 'master')
    log.success('代码合并成功', `[${this.branch}] -> [master]`)
  }
  // 切换tag
  async checkTag() {
    log.info('获取远程 tag 列表')
    const tag = `release/${this.version}`
    // 远程tag
    const tagList = await this.getRemoteBranchList('release')
    if (tagList.includes(tag)) {
      log.info('远程 tag 已经存在', tag)
      await this.git.push(['origin', `:refs/tags/${tag}`])
      log.success('远程 tag 已删除')
    }
    // 本地tag
    const localTagList = await this.git.tags()
    if (localTagList.all.includes(tag)) {
      log.info('本地 tag 已经存在', tag)
      await this.git.tag(['-d', tag])
      log.success('本地 tag 已删除')
    }
    await this.git.addTag(tag)
    log.success('本地 tag 创建成功', tag)
    await this.git.pushTags('origin')
    log.success('远程 tag 推送成功', tag)
  }

  // 推送分支到远程开发分支
  async pushRemoteRepo(branchName) {
    log.info(`推送代码至远程 ${branchName} 分支`)
    await this.git.push('origin', branchName)
    log.info('推送代码成功')
  }
  // 切换分支
  async checkOutBranch(branchName) {
    const localBranchList = await this.git.branchLocal()
    if (localBranchList.all.indexOf(branchName) >= 0) {
      await this.git.checkout(branchName)
    } else {
      await this.git.checkoutLocalBranch(branchName)
    }
    log.success(`本地分支切换到${branchName}`)
  }
  // 合并远程master分支和开发分支
  async pullRemoteMasterAndBranch() {
    log.info(`合并 [master] -> [${this.branch}]`)
    await this.pullRemoteRepo('master')
    log.info('检查远程分支')
    const remoteBranchList = await this.getRemoteBranchList()
    if (remoteBranchList.indexOf(this.version) >= 0) {
      log.info(`合并 [${this.branch}] -> [${this.branch}]`)
      await this.pullRemoteRepo(this.branch)
      await this.checkConflicted()
      log.success(`合并远程 [${this.branch}] 分支成功`)
    } else {
      log.success(`不存在远程分支 [${this.branch}]`)
    }
  }
  // 同步远程 分支代码
  async pullRemoteRepo(branch = 'master', options = {}) {
    log.info(`同步远程${branch} 分支代码`)
    // 拉取master远程分支
    await this.git.pull('origin', branch, options).catch((e) => {
      log.verbose(e.message)
      if (e.message.indexOf("couldn't find remote ref master") >= 0) {
        log.warn('获取远程master分支失败')
      }
      // process.exit(0)
    })
  }
  // 代码分支获取
  async getCorrectVersion() {
    log.info('获取代码分支')
    const remoteBranchList = await this.getRemoteBranchList('release')
    // 远程代码分支版本
    let releaseVersion = null
    if (remoteBranchList && remoteBranchList.length > 0) {
      releaseVersion = remoteBranchList[0]
    }
    // 本地代码分支版本
    const devVersion = this.version
    // 同步远程的版本
    if (!releaseVersion) {
      this.branch = `dev/${devVersion}`
    } else if (semver.gt(devVersion, releaseVersion)) {
      log.info('当前版本号大于线上最新版本号', `${devVersion} > ${releaseVersion}`)
      this.branch = `dev/${devVersion}`
    } else {
      log.info('当前线上最新版本号大于本地版本号', `${releaseVersion} >= ${devVersion}`)
      const incType = await makeList({
        message: '自动升级版本,请选择升级版本的类型',
        defaultValue: 'patch',
        choices: [
          {
            name: `小版本(${releaseVersion}->${semver.inc(releaseVersion, 'patch')})`,
            value: 'patch',
          },
          {
            name: `中版本(${releaseVersion}->${semver.inc(releaseVersion, 'minor')})`,
            value: 'minor',
          },
          {
            name: `大版本(${releaseVersion}->${semver.inc(releaseVersion, 'major')})`,
            value: 'major',
          },
        ],
        /**x(major) y(minor) z(patch) */
      })
      const incVersion = semver.inc(releaseVersion, incType)
      this.branch = `dev/${incVersion}`
      this.version = incVersion
      this.syncVersionToPackageJson()
    }
    log.success(`代码分支获取成功 ${this.branch}`)
  }
  //  获取版本号
  async getRemoteBranchList(type) {
    const remoteList = await this.git.listRemote(['--refs'])
    let reg
    if (type === 'release') {
      // 远程分支
      reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d)/g
    } else {
      // 本地分支
      reg = /.+?refs\/tags\/dev\/(\d+\.\d+\.\d)/g
    }
    return remoteList
      .split('\n')
      .map((remote) => {
        const match = reg.exec(remote)
        reg.lastIndex = 0
        if (match && semver.valid(match[1])) {
          return match[1]
        }
      })
      .filter((_) => _)
      .sort((a, b) => {
        if (semver.lte(b, a)) {
          if (a === b) return 0
          return -1
        }
        return 1
      })
  }
  // 同步版本到package.json
  syncVersionToPackageJson() {
    const pkg = fse.readJSONSync(path.resolve(process.cwd(), 'package.json'))
    if (pkg && pkg.version !== this.version) {
      pkg.version = this.version
      console.log(pkg.version)
      fse.writeJSONSync(path.resolve(process.cwd(), 'package.json'), pkg, { spaces: 2 })
    }
  }
  // stash检测
  async checkStash() {
    log.info('检测 stash 记录')
    const stashList = await this.git.stashList()
    if (stashList.all.length > 0) {
      await this.git.stash(['pop'])
      log.success('stash pop 成功')
    }
  }
  // 代码冲突检测
  async checkConflicted() {
    log.info('代码冲突检测')
    const status = await this.git.status()
    if (status.conflicted.length > 0) {
      throw new Error('当前代码存在冲突,请手动处理合并后重试')
    }
  }
  // 跟踪检查代码
  async checkAdded() {
    const status = await this.git.status()
    if (status.not_added.length > 0 || status.modified.length > 0) {
      log.info('正在跟踪代码')
      await this.git.add('./*')
    }
  }
  // 提交代码
  async checkCommitted() {
    await this.checkAdded()
    const status = await this.git.status()
    if (status.staged.length > 0 || status.modified.length > 0) {
      const info = await makeInput({
        message: '请输入commit信息',
        defaultValue: '',
        validate(v) {
          if (v.length > 0) {
            return true
          }
          return 'commit信息必须输入'
        },
      })
      log.info('正在提交代码')
      // 本地提交
      await this.git.commit(`${info}`)
    }
  }
}

export default function Commit(instance) {
  return new CommitCommand(instance)
}
