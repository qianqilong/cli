// @ts-nocheck
import Command from '@qqlwwq/command'
import { log, printErrorLog } from '@qqlwwq/utils'
import { ESLint } from 'eslint'
import vueConfig from './eslint/vueConfig.js'
import { execa } from 'execa'
import ora from 'ora'
import jest from 'jest'
import Mocha from 'mocha'
import path from 'node:path'

class LintCommand extends Command {
  get command() {
    return 'lint'
  }

  get description() {
    return 'lint project'
  }

  get options() {
    return []
  }

  extractEslint(resultText, type) {
    const reg = eval(`/[0-9]+ ${type}/`)
    return resultText.match(reg)[0].match(/[0-9]+/)[0]
  }

  parseESLintResult(resultText) {
    const problems = this.extractEslint(resultText, 'problems')
    const errors = this.extractEslint(resultText, 'errors')
    const warning = this.extractEslint(resultText, 'warning')
    return { problems, errors, warning }
  }
  async action() {
    log.verbose('lint')
    // 1.eslint
    // 准备工作安装依赖
    const spinner = ora('正在下载依赖...').start()
    try {
      await execa('npm', ['install', '-D', 'eslint-plugin-vue'], { stdout: 'inherit' })
      await execa('npm', ['install', '-D', 'eslint-config-airbnb-base'], { stdout: 'inherit' })
      spinner.stop()
    } catch (error) {
      spinner.stop()
      printErrorLog(error)
    }

    // 运行
    const cwd = process.cwd()
    const lint = new ESLint({ cwd, overrideConfig: vueConfig })
    const results = await lint.lintFiles(['src/**/*.js', 'src/**/*.vue'])
    const formatter = await lint.loadFormatter('stylish')
    const resultText = formatter.format(results)
    console.log(resultText)
    const eslintResult = this.parseESLintResult(resultText)
    log.verbose('eslintResult', eslintResult)
    log.success('eslint检测完毕', `错误:${eslintResult.errors} ,警告:${eslintResult.warning}`)
    // 2.jest/mocha
    log.info('自动执行jest测试')
    await jest.run('test')
    log.success('jest测试执行成功')

    log.info('自动执行mocha测试')
    const mochaInstance = new Mocha()
    mochaInstance.addFile(path.resolve(cwd, '__tests__/mocha_test.js'))
    mochaInstance.run(() => {
      log.success('mocha测试执行成功')
    })
  }
}

export default function Lint(instance) {
  return new LintCommand(instance)
}
