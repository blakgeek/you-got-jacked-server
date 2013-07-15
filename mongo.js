var DB = require("mongodb").Db,
    MongoClient = require("mongodb").MongoClient,
    Server = require("mongodb").Server,
    Base62 = require("base62");

var connectionConfig = {
    native_parser: true,
    db: {
        w: 1
    }
}

console.log('outer')

MongoClient.connect("mongodb://localhost:27017/test", connectionConfig, function(err, db) {

    console.log('starting')
    var foo = db.collection("foo", {w: 0});
    var x = {}
    var key = "some.k";
    console.log(Base62.encode(1213451351));


    foo.update({name: new Date().getTime()}, {$inc: {count: 1}}, {w: 1, upsert: false, new: true}, function(err, item){
        console.log(foo.findOne({}))
        db.close();
    });
})

