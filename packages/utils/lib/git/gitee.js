import { GitServer } from './GitServer.js'
import axios from 'axios'

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
}

export default Gitee
