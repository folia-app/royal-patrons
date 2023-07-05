#!/usr/bin/env node

require('dotenv').config()
const { Command } = require('commander');
const { validateAddresses, makeRequest, getBuyersAddress, saveOutput, transferTopic, log } = require('./utils')
const program = new Command();

program.name('royal-patrons')
  .description('CLI to help collect addresses of NFT patrons that paid royalties')
  .version(require('./package').version)

program
  .command('run')
  .description('Runs royal-patrons')
  .argument('<contractAddresses>', 'Comma separated list of all NFT contract addresses you want to track (or path to file) ')
  .argument('<recipientAddresses>', 'Comma separated list of all addresses that would have received royalties (or path to file) ')
  .option('-w --weth <weth>', 'Include royalty payments in WETH', true)
  .option('-o --output <output>', 'Output file name', 'royal-patrons.csv')
  .option('-v --verbose', 'Verbose output', false)
  .option('-e --etherscanAPI', 'Etherscan API key', process.env.ETHERSCAN_API_KEY)
  .action(async (contractAddresses, recipientAddresses, { weth, output, verbose, etherscanAPI }, cmd) => {
    console.log("Starting...")
    console.time('royal-patrons')
    console.log({ etherscanAPI })
    if (etherscanAPI === undefined || etherscanAPI === "") {
      throw new Error('You must set an ETHERSCAN_API_KEY in your .env file or as --etherscanAPI flag')
    }
    process.env.ETHERSCAN_API_KEY = etherscanAPI
    process.env.verbose = verbose

    const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

    contractAddresses = validateAddresses(contractAddresses, "contractAddresses")
    recipientAddresses = validateAddresses(recipientAddresses, "recipientAddresses")

    log({ contractAddresses, recipientAddresses, weth }, true)

    log(`Checking ${contractAddresses.length} contract${contractAddresses.length > 1 ? 's' : ''} for non-mint NFT transfers`)
    let allTxs = []
    for (let q = 0; q < contractAddresses.length; q++) {
      const contract = contractAddresses[q]
      // get all Transfer events from the NFT contract
      log(`checking contract #${q + 1} for non-mint NFT Transfer events`, true)
      let gotAllOfThem = false
      let page = 1
      let thisBatch = 0
      while (!gotAllOfThem) {
        const request = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${contract}&topic0=${transferTopic}&page=${page}&offset=1000&apikey=${process.env.ETHERSCAN_API_KEY}`
        const json = await makeRequest(request)
        // if the transfer is not a mint then add the tx to the allTxs array
        const txs = json.result.filter((event) => {
          return (event.topics[1] !== '0x0000000000000000000000000000000000000000000000000000000000000000')
        }).map(tx => tx.transactionHash)
        thisBatch += txs.length
        allTxs.push(...txs)
        // make allTxs unique
        if (json.result.length < 1000) {
          gotAllOfThem = true
        } else {
          page++
        }
      }
      log(`Found ${thisBatch} non-mint transfers in contract #${q + 1}`)
    }
    allTxs = [...new Set(allTxs)]
    log(`Found total of ${allTxs.length} unique non-mint transfers`)
    const ethPayers = []
    let ethTxs = []
    let ethTxToContractAddress = {}
    // go through all non-mint transfers and see if there was Eth moved to one of the earnings addresses
    for (let i = 0; i < allTxs.length; i++) {
      if (i == 0) {
        log(`Checking internal transactions for transfer of Eth to earnings addresses`)
      }
      if (i % 100 == 0 && i > 0) {
        log(`Checked ${Math.floor((i * 100) / allTxs.length)}% of ${allTxs.length} txs and found ${ethTxs.length} txs that seem to contain royalties`)
      }
      const tx = allTxs[i]
      let internalJson
      // first check the internal transactions
      let request = `https://api.etherscan.io/api?module=account&action=txlistinternal&txhash=${tx}&apikey=${process.env.ETHERSCAN_API_KEY}`
      internalJson = await makeRequest(request)
      let paidEarnings = false
      try {
        for (let j = 0; j < internalJson.result.length; j++) {
          const internalTx = internalJson.result[j]
          const thisOnePaid = recipientAddresses.filter((a) => a.toLowerCase() === internalTx.to.toLowerCase() && internalTx.value !== "0").length > 0
          if (thisOnePaid) {
            paidEarnings = true
          }
        }
      } catch (e) {
        log({ e, internalJson, tx })
        throw new Error({ e, internalJson, tx })
      }
      if (paidEarnings) {
        ethTxs.push(tx)
        ethTxs = [...new Set(ethTxs)]
        ethTxToContractAddress[tx] = contractAddresses

      }
    }

    // make ethTxs unique
    ethTxs = [...new Set(ethTxs)]
    log(`Found ${ethTxs.length} ETH txs that paid royalties`)
    // check the tx to see the all the logs
    // if one of the logs is a transfer of one of the contract NFTs, add the to address to the list of ETH payers
    for (let i = 0; i < ethTxs.length; i++) {
      const tx = ethTxs[i]
      const address = await getBuyersAddress(tx, ethTxToContractAddress[tx])
      if (address) {
        ethPayers.push(address)
      }
    }


    // make ethPayers unique
    const uniqueEthPayers = [...new Set(ethPayers)]
    log(`Found ${uniqueEthPayers.length} unique patrons that paid royalties in ETH`)

    if (!weth) {
      if (uniqueEthPayers.length === 0) {
        log(`Found no unique patrons that paid royalties in ETH`)
        return
      }
      await saveOutput(uniqueEthPayers, output);
      log(`saved to ${output}`)
      return
    }


    const wethPayers = []
    // get all WETH transfer events that went to earnings addresses, then filter them for the ones that also contained a transfer of a token from the list of contracts
    for (let i = 0; i < recipientAddresses.length; i++) {
      // recipient address has to be left padded with 0s to 64 characters
      const topic2 = "0x" + (recipientAddresses[i].slice(2).toLowerCase().padStart(64, '0'))
      const request = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${wethAddress}&topic0=${transferTopic}&topic0_2_opr=and&topic2=${topic2}&page=1&offset=1000&apikey=${process.env.ETHERSCAN_API_KEY}`
      const json = await makeRequest(request)
      log(`Found ${json.result.length} WETH transfers to ${recipientAddresses[i]}`, true)
      // go through each transfer and check the other logs in that tx
      // if any of the other logs were transfers of a contract NFT, then add the tx to the wethTxs array
      for (let j = 0; j < json.result.length; j++) {
        if (j % 100 == 0 && j > 0) {
          log(`checked ${j} of ${json.result.length} WETH transfers to ${recipientAddresses[i]} and found ${wethPayers.length} WETH payers so far`)
        }
        // this is a tx that included the transfer of WETH to an earnings address
        const tx = json.result[j]
        const address = await getBuyersAddress(tx.transactionHash, contractAddresses)
        if (address) {
          wethPayers.push(address)
        }
      }
    }
    // make wethPayers unique
    const uniqueWethPayers = [...new Set(wethPayers)]
    log(`Found ${uniqueWethPayers.length} unique patrons that paid royalties in WETH`)

    const combinedAllPayers = [...new Set([...uniqueWethPayers, ...uniqueEthPayers])]
    if (combinedAllPayers.length === 0) {
      log(`Found no unique patrons that paid royalties in ETH or WETH`)
      return
    }

    await saveOutput(combinedAllPayers, output);
    console.timeEnd('royal-patrons')
    console.log(`Found ${combinedAllPayers.length} unique patrons that paid royalties in ETH or WETH, saved to ./${output}`)
  })


if (process.argv === 0) {
  program.help()
  process.exit(1)
}

program.parse()
