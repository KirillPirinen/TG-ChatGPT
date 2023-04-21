import { spawn } from 'child_process';
import { logger } from './logger.js';
import path from 'path';

export const getAuthToken = () => {
  return new Promise<string>((resolve, reject) => {
    const goProcess = spawn(path.resolve(process.env.PWD, './auth/main'))

    const timeout = setTimeout(() => reject('getAuthToken timeout'), 20e3)

    goProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      clearTimeout(timeout)
      console.log('output', output)
      resolve(output);
    });
    
    goProcess.stderr.on('data', (data) => {
      logger.error('getAuthToken', data)
    });
  });
};
