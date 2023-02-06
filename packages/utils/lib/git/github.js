import { GitServer } from './GitServer.js'
import axios from 'axios'
import log from '../log.js'

const BASE_URL = 'https://api.github.com'

class Github extends GitServer {
  constructor() {
    super()
    this.service = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
    })
    // 请求拦截
    this.service.interceptors.request.use(
      (config) => {
        config.headers.Authorization = `Bearer ${this.token}`
        config.headers.Accept = 'application/vnd.github+json'
        return config
      },
      (err) => {
        return Promise.reject(err)
      },
    )
    // 响应拦截、
    this.service.interceptors.response.use(
      (response) => {
        return response.data
      },
      (err) => {
        return Promise.reject(err)
      },
    )
  }
  get(url, params, headers) {
    return this.service({
      url,
      params,
      method: 'get',
      headers,
    })
  }
  post(url, data, headers) {
    return this.service({
      url,
      data,
      method: 'post',
      headers,
    })
  }
  // 搜索仓库
  searchRepositories(params) {
    return this.get('/search/repositories', params)
  }
  //  搜索源码
  searchCode(params) {
    return this.get('/search/code', params)
  }
  // 获取版本
  getTags(fullName, params) {
    return this.get(`/repos/${fullName}/tags`, params)
  }
  // 仓库链接
  getRepoUrl(fullName) {
    return `https://github.com/${fullName}.git`
  }
  // 获取用户资料
  getUser() {
    return this.get('/user')
  }
  // 获取组织
  getOrg() {
    return this.get('/user/orgs')
  }
  /**
   * 获取仓库
   * @param {any} owner 仓库所属空间地址(企业、组织或个人的地址path)
   * @param {any} repo 仓库路径(path)
   * @returns
   */
  getRepo(owner, repo) {
    return this.get(`/repos/${owner}/${repo}`, {}, { accept: 'application/vnd.github+json' })
  }
  // 创建仓库
  async createRepo(name) {
    let repo
    try {
      repo = await this.getRepo(this.login, name)
      log.success('仓库已存在,成功返回')
    } catch (e) {
      repo =
        this.own === 'user'
          ? await this.post('/user/repos', { name }, { accept: 'application/vnd.github+json' })
          : await this.post(`/orgs/${this.login}/repos`, { name }, { accept: 'application/vnd.github+json' })
      log.success('创建仓库成功')
    }
    return repo
  }
}

export default Github
