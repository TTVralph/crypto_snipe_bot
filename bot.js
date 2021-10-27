const Path = require('path');
global.appRoot = Path.resolve('./');
const Dotenv = require('dotenv').config();
const ethers = require('ethers');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('ethereumjs-common').default;
const Commonn = require('@ethereumjs/common').default;
const txCommons = require('tx-commons');
const inquirer = require('inquirer');
const chalk = require('chalk');

const data = {
    swap: process.env.SWAP,                           // pancake or uni

    snipeToken: process.env.SNIPE_TOKEN,              // Token which you want to snipe

    snipeAmount: process.env.SNIPE_BNB_AMOUNT,        // Amount of BNB/ETHER you want to spend buying token

    recipient: process.env.YOUR_ACCOUNT_ADDRESS,      // Your account address

    privateKey: process.env.YOUR_ACCOUNT_PRIVATE_KEY, // Your account private key

    slippage: process.env.SLIPPAGE                    // Allowed slippage (12 default)
}

const PAN_ROUTER_ADDRESS =  "0x10ED43C718714eb63d5aA57B78B54704E256024E";  // https://bscscan.com/address/0x10ED43C718714eb63d5aA57B78B54704E256024E
const PAN_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";  // https://bscscan.com/address/0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73
const PAN_BNB_ADDRESS =     "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";  // https://bscscan.com/token/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c

const UNI_ROUTER_ADDRESS =  "0xE592427A0AEce92De3Edee1F18E0157C05861564";  // https://etherscan.io/address/0xE592427A0AEce92De3Edee1F18E0157C05861564
const UNI_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";  // https://etherscan.io/address/0x1f98431c8ad98523631ae4a59f267346ea31f984
const UNI_ETH_ADDRESS =     "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";  // https://etherscan.io/token/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

const PAN_COMMON = Common.forCustomChain(         // We need to define Binance Smart Chain settings here
    'mainnet',                                    // in order to work with PancakeSwap
    {
        name: 'Binance Smart Chain Mainnet',
        networkId: 56,
        chainId: 56,
        url: 'https://bsc-dataseed.binance.org/'
    },
    'istanbul',
);

const UNI_COMMON = new Commonn({chain: 'mainnet'}); // For Uniswap it is much simpler, just specify mainnet

const provider = getProvider();
const web3 = getWeb3();

let wallet = getWallet();
let account = getAccount();

let initialLiquidityDetected = false;
let jmlBnb = 0;
let tokenBought = false;
let boughtAmount = 0;

function validateInput() {
    console.log(chalk.yellow('Validating input from .env config file...'));
    if (data.swap === undefined || data.swap === '') {
        console.log(chalk.red("Please define SWAP variable in .env (pancake or uni)"));
        process.exit(-1);
    }
    if (data.snipeToken === undefined || data.snipeToken === '') {
        console.log(chalk.red("Please define SNIPE_TOKEN variable in .env"));
        process.exit(-1);
    }
    if (data.snipeAmount === undefined || data.snipeAmount === '') {
        console.log(chalk.red("Please define SNIPE_BNB_AMOUNT variable in .env"));
        process.exit(-1);
    }
    if (data.recipient === undefined || data.recipient === '') {
        console.log(chalk.red("Please define YOUR_ACCOUNT_ADDRESS variable in .env"));
        process.exit(-1);
    }
    if (data.privateKey === undefined || data.privateKey === '') {
        console.log(chalk.red("Please define YOUR_ACCOUNT_PRIVATE_KEY variable in .env"));
        process.exit(-1);
    }
    if (data.slippage === undefined || data.slippage === '') {
        console.log(chalk.red("Please define SLIPPAGE variable in .env"));
        process.exit(-1);
    }
    console.log(chalk.green('All input was successfully validated!'));
}

