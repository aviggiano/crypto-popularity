const request = require('request')
const u = require('underscore')

module.exports = (subreddit, callback) => {
  const url = `https://www.reddit.com${subreddit}/.json`
  request(url, (err, res, body) => {
    if (err) callback(err)
    else {
      const {data} = JSON.parse(body)
      const {after, children} = data
      const child = children.find(e => e.data.title.match(/Daily.*Discussion|Weekly.*Skepticism/i))
      const url = `${child.data.url}.json?limit=1000`
      getAllChildren(url, (err, children) => {
        const posts = getAllPosts(children)
        const match = shills(posts)
        const text = u
          .chain({'Symbol': {mentions: 'Mention', score: 'Score'}})
          .extend(match)
          .map((val, key) => [key, val.mentions, val.score])
          .sortBy(e => -e[2])
          .map(e => e.join('\t'))
          .value()
          .join('\n')
        callback(null, text)
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

let i = 0
const shills = (posts) => {
  const definitions = require('../assets/definitions.json')
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