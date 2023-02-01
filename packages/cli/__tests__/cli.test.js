// @ts-nocheck
import path from 'node:path'
import { execa } from 'execa'

const cli = path.join(__dirname, '../bin/cli.js')
const bin = () => () => execa(cli)

// 运行错误的命令，是否通过
test('run error command', () => {
  bin()()
})
