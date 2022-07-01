const { Requester, Validator } = require('@chainlink/external-adapter')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// The parameters that the external adapter accepts in the data object
// internal variable name followed by an array of acceptable input field names
// if multiple matching inputs are found, the lowest index takes priority
const customParams = {
  inputToken: ['token', 'asset', 'coin'],
  outputCurrency: ['currency', 'output', 'quote'],
  endpoint: false
}

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data by checking types
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const token = validator.validated.data.inputToken.toLowerCase()
  const currency = validator.validated.data.outputCurrency.toLowerCase()
  const url = `https://api.coingecko.com/api/v3/coins/${token}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`

  const params = {
    token,
    currency
  }

  // Config for Requester call
  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      // Originally I returned all the API data and the adapter result,
      // const resObj = { symbol: `${response.data.symbol}-${currency}`, timestamp: `${response.data.last_updated}`, price: `${response.data.market_data.current_price[currency]}`, market_cap: `${response.data.market_data.market_cap[currency]}`, total_volume: `${response.data.market_data.total_volume[currency]}` }
      // response.data.result = resObj

      // Decided it was cleaner to just return my result object, not sure what the best practice is
      const customDataObj = {
        result: {
          symbol: `${response.data.symbol}-${currency}`,
          timestamp: `${response.data.last_updated}`,
          price: `${response.data.market_data.current_price[currency]}`,
          market_cap: `${response.data.market_data.market_cap[currency]}`,
          total_volume: `${response.data.market_data.total_volume[currency]}`
        }
      }
      response.data = customDataObj
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
