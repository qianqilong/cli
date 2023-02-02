import { GitServer } from './GitServer.js'
import axios from 'axios'

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
}

export default Github
