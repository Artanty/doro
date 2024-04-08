// type TransactionFunc = () => Promise<any>;

// const queue: any[] = [];

// export function addToTransactionQueue(func: TransactionFunc): Promise<any> {
//   return new Promise<any>((resolve, reject) => {
//     queue.push({
//       func: func,
//       resolve: resolve,
//       reject: reject,
//     });
//     if (queue.length === 1) {
//       next();
//     }
//   });
// }

// function next() {
//   if (queue.length === 0) {
//     return;
//   }

//   const { func, resolve, reject } = queue.shift() as { func: TransactionFunc; resolve: (value: any) => void; reject: (reason?: any) => void; };

//   func()
//     .then(resolve)
//     .catch(reject);
// }
let transactionQueue: Promise<any> = Promise.resolve(); // Initialize with a resolved promise

export async function addToTransactionQueue<T>(callback: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  // Wrap the callback in a promise chain
  transactionQueue = transactionQueue.then(async () => {
    // Check the status of the Promise returned by the callback function
    const result = await callback(...args);
    if (result instanceof Promise) {
      return result;
    } else {
      return Promise.resolve(result);
    }
  }).catch((error) => {
    console.error('Error in transaction:', error);
    throw error; // Propagate the error to the next chained promise
  });
  return transactionQueue;
}
// let transactionQueue: Promise<any> = Promise.resolve(); // Initialize with a resolved promise

// export async function addToTransactionQueue<T>(callback: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
//   // Wrap the callback in a promise chain
//   transactionQueue = transactionQueue.then(async () => {
//     return await callback(...args); // Call the callback function with arguments
//   }).catch((error) => {
//     console.error('Error in transaction:', error);
//     throw error; // Propagate the error to the next chained promise
//   });
//   return transactionQueue;
// }

// export async function addToTransactionQueue(callback: (...args: any[]) => Promise<any>, ...args: any[]) {
//   // Wrap the callback in a promise chain
//   transactionQueue = transactionQueue.then(async () => {
//     await callback(...args); // Call the callback function with arguments
//   }).catch((error) => {
//     console.error('Error in transaction:', error);
//     throw error; // Propagate the error to the next chained promise
//   });
//   await transactionQueue;
// }

// export async function addToTransactionQueue(callback: () => Promise<any>) {
//   // Wrap the callback in a promise chain
//   transactionQueue = transactionQueue.then(async () => {
//     await callback();
//   }).catch((error) => {
//     console.error('Error in transaction:', error);
//   });
//   await transactionQueue;
// }