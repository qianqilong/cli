// @ts-nocheck
import { log } from '@qqlwwq/utils'

class Command {
  constructor(instance) {
    if (!instance) {
      throw new Error('command instance must not be null!')
    }
    this.program = instance
    // 注册命令
    const cmd = this.program.command(this.command) // 注册命令
    cmd.description(this.description) // 介绍
    cmd.hook('preAction', () => {})
    cmd.hook('postAction', () => {})
    // options的注册
    if (this.options?.length > 0) {
      this.options.forEach((option) => {
        // @ts-ignore
        cmd.option(...option)
      })
    }
    cmd.action((...params) => {
      // @ts-ignore
      this.action(params)
    })
  }
  get command() {
    throw new Error('command must be implements')
  }
  get description() {
    throw new Error('description must be implements')
  }
  get options() {
    return []
  }
  action([name, option]) {
    log.verbose('init', name, option)
  }
  preAction() {}
  postAction() {}
}

export default Command
