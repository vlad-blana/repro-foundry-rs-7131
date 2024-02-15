import { spawn } from 'child_process';
import ora from 'ora';

export const spawnAnvilForkChildProcess = (
  anvilExeFilePath,
  forkNodeUrl,
  port,
  {
    accounts = 10,
    randomSeed = false,
    noRateLimit = true,
    noMining = true,
    noStorageCaching = false,
    silent = false,
    stdio = 'pipe',
    stepsTracing = false,
  } = {}
) => spawn(
  anvilExeFilePath,
  [
    forkNodeUrl ? `--fork-url=${forkNodeUrl}` : null,
    `--port=${port}`,
    '--auto-impersonate',
    `--accounts=${accounts}`,
    noRateLimit ? '--no-rate-limit' : null,
    noMining ? '--no-mining' : null,
    noStorageCaching ? '--no-storage-caching' : null,
    silent ? '--silent' : null,
    randomSeed ? '--mnemonic-random' : null,
    stepsTracing ? '--steps-tracing' : null
  ].filter(k => k),
  {
    stdio
  }
);

export const spawnAnvilForkChildProcesses = (
  anvilExeFilePath,
  forkRpcUrl,
  startPort,
  count,
  {
    accounts = 0,
    randomSeed = false,
    noRateLimit = true,
    noMining = true,
    noStorageCaching = false,
    silent = true,
    stdio = 'ignore'
  } = {}
) => {
  const processesInfo = [];

  for (let i = 0; i < count; i++) {
    const port = startPort + i;

    processesInfo.push([
      spawnAnvilForkChildProcess(
        anvilExeFilePath,
        forkRpcUrl,
        port,
        {
          accounts,
          randomSeed,
          noRateLimit,
          noMining,
          noStorageCaching,
          silent,
          stdio
        }
      ),
      'http://127.0.0.1:' + port,
      'ws://127.0.0.1:' + port
    ]);
  }

  return processesInfo;
}

export const showSpinner = async (options, asyncTask) => {
  const spinner = ora(options).start();
  try {
    return await asyncTask(spinner);
  } catch (err) {
    spinner.fail();
    throw err;
  } finally {
    spinner.stop();
  }
}