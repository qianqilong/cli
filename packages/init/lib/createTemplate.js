// @ts-nocheck
import { log, makeList, makeInput, request, printErrorLog } from '@qqlwwq/utils'
import { homedir } from 'node:os' // 用户主目录
import path from 'node:path'

/**
 * examples:
 * qqlcli init aa -t project -tp vue-template -f
 * qqlcli init
 */
const ADD_TEMPLATE = [
  {
    name: 'vue3项目模板',
    value: 'vue-template',
    npmName: '@qqlwwq/vue-template',
    version: '1.0.3',
  },
  {
    name: 'react18项目模板',
    value: 'react-template',
    npmName: '@qqlwwq/react-template',
    version: '1.0.0',
  },
]
const ADD_TYPE_PROJECT = 'project'
const ADD_TYPE_PAGE = 'page'
const ADD_TYPE = [
  { name: '项目', value: ADD_TYPE_PROJECT },
  { name: '页面', value: ADD_TYPE_PAGE },
]
const TEMP_HOME = '.qql-cli'
// 获取创建类型
function getAddType() {
  return makeList({
    choices: ADD_TYPE,
    message: '请选择初始化类型',
    defaultValue: ADD_TYPE_PROJECT,
  })
}
// 获取项目名称
function getAddName() {
  return makeInput({
    message: '请输入项目名称',
    defaultValue: '',
    validate(v) {
      if (v.length > 0) {
        return true
      }
      return '项目名称必须输入'
    },
  })
}
// 获取选择项目模板
function getAddTemlate() {
  return makeList({
    choices: ADD_TEMPLATE,
    message: '请选择项目模板',
  })
}
// 安装缓存目录
function makeTargetPath() {
  return path.resolve(`${homedir()}/${TEMP_HOME}`, 'addTemplates')
}
// 通过api获取项目模板
async function getTemplateAPI() {
  try {
    const data = await request({
      url: '/project/template',
      method: 'get',
    })
    return data
  } catch (error) {
    printErrorLog(error)
    return
  }
}
export default async function (name = null, opts) {
  const { type = null, template = null } = opts
  // 选择的文件类型
  let addType
  if (type) {
    if (!ADD_TYPE.find((item) => item.value === type)) {
      throw new Error(`创建的项目类型 ${type} 不支持`)
    }
    addType = type
  } else {
    addType = await getAddType()
  }
  log.verbose('addType', addType)

  if (addType === ADD_TYPE_PROJECT) {
    const addName = name ? name : await getAddName()
    log.verbose('addName', addName)
    // 选择项目模板
    let addTemplate
    if (template) {
      if (!ADD_TEMPLATE.find((tp) => tp.value === template)) {
        throw new Error(`项目模板 ${template} 不存在`)
      }
      addTemplate = template
    } else {
      addTemplate = await getAddTemlate()
    }
    log.verbose('addTemplate', addTemplate)
    const selectTemplact = ADD_TEMPLATE.find((item) => item.value === addTemplate)
    log.verbose('selectTemplact', selectTemplact)
    // 获取npm版本号

    const targetPath = makeTargetPath()
    return {
      type: addType,
      name: addName,
      template: selectTemplact,
      targetPath,
    }
  }
}
