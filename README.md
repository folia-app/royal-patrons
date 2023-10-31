# Royal Patrons 👑

This is a CLI application that helps in collecting addresses of NFT patrons who've paid royalties.  
It was created to collect addresses for an allowlist using https://lanyard.org as part of the launch of https://viper.folia.app.

## Contracts

0x536580914cda50c7b74ba2cb693a38ffa4784d82, // CBL - 220
0x20c70bdfcc398c1f06ba81730c8b52ace3af7cc3, // MGS - 274
0xdce09254dd3592381b6a5b7a848b29890b656e01, // FLA - 339
0x9d413b9434c20c73f509505f7fbc6fc591bbf04a, // KUDZU - 792
0x76e422de0ce8842ebe837bc7ab6984b4fff88055, // X2 - 13
0x6ca044fb1cd505c1db4ef7332e73a236ad6cb71c, // DOTCOM - 251
0xc50161e1f4015a4f4b91cf98b996b7001ceaccf0, // DCMP - 150
0x9a6b280d9de461c16e9d47fb7996acbe36eac50b, // STR - 128
0x32f8f03197c55741ccf8dea9d8f014281bd30183, // VPR - 221
0x044ec6ce7e87859eb9d3ca966cadfb7926d0c482 // BBVPR - 297

## Installation

To install the application you can `npm` or `yarn` as follows:

```bash
yarn global add royal-patrons
# or
npm install -g royal-patrons
```

If you'd like to install from source, clone the repo and run install:
  
```bash
git clone git@github.com:folia-app/royal-patrons.git
cd royal-patrons
yarn
# or
npm install
```

## Usage

Make sure that you've added `ETHERSCAN_API_KEY` to an `.env` with your Etherscan API key or passed the Etherscan API key via the `--etherscanAPI` flag.  
You can get one from https://etherscan.io/myapikey.

To run the program use the `run` command with the list of NFT contract addresses to track and list of royalty recipient addresses.  
You could alternatively provide a filepath containing them as comma separated values.
```bash
$ royal-patrons run -h
Usage: royal-patrons run [options] <contractAddresses> <recipientAddresses>

Runs royal-patrons

Arguments:
  contractAddresses     Comma separated list of all NFT contract addresses you want
                        to track (or path to file)
  recipientAddresses    Comma separated list of all addresses that would have
                        received royalties (or path to file)

Options:
  -w --weth <weth>      Include royalty payments in WETH (default: true)
  -o --output <output>  Output file name (default: "royal-patrons.csv")
  -v --verbose          Verbose output (default: false)
  -e --etherscanAPI     Etherscan API key
  -h, --help            display help for command
```

There's also a command for parsing the list of addresses as ENS names:

```bash
$ royal-patrons ens -h
Usage: royal-patrons ens [options]

Gets the ENS name for all the addresses in royal-patrons.csv

Options:
  -i --input <input>  Input file name (default: "royal-patrons.csv")
  -h, --help          display help for command
```