function startupInfo() {
    console.log(chalk.green('=================================================='));
    console.log(chalk.green('CryptoSnipeBot v1.0'));
    console.log(chalk.green('=================================================='));
    console.log(chalk.green(`Swap exchange - ${data.swap}`));
    console.log(chalk.green(`Target token (to snipe) - ${data.snipeToken}`));
    console.log(chalk.green(`Target amount (to buy) - ${data.snipeAmount}`));
    console.log(chalk.green(`Allowed slippage - ${data.slippage}`));
    console.log(chalk.green('Proceeding to snipe...'));
    console.log(chalk.green('=================================================='));
}

function getRouterAddress() {
    if (data.swap === 'pancake') return PAN_ROUTER_ADDRESS;
    else return UNI_ROUTER_ADDRESS;
}

function getFactoryAddress() {
    if (data.swap === 'pancake') return PAN_FACTORY_ADDRESS;
    else return UNI_FACTORY_ADDRESS;
}

function getTokenAddress() {
    if (data.swap === 'pancake') return PAN_BNB_ADDRESS;
    else return UNI_ETH_ADDRESS;
}

function getWallet() {
    return new ethers.Wallet(data.privateKey);
}

function getAccount() {
    return wallet.connect(provider);
}

// TODO: move abi into json file
function factory() {
    return new ethers.Contract(
        getFactoryAddress(),
        [
            'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
            'function getPair(address tokenA, address tokenB) external view returns (address pair)'
        ],
        account
    );
}

// TODO: move abi into json file
function router() {
    return new ethers.Contract(
        getRouterAddress(),
        [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
            'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
            'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
        ],
        account
    );
}

// TODO: move abi into json file
function erc() {
    return new ethers.Contract(
        getTokenAddress(),
        [{
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "payable": false,
            "type": "function"
        }],
        account
    );
}

// TODO: add list of public nodes and try to connect to the first available node
function getNodeUrl() {
    if (data.swap === 'pancake') return 'https://bsc-dataseed1.defibit.io/'; //https://bsc-dataseed1.defibit.io/ https://bsc-dataseed.binance.org/
    else return 'https://cloudflare-eth.com/'; // For uniswap, you can use your private Infura node, get and API key here - https://infura.io/
}

function getProvider() {
    return new ethers.providers.JsonRpcProvider(getNodeUrl());
}

function getWeb3() {
    let web3provider = new Web3.providers.HttpProvider(getNodeUrl());
    return new Web3(web3provider);
}

function getNetworkCommon() {
    if (data.swap === 'pancake') return PAN_COMMON;
    else return UNI_COMMON;
}

const run = async () => {
    await checkLiq();
}

let checkLiq = async () => {
    const pairAddressx = await factory().getPair(getTokenAddress(), data.snipeToken);
    console.log(chalk.blue(`pairAddress: ${pairAddressx}`));
    if (pairAddressx !== null && pairAddressx !== undefined) {
        if (pairAddressx.toString().indexOf('0x0000000000000') > -1) {
            console.log(chalk.cyan(`Pair address ${pairAddressx} not detected. Auto restarting bot...`));
            return await run();
        }
    }
    const pairBNBvalue = await erc().balanceOf(pairAddressx);
    jmlBnb = ethers.utils.formatEther(pairBNBvalue);
    console.log(`Detected liquidity : ${jmlBnb}`);
    console.log('Going to buy token...');
    setTimeout(() => buyAction(), 3000);
}

