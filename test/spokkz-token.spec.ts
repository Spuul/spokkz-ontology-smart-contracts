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

const privateKey = TestDeployer.forSign.privateKey;
const address = TestDeployer.forSign.address;

let timeout = { timeout: 5000 }

let contract: DeployedTransaction;
let spuulTokenizationContract: DeployedTransaction;

describe('SpokkzCoin Contract', () => {
  let randomAccount: { privateKey: Crypto.PrivateKey, address: Crypto.Address }[] = [];
  let client: RestClient | RpcClient | WebsocketClient;

  let isDeployed: () => Promise<boolean>;
  let getOwner: () => Promise<Crypto.Address>;
  let totalSupply: () => Promise<BigNumber>;

  let getBalance: (
    address: Crypto.Address
  ) => Promise<BigNumber>;

  let allowance: (
    _from: Crypto.Address,
    _to: Crypto.Address
  ) => Promise<BigNumber>;

  let approve: (
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: BigNumber | string,
    privateKey: Crypto.PrivateKey,
    payer: Crypto.Address
  ) => Promise<void>;

  let transfer: (
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: BigNumber | string,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<any>;

  let transferFrom: (
    _originator: Crypto.Address,
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: string | BigNumber,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<void>;

  let burn: (
    _amount: BigNumber | string,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<void>;

  let transferOwnership: (
    address: Crypto.Address,
    privateKey: Crypto.PrivateKey,
    payer: Crypto.Address
  ) => Promise<void>;

  before (async () => {
    // deploy the contract.
    contract = await TestDeployer.deploy('SpokkzCoin');

    console.log('ADDRESS!!!', contract.codeHash);

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

    totalSupply = async () => {
      const hexValue = (await client.getStorage(contract.codeHash, utils.str2hexstr('__SUPPLY'))).result;
      return new BigNumber((hexValue === null) ? '0' : utils.reverseHex(hexValue), 16);
    };

    getBalance = async (
      address: Crypto.Address
    ) => {
      const key = utils.str2hexstr('_____own') + address.serialize();
      const balance = (await client.getStorage(contract.codeHash, key)).result;
      return new BigNumber((typeof balance === 'string') ? utils.reverseHex(balance) : '00', 16);
    };

    approve = async (
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: BigNumber | string,
      privateKey: Crypto.PrivateKey,
      payer: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'approve',
        [
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
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

    allowance = async (
      _from: Crypto.Address,
      _to: Crypto.Address
    ) => {
      const key = utils.str2hexstr('___allow') + _from.serialize() + _to.serialize();
      const allowed = (await client.getStorage(contract.codeHash, key)).result;

      return (allowed === null) ? new BigNumber(0) : new BigNumber(utils.reverseHex(allowed), 16);
    };

    transfer = async (
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: BigNumber | string,
      privateKey: Crypto.PrivateKey,
      payer?: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'transfer',
        [
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
        ],
        contract.address,
        '0',
        '20000',
        payer || _from);

      TransactionBuilder.signTransaction(tx, privateKey);
      const txHash = (await client.sendRawTransaction(tx.serialize())).result;
      await waitForTransactionReceipt(client, txHash, timeout);
    };

    transferFrom = async (
      _originator: Crypto.Address,
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: string | BigNumber,
      privateKey: Crypto.PrivateKey,
      payer?: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'transferFrom',
        [
          new Parameter('_originator', ParameterType.ByteArray, _originator.serialize()),
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
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

    burn = async (
      _amount: BigNumber | string,
      privateKey: Crypto.PrivateKey,
      payer: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'burn',
        [
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
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

  // it ('should not be able to be deployed by other.', async () => {
  //   const [ other ] = randomAccount;
  //   const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], contract.address, '0', '20000', other.address);
  //   TransactionBuilder.signTransaction(tx, other.privateKey);
  //
  //   const txHash = (await client.sendRawTransaction(tx.serialize())).result;
  //   await waitForTransactionReceipt(client, txHash, timeout);
  //
  //   // since the address is not deployer, this transaction must be rejected.
  //   (await isDeployed()).should.be.equal(false);
  //
  // });

  it ('should deploy by deployer', async () => {
    const address = TestDeployer.forSign.address;
    const privateKey = TestDeployer.forSign.privateKey;
    const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], contract.address, '0', '20000', address);
    TransactionBuilder.signTransaction(tx, privateKey);

    const txHash = (await client.sendRawTransaction(tx.serialize())).result;
    await waitForTransactionReceipt(client, txHash);

    (await isDeployed()).should.be.equal(true);
  });

  // it ('should be owned by deployer', async () => {
  //   (await getOwner()).toBase58().should.be.equal(address.toBase58());
  // });
  //
  // it ('should supply all tokens to the deployer', async () => {
  //   const supply = await totalSupply();
  //   const deployerBalance = await getBalance(address);
  //
  //   supply.toString().should.be.equal(deployerBalance.toString());
  // });
  //
  // it ('should transfer tokens', async () => {
  //   const [ other ] = randomAccount;
  //   const transferValue = new BigNumber(1000);
  //   await transfer(address, other.address, transferValue, privateKey);
  //
  //   (await getBalance(other.address)).toString().should.be.equal(transferValue.toString());
  // });
  //
  // it ('should not transfer from other account', async () => {
  //   const [ _, other ] = randomAccount;
  //   await transfer(address, other.address, new BigNumber(1000), other.privateKey, other.address);
  //
  //   const otherBalance = await getBalance(other.address);
  //
  //   otherBalance.toString().should.be.equal(new BigNumber(0).toString());
  // });
  //
  // it ('should not transfer over the owning', async () => {
  //   const [ other, another ] = randomAccount;
  //   const otherBalance = await getBalance(other.address);
  //   const anotherBalance = await getBalance(another.address);
  //
  //   await transfer(other.address, another.address, otherBalance.plus(1000), other.privateKey);
  //   (await getBalance(another.address)).toString().should.be.equal(anotherBalance.toString());
  // });
  //
  // it ('should not transfer minus amount', async () => {
  //   const [ _, other ] = randomAccount;
  //
  //   // send to an address to 1000 tokens.
  //   await transfer(address, other.address, new BigNumber(1000), privateKey);
  //   const beforeBalance = await getBalance(other.address);
  //
  //   // try to send to the address -1 token.
  //   await transfer(address, other.address, 'ff', privateKey);
  //   const afterBalance = await getBalance(other.address);
  //
  //   // the first transfer transaction will be executed successfully, but the second
  //   // function call tries to send minus value, so it should not be executed.
  //   afterBalance.toString().should.be.equal(beforeBalance.toString());
  // });
  //
  // it ('should burn the tokens', async () => {
  //   const balanceBeforeBurned = await getBalance(address);
  //   const supplyBeforeBurned = await totalSupply();
  //
  //   // burn 1000 tokens.
  //   await burn(new BigNumber(1000), privateKey, address);
  //
  //   const balanceAfterBurned = await getBalance(address);
  //   const supplyAfterBurned = await totalSupply();
  //
  //   // since burning 1000 tokens, the balance after burning should be as small as 1000
  //   // with the balance before burning.
  //   balanceAfterBurned.plus(1000).toString().should.be.equal(balanceBeforeBurned.toString());
  //
  //   // the total supply should also be changed.
  //   supplyAfterBurned.plus(1000).toString().should.be.equal(supplyBeforeBurned.toString());
  // });
  //
  // it ('should not burn the tokens by other', async () => {
  //   const [ other ] = randomAccount;
  //   const supplyBeforeBurned = await totalSupply();
  //
  //   await burn(new BigNumber(1000), other.privateKey, other.address);
  //
  //   const supplyAfterBurned = await totalSupply();
  //
  //   // the total supply should be equal since `burn` is called by other, not owner, so
  //   // the transaction should be rejected.
  //   supplyAfterBurned.toString().should.be.not.equal('0');
  //   supplyBeforeBurned.toString().should.be.equal(supplyAfterBurned.toString());
  // });
  //
  // it ('should not burn minus value', async () => {
  //   const balanceBeforeBurned = await getBalance(address);
  //   const supplyBeforeBurned = await totalSupply();
  //
  //   // try to burn -1 tokens.
  //   await burn('ff', privateKey, address);
  //
  //   const balanceAfterBurned = await getBalance(address);
  //   const supplyAfterBurned = await totalSupply();
  //
  //   // should reject the `burn` call if minus value, so should minus value.
  //   balanceBeforeBurned.toString().should.be.equal(balanceAfterBurned.toString());
  //   supplyBeforeBurned.toString().should.be.equal(supplyAfterBurned.toString());
  // });
  //
  // it ('should not burn over the total supply', async () => {
  //   // calculate burning amount. The burning amount is [ total supply + 1000 ],
  //   // so it always satisfies that it is over the amount of balance the
  //   // owner has.
  //   const supplyBeforeBurned = await totalSupply();
  //   const burnValue = supplyBeforeBurned.plus(1000);
  //   const supplyAfterBurned = await totalSupply();
  //
  //   // try to burn [ total supply + 1000 ] tokens.
  //   await burn(burnValue, privateKey, address);
  //
  //   // the total supply should not be changed since trying to burn over the
  //   // total supply. (Or, if the owner balance is less than the burn amount,
  //   // it can be also rejected)
  //   supplyAfterBurned.toString().should.be.equal(supplyBeforeBurned.toString());
  // });
  //
  // it ('should approve token', async () => {
  //   const [ other ] = randomAccount;
  //
  //   const approveValue = new BigNumber(1000);
  //   // const beforeApprove = await allowance(address, other.address);
  //   await approve(address, other.address, approveValue, privateKey, address);
  //   const allowed = await allowance(address, other.address);
  //
  //   allowed.toString().should.be.equal(approveValue.toString());
  // });
  //
  // it ('should not approve token by other', async () => {
  //   const [ _, other ] = randomAccount;
  //
  //   const approveValue = new BigNumber(1000);
  //   await approve(address, other.address, approveValue, other.privateKey, other.address);
  //   const allowed = await allowance(address, other.address);
  //
  //   allowed.toString().should.be.equal('0');
  // });
  //
  // it ('should not approve over the own tokens', async () => {
  //   const [ other ] = randomAccount;
  //   const otherBalance = new BigNumber(await getBalance(other.address));
  //
  //   const beforeAllowed = await allowance(other.address, address);
  //
  //   // try to approve balance + 1000, so try over the own
  //   const approveValue = otherBalance.plus(1000);
  //   await approve(other.address, address, approveValue, other.privateKey, other.address);
  //
  //   const afterAllowed = await allowance(other.address, address);
  //
  //   // allowance should not be changed since approving over the account balance should be rejected.
  //   afterAllowed.toString().should.be.equal(beforeAllowed.toString());
  // });
  //
  // it ('should not approve minus value', async () => {
  //   const [ other ] = randomAccount;
  //
  //   const beforeAllowed = await allowance(other.address, address);
  //
  //   // try to approve -1
  //   const approveValue = 'ff';
  //   await approve(other.address, address, approveValue, other.privateKey, other.address);
  //
  //   const afterAllowed = await allowance(other.address, address);
  //
  //   // allowance should not be changed since approving minus value should be rejected.
  //   afterAllowed.toString().should.be.equal(beforeAllowed.toString());
  // });
  //
  // it ('should transfer approved tokens', async () => {
  //   const [ other, another ] = randomAccount;
  //   const approveValue = new BigNumber(1000);
  //   const transferValue = new BigNumber(500);
  //
  //   const beforeOwnerBalance = await getBalance(address);
  //   const beforeOtherBalance = await getBalance(other.address);
  //   const beforeAnotherBalance = await getBalance(another.address);
  //
  //   // approve other address to use 1000 tokens by the owner address
  //   await approve(address, other.address, approveValue, privateKey, address);
  //
  //   const allowed = await allowance(address, other.address);
  //
  //   // allowance should be 1000
  //   allowed.toString().should.be.equal(approveValue.toString());
  //
  //   // try to send 500 tokens from `owner` account to `another` account by `other` account
  //   await transferFrom(other.address, address, another.address, transferValue, other.privateKey, other.address);
  //
  //   const afterOwnerBalance = await getBalance(address);
  //   const afterOtherBalance = await getBalance(other.address);
  //   const afterAnotherBalance = await getBalance(another.address);
  //   const afterAllowed = await allowance(address, other.address);
  //
  //   // after transferred, allowance should be 500
  //   afterAllowed.toString().should.be.equal(allowed.minus(500).toString());
  //
  //   // check changed balances
  //   afterOwnerBalance.plus(500).toString().should.be.equal(beforeOwnerBalance.toString());
  //   afterOtherBalance.toString().should.be.equal(beforeOtherBalance.toString());
  //   afterAnotherBalance.minus(500).toString().should.be.equal(beforeAnotherBalance.toString());
  // });
  //
  // it ('should not transfer over the approved tokens', async () => {
  //   const [ other, another ] = randomAccount;
  //   const approveValue = new BigNumber(1000);
  //   const transferValue = new BigNumber(1500);
  //
  //   const beforeOwnerBalance = await getBalance(address);
  //   const beforeOtherBalance = await getBalance(other.address);
  //   const beforeAnotherBalance = await getBalance(another.address);
  //
  //   // approve other address to use 1000 tokens by the owner address
  //   await approve(address, other.address, approveValue, privateKey, address);
  //
  //   const allowed = await allowance(address, other.address);
  //
  //   // allowance should be 1000
  //   allowed.toString().should.be.equal(approveValue.toString());
  //
  //   // try to send 1500 tokens from `owner` account to `another` account by `other` account
  //   await transferFrom(other.address, address, another.address, transferValue, other.privateKey, other.address);
  //
  //   const afterOwnerBalance = await getBalance(address);
  //   const afterOtherBalance = await getBalance(other.address);
  //   const afterAnotherBalance = await getBalance(another.address);
  //   const afterAllowed = await allowance(address, other.address);
  //
  //   // after transferred, allowance should be 500
  //   afterAllowed.toString().should.be.equal(allowed.toString());
  //
  //   // check changed balances
  //   afterOwnerBalance.toString().should.be.equal(beforeOwnerBalance.toString());
  //   afterOtherBalance.toString().should.be.equal(beforeOtherBalance.toString());
  //   afterAnotherBalance.toString().should.be.equal(beforeAnotherBalance.toString());
  // });
  //
  // it ('should not transfer from another address', async () => {
  //   const [ other, another ] = randomAccount;
  //   const approveValue = new BigNumber(1000);
  //   const transferValue = new BigNumber(500);
  //
  //   const beforeOwnerBalance = await getBalance(address);
  //   const beforeOtherBalance = await getBalance(other.address);
  //   const beforeAnotherBalance = await getBalance(another.address);
  //
  //   // approve other address to use 1000 tokens by the owner address
  //   await approve(address, other.address, approveValue, privateKey, address);
  //
  //   const allowed = await allowance(address, other.address);
  //
  //   // allowance should be 1000
  //   allowed.toString().should.be.equal(approveValue.toString());
  //
  //   // try to send 500 tokens from `owner` account to `another` account by `another` account
  //   // it should be rejected
  //   await transferFrom(other.address, address, another.address, transferValue, another.privateKey, another.address);
  //
  //   const afterOwnerBalance = await getBalance(address);
  //   const afterOtherBalance = await getBalance(other.address);
  //   const afterAnotherBalance = await getBalance(another.address);
  //   const afterAllowed = await allowance(address, other.address);
  //
  //   // after transferred, allowance should be 500
  //   afterAllowed.toString().should.be.equal(allowed.toString());
  //
  //   // check changed balances
  //   afterOwnerBalance.toString().should.be.equal(beforeOwnerBalance.toString());
  //   afterOtherBalance.toString().should.be.equal(beforeOtherBalance.toString());
  //   afterAnotherBalance.toString().should.be.equal(beforeAnotherBalance.toString());
  // });
  //
  // it ('should not transfer ownership to other address by other', async () => {
  //   const [ other ] = randomAccount;
  //   const beforeOwner = await getOwner();
  //
  //   // try to transfer ownership by other address.
  //   // It should be rejected
  //   await transferOwnership(other.address, other.privateKey, other.address);
  //   const afterOwner = await getOwner();
  //
  //   beforeOwner.toBase58().should.be.equal(afterOwner.toBase58());
  // });
  //
  // it ('should transfer ownership to other address by owner', async () => {
  //   const [ other ] = randomAccount;
  //   const beforeOwner = await getOwner();
  //
  //   // try to transfer ownership by owner.
  //   await transferOwnership(other.address, privateKey, address);
  //   const afterOwner = await getOwner();
  //
  //   // check owner changed
  //   beforeOwner.toBase58().should.be.not.equal(other.address.toBase58());
  //   afterOwner.toBase58().should.be.equal(other.address.toBase58());
  //
  //   // new owner can burn tokens
  //   const beforeSupply = await totalSupply();
  //
  //   await burn(new BigNumber(1000), other.privateKey, other.address);
  //   const afterBurnSupply = await totalSupply();
  //
  //   // after burn, the total supply will be changed.
  //   afterBurnSupply.plus(1000).toString().should.be.equal(beforeSupply.toString());
  //
  //   // restore the owner
  //   await transferOwnership(address, other.privateKey, other.address);
  //   const finalOwner = await getOwner();
  //
  //   finalOwner.toBase58().should.be.equal(beforeOwner.toBase58());
  // });
});

describe('SpuulTokenization Contract', () => {
  let randomAccount: { privateKey: Crypto.PrivateKey, address: Crypto.Address }[] = [];
  let client: RestClient | RpcClient | WebsocketClient;

  let isDeployed: () => Promise<boolean>;

  let getOwner: () => Promise<Crypto.Address>;

  let transferOwnership: (
    address: Crypto.Address,
    privateKey: Crypto.PrivateKey,
    payer: Crypto.Address
  ) => Promise<void>;

  let getBalance: (
    address: Crypto.Address
  ) => Promise<BigNumber>;

  let allowance: (
    _from: Crypto.Address,
    _to: Crypto.Address
  ) => Promise<BigNumber>;

  let approve: (
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: BigNumber | string,
    privateKey: Crypto.PrivateKey,
    payer: Crypto.Address
  ) => Promise<void>;

  let transfer: (
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: BigNumber | string,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<any>;

  let transferFrom: (
    _originator: Crypto.Address,
    _from: Crypto.Address,
    _to: Crypto.Address,
    _amount: string | BigNumber,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<void>;

  let pay: (
    _from: Crypto.Address,
    _amount: string | BigNumber,
    _orderId: string,
    privateKey: Crypto.PrivateKey,
    payer?: Crypto.Address
  ) => Promise<any>;

  let amountPaid: (
    _orderId: string
  ) => Promise<BigNumber>;

  let getName: (
  ) => Promise<string>;

  before (async () => {
    // deploy the contract.
    spuulTokenizationContract = await TestDeployer.deploy('SpuulTokenization');

    console.log('TokenizationAddress!', spuulTokenizationContract.codeHash)

    await spuulTokenizationContract.deployed();
    client = TestDeployer.client;

    isDeployed = async () => {
      const key = utils.str2hexstr('DEPLOYED');
      const value = (await client.getStorage(spuulTokenizationContract.codeHash, key)).result;
      return (value !== null);
    };

    getOwner = async () => {
      const key = utils.str2hexstr('___OWNER');
      const hexAddress = (await client.getStorage(spuulTokenizationContract.codeHash, key)).result;
      return Crypto.Address.deserialize(new utils.StringReader(hexAddress));
    };

    getName = async () => {
      const key = utils.str2hexstr('NAME');
      const value = (await client.getStorage(spuulTokenizationContract.codeHash, key)).result;
      return utils.hexstr2str(value);
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
        spuulTokenizationContract.address,
        '0',
        '20000',
        payer
      );

      TransactionBuilder.signTransaction(tx, privateKey);
      const txHash = (await client.sendRawTransaction(tx.serialize())).result;
      await waitForTransactionReceipt(client, txHash, timeout);
    };

    getBalance = async (
      address: Crypto.Address
    ) => {
      const key = utils.str2hexstr('_____own') + address.serialize();
      const balance = (await client.getStorage(contract.codeHash, key)).result;
      return new BigNumber((typeof balance === 'string') ? utils.reverseHex(balance) : '00', 16);
    };

    approve = async (
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: BigNumber | string,
      privateKey: Crypto.PrivateKey,
      payer: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'approve',
        [
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
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

    allowance = async (
      _from: Crypto.Address,
      _to: Crypto.Address
    ) => {
      const key = utils.str2hexstr('___allow') + _from.serialize() + _to.serialize();
      const allowed = (await client.getStorage(contract.codeHash, key)).result;

      return (allowed === null) ? new BigNumber(0) : new BigNumber(utils.reverseHex(allowed), 16);
    };

    transfer = async (
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: BigNumber | string,
      privateKey: Crypto.PrivateKey,
      payer?: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'transfer',
        [
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
        ],
        contract.address,
        '0',
        '20000',
        payer || _from);

      TransactionBuilder.signTransaction(tx, privateKey);
      const txHash = (await client.sendRawTransaction(tx.serialize())).result;
      await waitForTransactionReceipt(client, txHash, timeout);
    };

    transferFrom = async (
      _originator: Crypto.Address,
      _from: Crypto.Address,
      _to: Crypto.Address,
      _amount: string | BigNumber,
      privateKey: Crypto.PrivateKey,
      payer?: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'transferFrom',
        [
          new Parameter('_originator', ParameterType.ByteArray, _originator.serialize()),
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_to', ParameterType.ByteArray, _to.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount))
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

    pay = async(
      _from: Crypto.Address,
      _amount: string | BigNumber,
      _orderId: string,
      privateKey: Crypto.PrivateKey,
      payer?: Crypto.Address
    ) => {
      const tx = TransactionBuilder.makeInvokeTransaction(
        'pay',
        [
          new Parameter('_from', ParameterType.ByteArray, _from.serialize()),
          new Parameter('_amount', ParameterType.ByteArray, num2ByteArray(_amount)),
          new Parameter('_orderId', ParameterType.ByteArray, utils.str2hexstr(_orderId)),
        ],
        spuulTokenizationContract.address,
        '0',
        '20000',
        payer);

        TransactionBuilder.signTransaction(tx, privateKey);
        const txHash = (await client.sendRawTransaction(tx.serialize())).result;
        await waitForTransactionReceipt(client, txHash, timeout);
    };

    amountPaid = async(
      _orderId: string
    ) => {
      const key = utils.str2hexstr('_____pay') + utils.str2hexstr(_orderId)
      const value = (await client.getStorage(spuulTokenizationContract.codeHash, key)).result;
      return (value === null) ? new BigNumber(0) : new BigNumber(utils.reverseHex(value), 16);
    };

    // generate 10 accounts for test.
    for (let i = 0; i < 10; ++i) {
      const privateKey = Crypto.PrivateKey.random();
      const address = Crypto.Address.fromPubKey(privateKey.getPublicKey());
      randomAccount.push({ privateKey, address });
    }
  });

  // it ('should not be able to be deployed by other.', async () => {
  //   const [ other ] = randomAccount;
  //   const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], spuulTokenizationContract.address, '0', '20000', other.address);
  //   TransactionBuilder.signTransaction(tx, other.privateKey);
  //
  //   const txHash = (await client.sendRawTransaction(tx.serialize())).result;
  //   await waitForTransactionReceipt(client, txHash, timeout);
  //
  //   // since the address is not deployer, this transaction must be rejected.
  //   (await isDeployed()).should.be.equal(false);
  // });

  it ('should deploy by deployer', async () => {
    const address = TestDeployer.forSign.address;
    const privateKey = TestDeployer.forSign.privateKey;
    const tx = TransactionBuilder.makeInvokeTransaction('deploy', [], spuulTokenizationContract.address, '0', '20000', address);
    TransactionBuilder.signTransaction(tx, privateKey);

    const txHash = (await client.sendRawTransaction(tx.serialize())).result;
    await waitForTransactionReceipt(client, txHash);

    (await isDeployed()).should.be.equal(true);
  });

  // it ('should be owned by deployer', async () => {
  //   (await getOwner()).toBase58().should.be.equal(address.toBase58());
  // });

  // it ('should not transfer ownership to other address by other', async () => {
  //   const [ other ] = randomAccount;
  //   const beforeOwner = await getOwner();
  //
  //   // try to transfer ownership by other address.
  //   // It should be rejected
  //   await transferOwnership(other.address, other.privateKey, other.address);
  //   const afterOwner = await getOwner();
  //
  //   beforeOwner.toBase58().should.be.equal(afterOwner.toBase58());
  // });
  //
  // it ('should transfer ownership to other address by owner', async () => {
  //   const [ other ] = randomAccount;
  //   const beforeOwner = await getOwner();
  //
  //   // try to transfer ownership by owner.
  //   await transferOwnership(other.address, privateKey, address);
  //   const afterOwner = await getOwner();
  //
  //   // check owner changed
  //   beforeOwner.toBase58().should.be.not.equal(other.address.toBase58());
  //   afterOwner.toBase58().should.be.equal(other.address.toBase58());
  //
  //   // restore the owner
  //   await transferOwnership(address, other.privateKey, other.address);
  //   const finalOwner = await getOwner();
  //
  //   finalOwner.toBase58().should.be.equal(beforeOwner.toBase58());
  // });

  it('should be able to transfer to contract', async() => {
    const approveValue = new BigNumber(100);

    await transfer(address, spuulTokenizationContract.address, approveValue, privateKey);
    (await getBalance(spuulTokenizationContract.address)).toString().should.be.equal(approveValue.toString())
  })

  it('should be able to transfer from contract', async() => {

    const approveValue = new BigNumber(100);
    await approve(address, spuulTokenizationContract.address, approveValue,privateKey,address);
      // verify if approve
    (await allowance(address,spuulTokenizationContract.address)).toString().should.be.equal(approveValue.toString())

    await transferFrom(address,address, spuulTokenizationContract.address, approveValue, privateKey, address);
    (await getBalance(spuulTokenizationContract.address)).toString().should.be.equal(approveValue.toString())
  })

  it('should pay by other', async () => {
    const [ other ] = randomAccount;

    // set up other to have balance and set up approved tokens
    const transferValue = new BigNumber(500);
    const approveValue = new BigNumber(100);

    await transfer(address, other.address, transferValue, privateKey);
    await approve(other.address, spuulTokenizationContract.address, approveValue, other.privateKey, other.address);

    const orderId = "ORDERID1234";
    const orderAmount = new BigNumber(50);

    const beforeSpuulTokenizationContractBalance = await getBalance(spuulTokenizationContract.address);

    await pay(other.address, orderAmount, orderId, other.privateKey, other.address);
    (await getBalance(spuulTokenizationContract.address)).toString().should.be.equal(beforeSpuulTokenizationContractBalance.plus(orderAmount).toString());

    const payment = await amountPaid(orderId);
    payment.toString().should.be.equal(orderAmount.toString())
  });
});
