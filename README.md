# repro-foundry-rs-7131

### PREREQS

- node.js

### INSTALL

`npm install`

### CONFIG / SETUP

Copy anvil.exe from 2bcb4a1 or older in the root folder and rename it as anvil.old.exe\
Copy anvil.exe from 293fad7 or newer and rename it as anvil.latest.exe

Edit anvil.config.js if you need to

- forkRpcUrl - the forked node url
- networkCode - the network code - used only in the second issue demo to eliminate useless eth_chainId calls to the anvil nodes
- startPort - the first port in the ports range assigned to the anvil processes
- count - the number of anvil instances

### Observations

The demos should work on linux or mac too with no or minimal tweaks, but I reported the issue on windows and I only ran on windows.

## Demos

### 1. Startup performance regression demo

#### Description

It starts 32 processes of anvil.exe, then tries to establish websocket connections using ethers.js. After all 32 connections are established it closes the child anvil processes which automatically destroy the process and the program closes.

It does this for the "old" anvil.exe and then for the "new/latest".\
I know the naming convention is dumb, but I could not find a better one yet.

#### Info

If you want to play with the args there is a config section in the file. The js object of interest is called commonArgs.

It can only run in fork mode

The anvil `--no-storage-caching` option expects `--fork-url` option too.

#### Run

`node slowerStartup.js`

#### My results testing this code

On my local node it takes 3000 ms and 8000 ms for the older and newer exe.\
On the g4mm4 public node it takes 3200ms and 80000-95000 ms between the 2 exe.\
Based on the huge time increase when forking a public node it looks like there is some weird network activity happening behind the scene that takes much longer on newer releases.

The accounts option influences the results. The higher the number of initial accounts the higher the time gap.\
Even with 0 there is a performance penalty, but one would be easily tricked to think it's just a time measurement error.\
I use 400 accounts in my live code so I kept that in this demo too.

### 2. eth_call 10x slower demo

#### Description

It starts a single anvil process\
Establishes a websocket connection with the anvil node\
Calls the official uniswap v2 factory allPairsLength just to know how many pairs there are - that the code works more or less.\
Then uses the official multicall3 contract to get the addresses of the first 1000 pairs.\

#### Info

On local node you have to get for larger pairsCount to observe the time difference.\
Forking public nodes requires lower values if you don't want to grow old before it ends, because of the network latency.\
This demo should also work on ethereum rpcs - the contracts are the same.\

#### Run

`node slowerMultipleEthCalls.js`

#### My results testing this code

Reading 10000 pairs addresses forking my local geth node takes 4000 ms with the older anvil.exe, and 22000 ms with the newer anvil.exe\
Reading 1000 pairs addresses forking the g4mm4 erigon node takes 790 ms with the older anvil.exe, and 38022 ms with the newer anvil.exe

The performance regression is visible when calling multiple eth_call at the same time\
Calling just 1 doesn't show the issue. It might even run better on the newer exe
