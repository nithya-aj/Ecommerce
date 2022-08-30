// // Retrieve
var MongoClient = require('mongodb').MongoClient;
const state = {
    db: null
}
module.exports.connect = (done) => {
    const url = 'mongodb+srv://nithya:mongodb7@cluster0.2npjnyh.mongodb.net/?retryWrites=true&w=majority';
    //const url = 'mongodb://localhost:27017';
    const dbname = 'ecommerce';
    MongoClient.connect(url, (err, data) => {
        if (err) {
            return done(err)
        }
        state.db = data.db(dbname)
        done()
    })
}

module.exports.get = function () {
    return state.db
}

