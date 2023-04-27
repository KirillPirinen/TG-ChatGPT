// @ts-nocheck
import { spawn } from 'child_process';
import { logger } from './logger.js';
import path from 'path';

export const getAuthToken = () => {
  return new Promise<string>((resolve, reject) => {
    resolve(process.env.OPENAI_ACCESS_TOKEN)
    // const goProcess = spawn(path.resolve(process.env.PWD, './auth/main'))

    // const timeout = setTimeout(() => {
    //   reject('getAuthToken timeout')
    // }, 30e3)

    // goProcess.stdout.on('data', (data) => {
    //   const output = data.toString().trim();
    //   logger.log('getAuthToken data', data.toString().trim())
    //   clearTimeout(timeout)
    //   resolve(output);
    // });
    
    // goProcess.stderr.on('data', (data) => {
    //   logger.error('getAuthToken error', data.toString().trim())
    // });
  });
};
