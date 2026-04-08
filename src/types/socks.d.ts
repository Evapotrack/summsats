declare module 'socks-proxy-agent' {
  import { Agent } from 'https';
  export class SocksProxyAgent extends Agent {
    constructor(proxy: string);
  }
}
