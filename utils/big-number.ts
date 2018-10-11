
import { BigNumber } from 'bignumber.js';
import { utils } from 'ontology-ts-sdk';

export function num2ByteArray(num: string | BigNumber) {
  let hexAmount;

  if (typeof num !== 'string') {
    hexAmount = num.toString(16);
    if (hexAmount.length % 2 > 0) {
      hexAmount = '0' + hexAmount;
    }

    hexAmount = utils.reverseHex(hexAmount);
  } else {
    hexAmount = num;
  }

  return hexAmount;
}