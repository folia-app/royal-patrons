# Royal Patrons

This is a CLI application that helps in collecting addresses of NFT patrons who've paid royalties.

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

```bash
$ royal-patrons run -h
Usage: royal-patrons run [options] <contractAddresses> <recipientAddresses>

Runs royalty-patrons

Arguments:
  contractAddresses     Comma separated list of all NFT contract addresses you want
                        to track (or path to file)
  recipientAddresses    Comma separated list of all addresses that would have
                        received royalties (or path to file)

Options:
  -w --weth <weth>      Include royalty payments in WETH (default: true)
  -o --output <output>  Output file name (default: "royalty-patrons.csv")
  -v --verbose          Verbose output (default: false)
  -h, --help            display help for command
```

