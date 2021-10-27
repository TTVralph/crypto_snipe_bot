# CryptoSnipeBot

The most simple and efficient sniping bot.  
Works with both PancakeSwap and Uniswap exchanges.

## Prerequisites

1. You need Node.js runtime installed on your computer; get it here - https://nodejs.org/en/download/
2. Clone repository with git or download archive from releases page
3. Open terminal in bot directory and run `npm install` to install all dependencies

## Bot configuration

Open `.env` file in the root directory of the bot. There are a couple of properties that should be set before bot could snipe tokens:

* `YOUR_ACCOUNT_ADDRESS` - public address of your account (wallet); this address is used to buy token
* `YOUR_ACCOUNT_PRIVATE_KEY` - private key of your account (wallet); key is used to sign and send buy transaction; never share or send this key with anyone!!!
* `SWAP` - platform on which you want to snipe token - `pancake` for PancakeSwap or `uni` for Uniswap
* `SNIPE_TOKEN` - the token that you want to snipe
* `SNIPE_BNB_AMOUNT` - amount of BNB (or ETH in case of Uniswap) that you want to spend buying token
* `SLIPPAGE` - allowed slippage value; if you do not know what slippage is, leave default value (12%) and read about it - https://coinmarketcap.com/alexandria/glossary/slippage

If any of these settings is missing - bot won't work.

## Usage

Run bot with `node bot.js` command

## How it works

When run, bot will listen for liquidity added to target token, and when it detects liquidity - it will buy the token, doing it much faster than any human possibly could.

Pay attentions, this bot works <strong>only</strong> with new tokens; if the token was already launched, the bot won't work.

This bot <strong>does not</strong> sell the token later, sell it manually or wait till I update bot.

## Disclaimer

As with any operation with crypto assets (as with real money in real life), sniping tokens always has financial risks;  
If you run this bot, you take full responsibility of your actions and of your financial success.  
<strong>Always</strong> DYOR (Do Your Own Research) before making any decisions with crypto assets;  
The author of this bot has no responsibility for wrong decisions!

## Q&A

* Does this bot work with PancakeSwap? - Yes, it works with both PancakeSwap and Uniswap
* Does this bot work with Uniswap - ^^^
* Can this bot snipe any token? - In theory, yes, but on practice, there are some number of tokens that use anti-snipe mechanisms; this bot can snipe 80-90% of the new tokens (that do not have such mechanisms)
* Ok, how to snipe tokens with anti-snipe mechanisms? - Currently, I'm working on the advanced version of the bot that will defeat any anti-snipe security measures
* Wow, when it will be released? - Can't say for sure, as advanced features require lots of time and lots of testing, but I hope to finish it in the next 2-3 months
* Will advanced bot be posted here on GitHub? - As I told earlier, advanced bot requires <strong>lots</strong> of time, testing and even money (real money) to develop, so the answer is obviously no; I will sell it, but the price will be reasonable
* Why did you post this bot and do not sell it then? - Well, this bot functionality is basic and it took me 3 evenings to develop it and test; however, even with this basic functionality it is faster than any human trying to buy tokens; try is as a demo version of the future advanced bot
* How can I know that advanced bot is ready? - I will update this readme information when advanced bot will be ready; feel free to ping me if you are interested
* Why you GitHub account is new and has no other projects? - People that launch new tokens are not very happy with snipers and snipe bots (to say at least), so I do not use my real life GitHub account just to ensure my personal safety, I hope you understand it
* Can I modify your bot? - Yes, sure, you can modify and change whatever you want or even build you own bot with features that you want:)
