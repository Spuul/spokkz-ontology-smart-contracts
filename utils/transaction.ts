
/**
 * Waits until mining a transaction.
 * @param client client
 * @param txHash transaction hash to wait.
 * @param options options for transaction wait.
 */
export async function waitForTransactionReceipt(client: any, txHash: string, options?: any): Promise<any> {

  if (!options) {
    options = {};
  }

  const checkInterval = options.checkInterval || 1000;
  const timeout = options.timeout || 60000;
  const checkOut = Math.ceil(timeout / checkInterval);

  return await new Promise<any>((resolve, reject) => {
    let checkCnt = 0;
    const minedCheckHandler = setInterval(() => {
      client.getRawTransactionJson(txHash).then((result: any) => {
        if (result.error === 0) {
          clearTimeout(minedCheckHandler);
          resolve(result);
        }

        else {
          if (checkCnt > checkOut) {
            clearTimeout(minedCheckHandler);
            resolve(false);
            // reject(new Error(`failed to mined over ${timeout} seconds`));
          } else {
            ++checkCnt;
          }
        }

      });
    }, checkInterval);
  });
}
