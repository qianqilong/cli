// @ts-nocheck vuex-cli-webpack
import Command from '@qqlwwq/command'
import { log, makeList, makeInput, printErrorLog, initGenerateGitAPI } from '@qqlwwq/utils'
import ora from 'ora'

const PREV_PAGE = '${prev_page}'
const NEXT_PAGE = '${next_page}'
const SEARCH_MODE_REPO = 'search_repo'
const SEARCH_MODE_CODE = 'search_code'
class InstallCommand extends Command {
  get command() {
    return 'install [name]'
  }
  get description() {
    return 'install project'
  }
  async action() {
    // 获取api类型
    await this.generateGitAPI()
    // 获取搜索关键词
    await this.searchGitAPI()
    // 选择版本号
    await this.selectTags()
    // 下载仓库
    await this.downloadRepo()
    // 安装依赖
    await this.instanceDependencies()
    // 运行项目
    await this.runRepo()
  }
  // 下载源码
  async downloadRepo() {
    let spinner
    try {
      spinner = ora(`正在下载${this.keyword}(${this.selectTag})...`).start()
      await this.gitAPI.cloneRepo(this.keyword, this.selectTag)
      spinner.stop()
      log.success('下载成功')
    } catch (error) {
      spinner.stop()
      printErrorLog(error)
    }
  }
  // 安装依赖
  async instanceDependencies() {
    let spinner
    try {
      this.pack = await makeList({
        message: '选择所用的包管理器',
        choices: [
          {
            name: 'yarn',
            value: 'yarn',
          },
          {
            name: 'npm',
            value: 'npm',
          },
        ],
      })
      spinner = ora(`正在安装依赖${this.keyword}(${this.selectTag})...`).start()
      await this.gitAPI.instanceDependencies(process.cwd(), this.keyword, this.pack)
      spinner.stop()
      log.success('安装依赖成功')
    } catch (error) {
      spinner.stop()
      printErrorLog(error)
    }
  }
  // 运行项目
  async runRepo() {
    await this.gitAPI.runRepo(process.cwd(), this.keyword, this.pack)
  }
  // 选择平台
  async generateGitAPI() {
    const { platform, gitAPI } = await initGenerateGitAPI()
    this.gitAPI = gitAPI
    // 存储类型
    gitAPI.savePlatform(platform)
  }
  // 搜索
  async searchGitAPI() {
    // 搜索模式
    const platform = this.gitAPI.getPlatform()
    if (platform === 'github') {
      this.mode = await makeList({
        message: '请选择搜索模式',
        choices: [
          {
            name: '仓库',
            value: SEARCH_MODE_REPO,
          },
          {
            name: '源码',
            value: SEARCH_MODE_CODE,
          },
        ],
      })
    } else {
      this.mode = SEARCH_MODE_REPO
    }
    // 收集搜索关键字
    this.q = await makeInput({
      message: '请输入搜索关键词',
      validate(value) {
        if (value.length > 0) {
          return true
        } else {
          return '请输入搜索关键词'
        }
      },
    })
    // 获取开发语言
    this.language = await makeInput({
      message: '请输入开发语言',
    })
    // 第几页
    this.page = 1
    await this.doSearch()
  }
  // 搜索逻辑
  async doSearch() {
    // 平台类型
    const platform = this.gitAPI.getPlatform()
    // 参数
    let params
    //渲染列表
    let list
    // 数据条数
    let count
    if (platform === 'github') {
      // github
      params = {
        q: this.q + (this.language ? `+language:${this.language}` : ''),
        order: 'desc',
        sort: 'stars',
        per_page: 3,
        page: this.page,
      }
      // 判断搜索模式
      const searchList =
        this.mode === SEARCH_MODE_CODE
          ? await this.gitAPI.searchCode(params)
          : await this.gitAPI.searchRepositories(params)
      // 数据条数
      count = searchList.total_count
      // 数据列表
      list = searchList.items.map((item) => ({
        name: `${item.full_name ?? item.repository.full_name}(${item.description ?? item.repository.description})`,
        value: item.full_name ?? item.repository.full_name,
      }))
    } else {
      // gitee
      params = {
        q: this.q,
        language: 'JavaScript',
        order: 'desc',
        sort: 'stars_count',
        per_page: 3,
        page: this.page,
      }
      const { data: searchList, headers } = await this.gitAPI.searchRepositories(params)
      // 数据总的条数
      count = headers.total_count
      // 数据列表
      list = searchList.map((item) => ({
        name: `${item.full_name}(${item.description.substr(0, 100)})`,
        value: item.full_name,
      }))
    }
    log.verbose('params', params, platform)
    // 添加分页功能
    if (this.page * 3 < count) {
      list.push({
        name: '下一页',
        value: NEXT_PAGE,
      })
    }
    if (this.page > 1) {
      list.unshift({
        name: '上一页',
        value: PREV_PAGE,
      })
    }
    // 用户选择的项目
    const keyword = await makeList({
      message: `请选择要下载的项目(共${count}条数据)`,
      choices: list,
    })
    // 判断上一页还是下页或者下载
    if (keyword === NEXT_PAGE) {
      // 上一页
      await this.nextPage()
    } else if (keyword === PREV_PAGE) {
      // 下一页
      await this.prevPage()
    } else {
      // 下载
      this.keyword = keyword
    }
  }
  // 下一页
  async nextPage() {
    this.page++
    await this.doSearch()
  }
  // 上一页
  async prevPage() {
    this.page--
    await this.doSearch()
  }
  // 选择版本
  async selectTags() {
    this.tagPage = 1
    this.tagPrePage = 4
    if (this.gitAPI.getPlatform() === 'github') {
      await this.doSelectGithubTags()
    } else {
      await this.doSelectGiteeTags()
    }
  }
  // github选择列表渲染
  async doSelectGithubTags() {
    const params = {
      page: this.tagPage,
      per_page: this.tagPrePage,
    }
    const tagsList = await this.gitAPI.getTags(this.keyword, params)
    // 生成渲染列表
    const tagsListChoices = tagsList.map((item) => ({
      name: item.name,
      value: item.name,
    }))
    // 添加分页功能
    if (this.tagPage > 1) {
      tagsListChoices.unshift({
        name: '上一页',
        value: PREV_PAGE,
      })
    }
    if (tagsList.length === this.tagPrePage) {
      tagsListChoices.push({
        name: '下一页',
        value: NEXT_PAGE,
      })
    }
    // 选择版本
    const selectTag = await makeList({
      message: '请选择版本',
      choices: tagsListChoices,
    })
    // 判断上一页还是下页或者下载
    if (selectTag === NEXT_PAGE) {
      await this.nextTags()
    } else if (selectTag === PREV_PAGE) {
      await this.prevTags()
    } else {
      // 下载
      this.selectTag = selectTag
    }
  }
  // gitee选择列表渲染
  async doSelectGiteeTags() {
    const { data: tagsList } = await this.gitAPI.getTags(this.keyword)
    function group(array, subNum) {
      let index = 0
      let newArray = []
      while (index < array.length) {
        newArray.push(array.slice(index, (index += subNum)))
      }
      return newArray
    }
    // 数组分组
    const groupTagsList = group(tagsList, this.tagPrePage)
    // 生成渲染列表
    const tagsListChoices = groupTagsList[this.tagPage - 1].map((item) => ({
      name: item.name,
      value: item.name,
    }))
    // 添加分页功能
    if (this.tagPage > 1) {
      tagsListChoices.unshift({
        name: '上一页',
        value: PREV_PAGE,
      })
    }
    if (this.tagPage < groupTagsList.length + 1) {
      tagsListChoices.push({
        name: '下一页',
        value: NEXT_PAGE,
      })
    }
    // 选择版本
    const selectTag = await makeList({
      message: '请选择版本',
      choices: tagsListChoices,
    })

    // 判断上一页还是下页或者下载
    if (selectTag === NEXT_PAGE) {
      await this.nextTags()
    } else if (selectTag === PREV_PAGE) {
      await this.prevTags()
    } else {
      // 下载
      this.selectTag = selectTag
    }
  }
  // 下一页tag
  async nextTags() {
    this.tagPage++
    if (this.gitAPI.getPlatform() === 'github') {
      await this.doSelectGithubTags()
    } else {
      await this.doSelectGiteeTags()
    }
  }
  // 上一页tag
  async prevTags() {
    this.tagPage--
    if (this.gitAPI.getPlatform() === 'github') {
      await this.doSelectGithubTags()
    } else {
      await this.doSelectGiteeTags()
    }
  }
}

export default function Install(instance) {
  return new InstallCommand(instance)
}
