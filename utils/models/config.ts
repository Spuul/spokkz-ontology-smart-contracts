
export interface OntologyConfig {
  avmFiles: string;
  network: {
    [networkType: string]: {
      method: 'rpc' | 'rest' | 'websocket';
      host: string;
      wallet: any;
    }
  };
}