let buyAction = async () => {
    if (initialLiquidityDetected === true) {
        console.log('Can not buy token, liquidity was added already; aborting operation...');
        return null;
    }

    console.log('Ready to buy token');
    try {
        initialLiquidityDetected = true;

        let amountOutMin = 0;
        //We buy x amount of the new token for our wbnb
        const amountIn = ethers.utils.parseUnits(`${data.snipeAmount}`, 'ether');
        if (parseInt(data.slippage) !== 0) {
            const amounts = await router().getAmountsOut(amountIn, [getTokenAddress(), data.snipeToken]);
            //Our execution price will be a bit different, we need some flexibility (slippage)
            amountOutMin = amounts[1].sub(amounts[1].div(`${data.slippage}`));
        }

        console.log(
            chalk.green.inverse(`Starting to buy \n`)
            +
            `Buying Token
        =================
        tokenIn: ${(amountIn * 1e-18).toString()} ${getTokenAddress()} (BNB)
        tokenOut: ${(amountOutMin / 1e-18).toString()} ${getTokenAddress()}
      `);

        console.log(chalk.yellow('Processing Transaction.....'));
        console.log(chalk.yellow(`Buying amount: ${(amountIn * 1e-18)} ${getTokenAddress()} (BNB)`));
        console.log(chalk.yellow(`Minimum token amount: ${amountOutMin / 1e-18}`));
        console.log(chalk.yellow(`Buying token: ${getTokenAddress()}`));
        console.log(chalk.yellow(`Target token: ${data.snipeToken}`));
        console.log(chalk.yellow(`Account: ${data.recipient}`));
        console.log(chalk.yellow(`Gas limit: ${data.gasLimit}`));
        console.log(chalk.yellow(`Gas price: ${data.gasPrice}`));

        // Prepare transaction data
        let txData = router.methods.swapExactETHForTokens(
            web3.utils.toHex(amountOutMin),
            [getTokenAddress(), data.snipeToken],
            data.recipient,
            web3.utils.toHex(Math.round(Date.now() / 1000) + 60) // 1 minute timeout
        );
        let rawTransaction = {
            'from': data.recipient,
            'gasPrice': web3.utils.toHex(data.gasPrice),
            'gasLimit': web3.utils.toHex(data.gasLimit),
            'to': getRouterAddress(),
            'value': web3.utils.toHex(amountIn),
            'data': txData.encodeABI(),
            'nonce': null //set you want buy at where position in blocks
        };

        // Sign transaction with private key
        const key = Buffer.from(data.privateKey, 'hex');
        let transaction = new Tx(rawTransaction, {'common': getNetworkCommon()});
        transaction.sign(key);

        // Send transaction
        let result = await getProvider().sendTransaction('0x' + transaction.serialize().toString('hex'));
        console.log(`Transaction https://bscscan.com/tx/${result.hash} sent`);

        // Verify transaction
        let receipt = await getProvider().waitForTransaction(result.hash);
        if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
            console.log(chalk.green(`Transaction https://bscscan.com/tx/${result.hash} mined, status success`));
            tokenBought = true;
            boughtAmount = amountOutMin;
        } else if (receipt && receipt.blockNumber && receipt.status === 0) {
            console.log(chalk.red(`Transaction https://bscscan.com/tx/${result.hash} mined, status failed`));
        } else {
            console.log(chalk.yellow(`Transaction https://bscscan.com/tx/${result.hash} not mined`));
            // TODO: add retry for failed transaction ???
        }
    } catch (err) {
        let error = JSON.parse(JSON.stringify(err));
        console.log(`Error caused by :
        {
        reason : ${error.reason},
        transactionHash : ${error.transactionHash}
        message : Please check your account balance, maybe its due because insufficient balance or approve your token manually on pancakeSwap / uniswap
        }`);
        console.log(error);

        inquirer.prompt([
            {
                type: 'confirm',
                name: 'runAgain',
                message: 'Do you want to run again thi bot?',
            },
        ])
            .then(answers => {
                if (answers.runAgain === true) {
                    console.log('= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =');
                    console.log('Run again');
                    console.log('= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =');
                    initialLiquidityDetected = false;
                    run();
                } else {
                    process.exit();
                }

            });

    }
}

(
    async function startUp() {
        validateInput();
        startupInfo();
        await txCommons.config();
        await run();
        summaryInfo();
        setTimeout(() => {
            process.exit()
        }, 2000);
    }
)();

function summaryInfo() {
    console.log(chalk.green('=================================================='));
    console.log(chalk.green('SimpleSnipeBot v1.0 summary:'));
    console.log(chalk.green('=================================================='));
    console.log(chalk.green(`Token bought (y/n) - ${tokenBought}`));
    console.log(chalk.green(`Amount of token bought - ${boughtAmount}`));
    console.log(chalk.green('=================================================='));
}
