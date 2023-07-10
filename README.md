# Royal Patrons 👑

This is a CLI application that helps in collecting addresses of NFT patrons who've paid royalties.  
It was created to collect addresses for an allowlist using https://lanyard.org as part of the launch of https://viper.folia.app.

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