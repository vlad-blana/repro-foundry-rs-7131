import { WebSocketProvider } from 'ethers';
import chalk from 'chalk';

import { showSpinner, spawnAnvilForkChildProcesses } from './utils.js';
import { config } from './anvil.config.js';

const OLD_ANVIL_EXE_FILE_PATH = './anvil.old.exe'; // 2 Jan 2024 or older
const LATEST_ANVIL_EXE_FILE_PATH = 'anvil.latest.exe'; // 14 Jan 2024 or newer

const startAnvilAndEstablishWebSocketRpcConnections = async (
  demoLabel,
  anvilExeFilePath,
  forkRpcUrl,
  startPort,
  count,
  {
    accounts = 400,
    randomSeed = false,
    noMining = true,
    noStorageCaching = true,
    silent = true,
    stdio = 'ignore'
  } = {}
) => {
  console.log(chalk.bold.underline(demoLabel));
  console.log();

  console.log('Spawning', count, 'anvil processes');

  const anvilProcessesInfo = spawnAnvilForkChildProcesses(
    anvilExeFilePath,
    forkRpcUrl,
    startPort,
    count,
    {
      accounts,
      randomSeed,
      noMining,
      noStorageCaching,
      silent,
      stdio
    }
  );

  console.log('Spawned', count, 'anvil processes');

  const d0 = new Date();
  const anvilProviders = await showSpinner(
    `Attempting to establish web socket connections with ${count} anvil instances...`,
    () => Promise.all(anvilProcessesInfo.map(pi => new Promise(resolve => {
      const init = () => {
        try {
          const provider = new WebSocketProvider(pi[2]);

          provider.websocket.on('open', () => resolve(provider));

          provider.websocket.on('error', () => setTimeout(init, 1));
        } catch (err) {
          console.log(err);
        }
      }

      init()
    })))
  );

  console.log('Web socket connections established after', new Date().getTime() - d0.getTime(), 'ms');

  anvilProcessesInfo.forEach(pi => pi[0].kill());

  console.log();
  console.log();
}

// **** CONFIG ****

const commonArgs = [
  config.forkRpcUrl,
  config.startPort,
  config.count,
  {
    accounts: 400,
    randomSeed: false,
    noMining: true,
    noStorageCaching: true,
    silent: false,
    stdio: 'ignore'
  }
];

// **** ACTUAL WORK ****

await startAnvilAndEstablishWebSocketRpcConnections(
  'Startup with older anvil <= 2 Jan 2024',
  OLD_ANVIL_EXE_FILE_PATH,
  ...commonArgs
)

await startAnvilAndEstablishWebSocketRpcConnections(
  'Startup with newer anvil >= 14 Jan 2024',
  LATEST_ANVIL_EXE_FILE_PATH,
  ...commonArgs
)