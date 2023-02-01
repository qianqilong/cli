#!/usr/bin/env node

import importLocal from 'import-local'
import log from 'npmlog'
import entry from '../lib/index.js'
import { filename } from 'dirname-filename-esm'

const __filename = filename(import.meta)

// @ts-ignore
if (importLocal(__filename)) {
  log.info('cli', '使用本地版本')
} else {
  // @ts-ignore
  entry(process.argv.slice(2))
}
