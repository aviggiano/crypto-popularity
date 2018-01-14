const request = require('request')
const u = require('underscore')

const {HTTP} = require('../codes/index')

module.exports = (req, res) => {
  const url = `https://www.reddit.com/r/CryptoCurrency/.json`
  request(url, (err, r, body) => {
    if (err) res.status(HTTP.INTERNAL_SERVER_ERROR).send(err)
    else {
      const {data} = JSON.parse(body)
      const {after, children} = data
      const child = children.find(e => e.data.title.match(/Daily.*Discussion|Weekly.*Skepticism/i))
      const url = `${child.data.url}.json?limit=1000`
      getAllChildren(url, (err, children) => {
        if (err) res.status(HTTP.INTERNAL_SERVER_ERROR).send(err)
        else {
          const posts = getAllPosts(children)
          const ans = shills(posts)
          const body = u
            .chain(ans)
            .map((val, key) => ({symbol: key, mentions: val.mentions, score: val.score}))
            .sortBy(e => -e.score)
            .value()
          const title = {symbol: 'Symbol', mentions: 'Mentions', score: 'Score'}
          res.render('reddit', {title, body})
        }
      })
    }
  })
}

const getAllChildren = (url, callback) => {
  request(url, (err, res, body) => {
    if (err) callback(err)
    else {
      const data = JSON.parse(body)
      const {children} = data[1].data
      callback(null, children)
    }
  })
}

const getAllPosts = (children) => {
  const toPost = e => ({body: e.data.body, score: e.data.score})
  const parents = children.map(toPost)
  const replies = u.chain(children)
    .map(e => e.data.replies)
    .filter(e => e)
    .map(e => e.data.children)
    .flatten()
    .map(toPost)
    .value()
  return parents.concat(replies)
}

const shills = (posts) => {
  const definitions = require('../../assets/definitions.json')
  const ans = {}
  u.each(definitions, (val, key) => {
    const reKey = new RegExp(`\\b${key}\\b`)
    posts.forEach((post) => {
      if (post.body) {
        if (post.body.match(reKey)) {
          if (!ans[key]) {
            ans[key] = {mentions: 0, score: 0}
          }
          ans[key].mentions += 1
          ans[key].score += post.score
        }
      }
    })
  })
  return ans
}