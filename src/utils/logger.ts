import { Console } from 'console';
import fs from 'fs';
import path from 'path';

const postfix = new Date().toDateString()

const isDev = process.env.NODE_ENV === 'dev'

const customConsole = new Console({
  stdout: fs.createWriteStream(path.normalize(`logs/info_${postfix}.txt`), { flags: 'a' }),
  stderr: fs.createWriteStream(path.normalize(`logs/errors_${postfix}.txt`), { flags: 'a' }),
});

export const logger = {
  ...customConsole,
  log: (...args: any) => {
    const params = [new Date().toLocaleString(), '-', ...args]
    isDev && console.log(...params)
    customConsole.log(...params)
  },
  error: (...args: any) => {
    const params = [new Date().toLocaleString(), '-', ...args]
    isDev && console.warn(...params)
    customConsole.error(...params)
  },
}
