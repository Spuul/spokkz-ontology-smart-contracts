
import {Wallet, Account, Crypto, RestClient, RpcClient, WebsocketClient} from 'ontology-ts-sdk';
import { join, parse } from 'path';
import { readFileSync, readFile } from 'fs';
import * as glob from 'glob';

import { OntologyConfig } from './models';

export class ConfigLoader {
  avm: { [contract: string]: string } = {};
  client: RestClient | RpcClient | WebsocketClient;
  forSign: {
    address: Crypto.Address,
    privateKey: Crypto.PrivateKey;
  } = { address: undefined, privateKey: undefined };

  constructor(
    private options: OntologyConfig,
    private mode: string,
    private workingDirectory: string
  ) {
    this.loadAvm();
    this.loadClient();
    this.loadAccount();
  }

  private loadAvm(): void {
    const matchFiles = glob.sync(
      join(this.workingDirectory, this.options.avmFiles), { ignore: '**/node_modules/**', absolute: true }
    );

    matchFiles.forEach((filePath: string) => {
      const basename = parse(filePath).name;
      Object.assign(this.avm, { [basename]: readFileSync(filePath).toString('hex') });
    });
  }

  private loadClient(): void {
    const method = this.option.method;
    const url = this.option.host;

    switch (method) {
      case 'rpc':
        this.client = new RpcClient(url);
        break;
      case 'rest':
        this.client = new RestClient(url);
        break;
      case 'websocket':
        this.client = new WebsocketClient(url);
        break;
    }
  }

  private loadAccount(): void {
    const wallet = this.option.wallet;

    if (wallet.privateKey !== undefined) {
      this.forSign.address = new Crypto.Address(wallet.address);
      this.forSign.privateKey = new Crypto.PrivateKey(wallet.privateKey);
    } else {
      const walletInfo = Wallet.fromWalletFile(JSON.parse(readFileSync(join(this.workingDirectory, wallet.file)).toString()));

      // select account. If default account is set, search the address and select it
      // or select the first account if not exist.
      let account = undefined;
      if (walletInfo.defaultAccountAddress) {
        account = walletInfo.accounts.filter(
          (account: Account) => account.address.value === walletInfo.defaultAccountAddress
        )[0];
      }

      if (account === undefined) {
        account = walletInfo.accounts[0];
      }

      // get the address and private key from default account
      this.forSign.address = account.address;
      this.forSign.privateKey = account.encryptedKey.decrypt(wallet.password, account.address, account.salt, {
        cost: walletInfo.scrypt.n,
        blockSize: walletInfo.scrypt.r,
        parallel: walletInfo.scrypt.p,
        size: walletInfo.scrypt.dkLen
      });
    }
  }

  get option() {
    return this.options.network[this.mode];
  }
}

const defaultConfig = require(join(__dirname, '..', 'ontology.json'));
export const TestConfig = new ConfigLoader(defaultConfig, defaultConfig.testNetwork, join(__dirname, '..'));
