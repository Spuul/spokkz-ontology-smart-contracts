import { ConfigLoader } from "./config-loader";
import {TransactionBuilder, RestClient, RpcClient, WebsocketClient, Crypto, Transaction, utils} from 'ontology-ts-sdk';
import { waitForTransactionReceipt } from './transaction';

export class Deployer {
  forSign: {
    address: Crypto.Address,
    privateKey: Crypto.PrivateKey
  } = null;

  constructor(
    private config: ConfigLoader
  ) {
    this.forSign = config.forSign;
  }

  async deploy(contractName: string, initFunc?: string) {
    const avm = this.config.avm[contractName];
    const privateKey = this.config.forSign.privateKey;
    const payer = this.config.forSign.address;
    const client = this.config.client;

    const tx = TransactionBuilder.makeDeployCodeTransaction(
      avm,
      '',
      '',
      '',
      '',
      '',
      true,
      '0',
      '20400000',
      payer
    );

    TransactionBuilder.signTransaction(tx, privateKey);
    await this.client.sendRawTransaction(tx.serialize());

    return new DeployedTransaction(client, avm, tx, initFunc, payer, privateKey);
  }

  get client() {
    return this.config.client;
  }
}

export class DeployedTransaction {
  public address: Crypto.Address;
  public codeHash: string;

  constructor(
    private client: RestClient | RpcClient | WebsocketClient,
    private avm: string,
    private tx: Transaction,
    private initFunc?: string,
    private payer?: Crypto.Address,
    private privateKey?: Crypto.PrivateKey
  ) {
    this.codeHash = Crypto.Address.fromVmCode(this.avm).toHexString();
    this.address = new Crypto.Address(utils.reverseHex(this.codeHash));
  }

  async deployed() {
    // send getContractJson for every 1 second and check
    // the contract code is deployed.
    // if not deployed over 60 seconds, return error.
    const codeDeployTxReceipt = await this.waitForTransactionReceipt(utils.reverseHex(this.tx.getSignContent()));

    // if initFunc is defined, call and wait the function call transaction.
    if (this.initFunc) {
      const tx = TransactionBuilder.makeInvokeTransaction(
        this.initFunc,
        [],
        this.address,
        '500',
        '20000',
        this.payer
      );
      TransactionBuilder.signTransaction(tx, this.privateKey);
      await this.client.sendRawTransaction(tx.serialize());
      return await this.waitForTransactionReceipt(utils.reverseHex(tx.getSignContent()));
    }
    return codeDeployTxReceipt;
  }

  private async waitForTransactionReceipt(txHash: string, options?: any) {
    return await waitForTransactionReceipt(this.client, txHash, options);
  }
}

export const TestDeployer = new Deployer(require('./config-loader').TestConfig);
