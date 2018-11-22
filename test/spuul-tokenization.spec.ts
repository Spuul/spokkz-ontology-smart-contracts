import { BigNumber } from 'bignumber.js';
import {
  Crypto,
  Parameter,
  ParameterType,
  RestClient,
  RpcClient,
  TransactionBuilder,
  utils,
  WebsocketClient
} from 'ontology-ts-sdk';
import { DeployedTransaction, TestDeployer } from "../utils/deployer";
import { waitForTransactionReceipt } from "../utils/transaction";
import chai from 'chai';
import { num2ByteArray } from "../utils/big-number";

chai.should();

describe('Spuul Tokenization', () => {
  const privateKey = TestDeployer.forSign.privateKey;
  const address = TestDeployer.forSign.address;

  let timeout = { timeout: 5000 }
  let contract: DeployedTransaction;
  let client: RestClient | RpcClient | WebsocketClient;

  let randomAccount: { privateKey: Crypto.PrivateKey, address: Crypto.Address }[] = [];

  let isDeployed: () => Promise<boolean>;
  let getOwner: () => Promise<Crypto.Address>;

  let transferOwnership: (
    address: Crypto.Address,
    privateKey: Crypto.PrivateKey,
    payer: Crypto.Address
  ) => Promise<void>;

  before(async() => {
    // deploy the contract.
    contract = await TestDeployer.deploy('SpuulTokenization');

    await contract.deployed();
    client = TestDeployer.client;

    isDeployed = async () => {
      const key = utils.str2hexstr('DEPLOYED');
      const value = (await client.getStorage(contract.codeHash, key)).result;
      return (value !== null);
    };

    getOwner = async () => {
      const key = utils.str2hexstr('___OWNER');
      const hexAddress = (await client.getStorage(contract.codeHash, key)).result;
      return Crypto.Address.deserialize(new utils.StringReader(hexAddress));
    };

    transferOwnership = async (
      address: Crypto.Address,
      privateKey: Crypto.PrivateKey,
      payer: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'transferOwnership',
        [
          new Parameter('_account', ParameterType.ByteArray, address.serialize())
        ],
        contract.address,
        '0',
        '20000',
        payer
      );

      TransactionBuilder.signTransaction(tx, privateKey);
      const txHash = (await client.sendRawTransaction(tx.serialize())).result;
      await waitForTransactionReceipt(client, txHash, timeout);
    };


    // generate 10 accounts for test.
    for (let i = 0; i < 10; ++i) {
      const privateKey = Crypto.PrivateKey.random();
      const address = Crypto.Address.fromPubKey(privateKey.getPublicKey());
      randomAccount.push({ privateKey, address });
    }
  });

  it ('should not be able to be deployed by other.', async () => {
    const [ other ] = randomAccount;
    const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], contract.address, '0', '20000', other.address);
    TransactionBuilder.signTransaction(tx, other.privateKey);

    const txHash = (await client.sendRawTransaction(tx.serialize())).result;
    await waitForTransactionReceipt(client, txHash, timeout);

    // since the address is not deployer, this transaction must be rejected.
    (await isDeployed()).should.be.equal(false);

  });

  it ('should deploy by deployer', async () => {
    const address = TestDeployer.forSign.address;
    const privateKey = TestDeployer.forSign.privateKey;
    const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], contract.address, '0', '20000', address);
    TransactionBuilder.signTransaction(tx, privateKey);

    const txHash = (await client.sendRawTransaction(tx.serialize())).result;
    await waitForTransactionReceipt(client, txHash);

    (await isDeployed()).should.be.equal(true);
  });

  it ('should be owned by deployer', async () => {
    (await getOwner()).toBase58().should.be.equal(address.toBase58());
  });

  it ('should not transfer ownership to other address by other', async () => {
    const [ other ] = randomAccount;
    const beforeOwner = await getOwner();

    // try to transfer ownership by other address.
    // It should be rejected
    await transferOwnership(other.address, other.privateKey, other.address);
    const afterOwner = await getOwner();

    beforeOwner.toBase58().should.be.equal(afterOwner.toBase58());
  });

  it ('should transfer ownership to other address by owner', async () => {
    const [ other ] = randomAccount;
    const beforeOwner = await getOwner();

    // try to transfer ownership by owner.
    await transferOwnership(other.address, privateKey, address);
    const afterOwner = await getOwner();

    // check owner changed
    beforeOwner.toBase58().should.be.not.equal(other.address.toBase58());
    afterOwner.toBase58().should.be.equal(other.address.toBase58());

    // restore the owner
    await transferOwnership(address, other.privateKey, other.address);
    const finalOwner = await getOwner();

    finalOwner.toBase58().should.be.equal(beforeOwner.toBase58());
  });

});
