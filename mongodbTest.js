var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

var options = {
    db: {
        w: 0
    },
    native_parser: true

}

// Establish connection to db
MongoClient.connect("mongodb://localhost:27017/test", options, function(err, db) {

    var collection = db.collection("foo");
    // Insert a single document
    collection.insert({hello:'world_no_safe'});

    db.close();
    // Wait for a second before finishing up, to ensure we have written the item to disk
/*    setTimeout(function() {

        // Fetch the document
        collection.findOne({hello:'world_no_safe'}, function(err, item) {
            assert.equal(null, err);
            assert.equal('world_no_safe', item.hello);
            db.close();
        })
    }, 1000);*/
});