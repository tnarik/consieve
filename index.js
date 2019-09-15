const mytest = () => {
  return "Added test"
}
module.exports = conf => {
   return {
      mytest,
      ...require('./lib/confluence.js')(conf)
   }
}