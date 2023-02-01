// @ts-nocheck
// 判断是否是debug
export default function () {
  return process.argv.includes('--debug') || process.argv.includes('-d')
}
