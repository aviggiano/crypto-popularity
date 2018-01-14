const {HTTP} = require('../codes/index')

module.exports = (req, res) => {
  const request = require('request')
  const fs = require('fs')

  const url = 'https://api.coinmarketcap.com/v1/ticker/?limit=0'

  request(url, (err, r, body) => {
    if (err) callback(err)
    else {
      const data = JSON.parse(body)
      const definitions = data
        .filter(e => e.market_cap_usd > 50E6)
        .map(e => ({symbol: e.symbol, name: e.name}))
        .reduce((a, b) => {
          a[b.symbol] = b.name
          return a
        }, {})
      fs.writeFile(`${__dirname}/../../assets/definitions.json`, JSON.stringify(definitions), (err) => {
        if (err) res.status(HTTP.INTERNAL_SERVER_ERROR).send(err)
        else res.json(definitions)
      })
    }
  })
}