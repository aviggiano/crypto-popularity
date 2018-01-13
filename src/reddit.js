const u = require('underscore')

module.exports = (subreddit, callback) => {
  const request = require('request')

  const url = `https://www.reddit.com${subreddit}/.json`
  request(url, (err, res, body) => {
    if (err) callback(err)
    else {
      const {data} = JSON.parse(body)
      const {after, children} = data
      const child = children.find(e => e.data.title.match(/Daily.*Discussion/i))
      request(`${child.data.url}.json`, (err, res, body) => {
        if (err) callback(err)
        else {
          const data = JSON.parse(body)
          const {children} = data[1].data
          const posts = children.map(e => e.data.body)
          const match = shills(posts)
          const text = u
            .chain(match)
            .map((val, key) => [key, val])
            .sortBy(e => e[1])
            .reverse()
            .map(e => `${e[0]}\t${e[1]}`)
            .value()
            .join('\n')
          callback(null, text)
        }
      })
    }
  })
}

const shills = (posts) => {
  const definitions = require('../assets/definitions.json')
  const ans = {}
  u.each(definitions, (val, key) => {
    const valIgnoreCaseFirstLetter = val
      .split(' ')
      .map(w => `[${w[0].toLowerCase()}${w[0].toUpperCase()}]${w.substring(1, w.length)}`)
      .join(' ')
    const reVal = new RegExp(`\\b${valIgnoreCaseFirstLetter}\\b`, 'g')
    const reKey = new RegExp(`\\b${key}\b`, 'g')
    const noRepeatPost = {}
    posts.forEach((post, i) => {
      if (post) {
        post.split('\n').forEach(line => {
          if (!noRepeatPost[i] && (line.match(reVal) || line.match(reKey))) {
            ans[key] = ans[key] || 0
            ans[key] += 1
            noRepeatPost[i] = true
          }
        })
      }
    })
  })
  return ans
}