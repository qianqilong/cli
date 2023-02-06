import { GitServer } from './GitServer.js'
import axios from 'axios'
import log from '../log.js'

const BASE_URL = 'https://gitee.com/api/v5'

class Gitee extends GitServer {
  constructor() {
    super()
    this.service = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
    })

    // 响应拦截
    this.service.interceptors.response.use(
      (response) => {
        return response
      },
      (err) => {
        return Promise.reject(err)
      },
    )
  }
  get(url, params, headers) {
    return this.service({
      url,
      params: {
        ...params,
        access_token: this.token,
      },
      method: 'get',
      headers,
    })
  }
  post(url, data, headers) {
    return this.service({
      url,
      data: {
        ...data,
        access_token: this.token,
      },
      method: 'post',
      headers,
    })
  }
  // 搜索仓库
  searchRepositories(params) {
    return this.get('/search/repositories', params)
  }
  // 获取版本
  getTags(fullName) {
    return this.get(`/repos/${fullName}/tags`)
  }
  // 仓库链接
  getRepoUrl(fullName) {
    return `https://gitee.com/${fullName}.git`
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
    return this.get(`/repos/${owner}/${repo}`)
  }
  // 创建仓库
  async createRepo(name) {
    // 检查远程仓库是否存在
    let repo
    try {
      repo = await this.getRepo(this.login, name)
      log.success('仓库已存在,成功返回')
    } catch (error) {
      log.info('', '仓库不存在开始创建')
      repo =
        this.own === 'user'
          ? await this.post('/user/repos', { name })
          : await this.post(`/orgs/${this.login}/repos`, { name })
      log.success('创建仓库成功')
    }
    return repo
  }
}

export default Gitee
