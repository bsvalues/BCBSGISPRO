import { WebSocketServerManager } from '../websocket-manager';

declare global {
  var wsManager: InstanceType<typeof WebSocketServerManager> | undefined;
}

export {};