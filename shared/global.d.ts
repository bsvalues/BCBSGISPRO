import http from 'http';

/**
 * Global type declarations for the application
 */
declare global {
  var server: http.Server;
  
  namespace NodeJS {
    interface Global {
      server: http.Server;
    }
  }
}

// This export is necessary to make this file a module
export {};