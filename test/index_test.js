const assert = require('chai').assert
const createRequest = require('../index.js').createRequest

describe('createRequest', () => {
  const jobID = '1'

  // all of these templated 'successful' tests fail, should be getting a 200 response, but get the response from app.js line 58
  context('successful calls', () => {
    const requests = [
      { name: 'id not supplied', testData: { data: { token: 'ethereum', quote: 'USD' } } },
      { name: 'token/currency', testData: { id: jobID, data: { token: 'ethereum', currency: 'USD' } } },
      { name: 'asset/output', testData: { id: jobID, data: { asset: 'ethereum', output: 'USD' } } },
      { name: 'coin/quote', testData: { id: jobID, data: { coin: 'ethereum', quote: 'USD' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 200)
          assert.equal(data.jobRunID, jobID)
          assert.isNotEmpty(data.data)
          assert.isAbove(Number(data.data.result.price), 0)
          assert.isAbove(Number(data.data.result.market_cap), 0)
          assert.isAbove(Number(data.data.result.total_volume), 0)
          done()
        })
      })
    })
  })

  context('error calls', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'currency not supplied', testData: { id: jobID, data: { currency: 'USD' } } },
      { name: 'token not supplied', testData: { id: jobID, data: { token: 'ETH' } } },
      { name: 'unknown base', testData: { id: jobID, data: { token: 'not_real', currency: 'USD' } } },
      { name: 'unknown quote', testData: { id: jobID, data: { token: 'ETH', currency: 'not_real' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 500)
          assert.equal(data.jobRunID, jobID)
          assert.equal(data.status, 'errored')
          assert.isNotEmpty(data.error)
          done()
        })
      })
    })
  })
})
