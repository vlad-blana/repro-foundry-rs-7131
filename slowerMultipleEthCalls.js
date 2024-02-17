import { Contract, WebSocketProvider, Interface, Network } from 'ethers';
import chalk from 'chalk';

import { showSpinner, spawnAnvilForkChildProcess } from './utils.js';
import { config } from './anvil.config.js';

import multicall3Abi from './IMulticall3_abi.json' assert { type: 'json' };
import { chunk } from 'lodash-es';

const OLD_ANVIL_EXE_FILE_PATH = 'anvil.old.exe'; // 2 Jan 2024 or older
const LATEST_ANVIL_EXE_FILE_PATH = 'anvil.latest.exe'; // 14 Jan 2024 or newer

const contractAddresses = {
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  uniswapV2_Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
}

const uniswapV2FactoryContractInterface = new Interface([
  'function allPairs(uint256) external view returns (address pair)',
  'function allPairsLength() external view returns (uint256)'
]);

const readMultipleBalanceOfDemo = async (
  demoLabel,
  anvilExeFilePath,
  networkCode,
  forkNodeUrl,
  port,
  pairsCount = 10000,
  parallelCallsCount = 100,
  {
    accounts = 0,
    randomSeed = false,
    noMining = true,
    noStorageCaching = true,
    silent = true
  } = {}
) => {
  console.log(chalk.bold.underline(demoLabel));
  console.log();

  console.log('Spawning 1 anvil process...');

  const pi = spawnAnvilForkChildProcess(
    anvilExeFilePath,
    forkNodeUrl,
    port,
    {
      accounts,
      randomSeed,
      noMining,
      noStorageCaching,
      silent,
    }
  );

  console.log('Spawned 1 anvil processes');

  const anvilRpcWsUrl = 'ws://127.0.0.1:' + port;

  const d0 = new Date();
  const anvilProvider = await showSpinner(
    `Attempting to establish web socket connections with the anvil node...`,
    () => new Promise(resolve => {
      const init = () => {
        try {
          const provider = new WebSocketProvider(
            anvilRpcWsUrl,
            undefined,
            {
              staticNetwork: Network.from(networkCode)
            }
          );

          provider.websocket.on('open', () => resolve(provider));

          provider.websocket.on('error', () => setTimeout(init, 1));
        } catch (err) {
          // console.log(err);
          setTimeout(init, 1);
        }
      }

      init()
    })
  );

  console.log('Web socket connections established after', new Date().getTime() - d0.getTime(), 'ms');

  // ** eth_call **
  const multicall3Contract = new Contract(contractAddresses.multicall3, multicall3Abi, anvilProvider);

  const uniswapV2FactoryContract = new Contract(contractAddresses.uniswapV2_Factory, uniswapV2FactoryContractInterface, anvilProvider);
  const pairsLength = await uniswapV2FactoryContract.allPairsLength();
  console.log('Uniswap v2 factory pairs length', pairsLength);

  console.log(`Reading the first ${pairsCount} pairs in ${parallelCallsCount} parallel calls...`);
  const calls = [...new Array(pairsCount).keys()]
    .map(k => ({
      target: contractAddresses.uniswapV2_Factory,
      allowFailure: true, // We allow failure for all calls
      callData: uniswapV2FactoryContractInterface.encodeFunctionData('allPairs', [k])
    }));

  const d1 = new Date();
  const res = await Promise.all(chunk(calls, Math.ceil(pairsCount / parallelCallsCount)).map(callsChunk => multicall3Contract.aggregate3.staticCall(callsChunk)));
  console.log('Multicall3 elapsed', new Date().getTime() - d1.getTime(), 'ms');
  // console.log('Received results', res.length)

  pi.kill();

  console.log();
  console.log();
}

// **** ACTUAL WORK ****

await readMultipleBalanceOfDemo(
  'eth_call demo - with older anvil <= 2 Jan 2024',
  OLD_ANVIL_EXE_FILE_PATH,
  config.networkCode,
  config.forkRpcUrl,
  config.startPort,
  1000
)

await readMultipleBalanceOfDemo(
  'eth_call demo - with newer anvil >= 14 Jan 2024',
  LATEST_ANVIL_EXE_FILE_PATH,
  config.networkCode,
  config.forkRpcUrl,
  config.startPort,
  1000
)