import { Console } from 'console';
import fs from 'fs';

const postfix = new Date().toDateString()

const customConsole = new Console({
  stdout: fs.createWriteStream(`logs/info_${postfix}.txt`, { flags: 'a' }),
  stderr: fs.createWriteStream(`logs/errors_${postfix}.txt`, { flags: 'a' }),
});

export const logger = {
  ...customConsole,
  log: (...args: any) => {
    const params = [new Date().toLocaleString(), '-', ...args]
    process.env.NODE_ENV === 'dev' && console.log(...params)
    customConsole.log(...params)
  },
  error: (...args: any) => {
    const params = [new Date().toLocaleString(), '-', ...args]
    process.env.NODE_ENV === 'dev' && console.warn(...params)
    customConsole.error(...params)
  },
}
