/**
 * Logger utility for the DevOps module
 */

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [DevOps] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [DevOps] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [DevOps] ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] [DevOps] ${message}`, ...args);
    }
  }
};