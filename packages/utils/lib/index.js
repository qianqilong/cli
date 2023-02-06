'use strict'

import log from './log.js'
import isDebug from './isDebug.js'
import { makeList, makeInput, makePassword } from './inquirer.js'
import printErrorLog from './printError.js'
import request from './request.js'
import Github from './git/github.js'
import Gitee from './git/gitee.js'
import {
  getGitPlatform,
  cretaePlatformPath,
  cretaeTokenTempPath,
  cretaeOwnPath,
  cretaeLoginPath,
  getGitOwn,
  getGitLogin,
} from './git/GitServer.js'
import { initGenerateGitAPI, initGitType, clearCache, isClearCache, initRemoteRepo } from './git/gitUtils.js'

export {
  initRemoteRepo,
  clearCache,
  isClearCache,
  cretaeTokenTempPath,
  initGitType,
  isDebug,
  log,
  makeList,
  makeInput,
  printErrorLog,
  request,
  Github,
  Gitee,
  makePassword,
  getGitPlatform,
  initGenerateGitAPI,
  cretaePlatformPath,
  cretaeOwnPath,
  cretaeLoginPath,
  getGitOwn,
  getGitLogin,
}
