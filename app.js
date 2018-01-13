const reddit = require('./src/reddit')
// const definitions = require('./src/definitions.js')(() => (({})))

reddit('/r/CryptoCurrency', (err, data) => console.log(err || data))