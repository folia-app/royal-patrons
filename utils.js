const fs = require('fs')
const ethers = require('ethers')
const { type } = require('os')
require('dotenv').config()

const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const log = (message, isVerbose = false) => {
  const verbose = process.env.verbose === 'true'
  const show = isVerbose && verbose || !isVerbose
  if (typeof message === 'object') {
    show && console.timeLog('royal-patrons', "| ", { message })
  } else {
    show && console.timeLog('royal-patrons', "| " + message)
  }
}


async function reverseLookup(address) {
  const provider = new ethers.providers.InfuraProvider(
    "homestead",
    process.env.INFURA_API_KEY || '',
  );
  let name
  try {
    name = await provider.lookupAddress(address)
    return name || address
  } catch (e) {
    // console.log({ e })
    return address
  }
}

const validateAddresses = (addressesParam, name) => {
  let addresses = addressesParam
  // check to see if addresses is a file
  if (fs.existsSync(addresses)) {
    addresses = fs.readFileSync(addresses, 'utf8')
  }

  // check to make sure addresses is a list of valid addresses
  addresses = addresses.split(',')
  addresses = addresses.map(address => address.trim())
  addresses = addresses.filter(address => {
    const isValid = ethers.utils.isAddress(address)
    if (!isValid) {
      log(`Removed invalid address: ${address}`)
    }
    return isValid
  })
  const addressLengthBefore = addresses.length
  // remove duplicates
  addresses = [...new Set(addresses)]
  const addressLengthAfter = addresses.length
  if (addressLengthBefore !== addressLengthAfter) {
    log(`Removed ${addressLengthBefore - addressLengthAfter} duplicate address${addressLengthBefore - addressLengthAfter > 1 ? 'es' : ''} from ${name}`)
  }
  if (addresses.length === 0) {
    throw new Error('No valid addresses found in parameter: ' + name)
  }
  return addresses
}

const wait = async (time = 200) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

let requests = 0
let lastRequest = false

const makeRequest = async (url) => {
  requests++
  let timeSinceLastRequest
  if (lastRequest) {
    timeSinceLastRequest = Date.now() - lastRequest
    log(`request # ${requests}, ${timeSinceLastRequest} since last request`, true)
    if (timeSinceLastRequest < 250) {
      log(`waiting ${250 - timeSinceLastRequest}ms to call ${url}`, true)
      await wait(250 - timeSinceLastRequest)
    }
  }
  lastRequest = Date.now()
  let results = await fetch(url)
  return results.json()
}

async function getBuyerSellerAddress(tx, contractAddresses) {
  let txJson
  let buyersAddress = []
  try {
    const request = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${tx}&apikey=${process.env.ETHERSCAN_API_KEY}`
    txJson = await makeRequest(request)
    // log({ txJson })
    // check the logs of this tx for any transfer events of contract tokens
    // if they exist, add the "to" address to the wethPayers array
    for (let k = 0; k < txJson.result.logs.length; k++) {
      const log_ = txJson.result.logs[k]
      // go through each contract address and see if this log is a transfer of that token

      for (let m = 0; m < contractAddresses.length; m++) {
        const contractAddress = contractAddresses[m]
        if (log_.address.toLowerCase() === contractAddress.toLowerCase() && log_.topics[0].toLowerCase() === transferTopic.toLowerCase()) {
          // this is a transfer of a contract token
          // add the "to" address to the wethPayers array
          buyersAddress = "0x" + (log_.topics[2].slice(26).toLowerCase().padStart(40, '0'))
          sellersAddress = "0x" + (log_.topics[1].slice(26).toLowerCase().padStart(40, '0'))
          log(`found an NFT transfer from contract ${m + 1} sold by ${sellersAddress} to ${buyersAddress} in tx ${tx}`, true)
          return [buyersAddress, sellersAddress]
        }
      }
    }
  } catch (e) {
    log({ e, txJson })
    throw new Error({ e, txJson })
  }
  return buyersAddress
}

const saveOutput = async (array, output) => {
  log(`saving output to ${output}`, true)
  const file = fs.createWriteStream(output)
  file.on('error', function (err) { console.error(err) })
  array.forEach(function (v) { file.write(v + ',') })
  file.end()
}


module.exports = {
  reverseLookup, validateAddresses, wait, makeRequest, getBuyerSellerAddress, saveOutput, transferTopic, log
}