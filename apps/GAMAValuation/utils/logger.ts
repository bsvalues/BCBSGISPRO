/**
 * Logger utility for the GAMAValuation module
 */

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [GAMAValuation] ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [GAMAValuation] ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [GAMAValuation] ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] [GAMAValuation] ${message}`, ...args);
    }
  }
};