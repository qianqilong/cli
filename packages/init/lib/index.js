// @ts-nocheck
import Command from '@qqlwwq/command'
import createTemplate from './createTemplate.js'
import downloadTemplate from './downloadTemplate.js'
import installTemplate from './installTemplate.js'
import { log } from '@qqlwwq/utils'

class InitCommand extends Command {
  get command() {
    return 'init [name]'
  }

  get description() {
    return 'init project'
  }

  get options() {
    return [
      ['-f --force', '是否强制更新', false],
      ['-t, --type <type>', '项目类型(project/page)'],
      ['-tp,--template <template>','模板名称']
    ]
  }

  async action([name, option]) {
    log.verbose('init', name, option)
    // 1.选择项目模板，生成模板信息
    const selectTemplact = await createTemplate(name, option)
    // 2.下载模板缓存目录
    await downloadTemplate(selectTemplact)
    // 3.安装项目到项目目录
    await installTemplate(selectTemplact, option)
  }
}

export default function Init(instance) {
  return new InitCommand(instance)
}
