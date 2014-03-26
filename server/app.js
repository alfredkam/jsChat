'use strict';

var http = require("http"),
    request = require("request"),
    express = require("express"),
    path = require('path'),
    fs = require('fs'),
    _redis = require('redis'),
    //NOTE:: redis functions are asyn, so need to use promise to wrap them around
    redis = _redis.createClient(),
    _ = require('lodash'),
    Q = require('q'),
    moment = require('moment');

redis.on("error", function (err) {
    console.log("Redis Error" + err);
});

var app = express();
var clients = [];

//common configurations
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
});

app.configure('development', function(){
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));
    /* need to indicate the directory you will be serving */
    app.use(express.static('../'));
    app.use(express.errorHandler());
});

app.get("/clientTemplate", function (req, res) {
    /* fs read file should not be placed here, should be placed outside of this scope. to limit the file io */
    var tpl;
    fs.readFile('./template.html', function (err, html) {
        if(err)
            throw err;
        tpl = html;
        res.set('Content-Type', 'type/html');
        res.send(new Buffer(tpl));
    });
   
});

//Client posting a message
app.post("/msg/:room/:msg", function (req, res) {

    var msg = JSON.stringify({
        msg : req.params.msg,
        user : req.body.user || "Guest",
        timestamp : moment.utc().valueOf()
    });
    var room = req.params.room;
    var id = 0;

    //check if room exist
    var room_exist = function () {
        var deferred = Q.defer();
        redis.hexists(room, "id", function (err, response) {
            if (err)
                throw err;
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    //get message counter by specific room
    var getMessageCounter = function () {
        var deferred = Q.defer();
        //get current id
        redis.hget(room, "id", function (err, response) {
            if (err)
                throw err;
            deferred.resolve(parseInt(response));
        });
        return deferred.promise;
    };

    //writing to redis
    var setHash = function (id) {
        var deferred = Q.defer();
        //set msg by to be incremented id
        redis.hset(room, (parseInt(id) + 1), msg, function (err, response) {
            if (err) {
                throw err;
            }
            deferred.resolve(response);
        });

        return deferred.promise;
    };

    //increment counter
    var incrementCounter = function () {
        var deferred = Q.defer();
        //increment id
        redis.hincrby(room, "id", 1, function (err, response) {
            if (err)
                throw err;
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    //create a new hash
    var createRoom = function () {
        var deferred = Q.defer();
        redis.hset(room, "id", 1, function (err) {
            if (err)
                throw err;
            deferred.resolve("success");
        });
        return deferred.promise;
    };

    //process data
    room_exist().then(function (exist) {
        //room exist
        if (exist == 1) {
            return getMessageCounter().then(function (counter) {
                return setHash(counter).then(function (){
                    return incrementCounter().then(function (){
                        return counter + 1;
                    });
                });
            });
        } else {
            return createRoom().then(function () {
                return setHash(0).then(function () {
                    return 1;
                });
            });
        }
    }).then(function (counter) {
        // redis.hset(room, )
        // messages.push(msg);
        while(clients.length > 0) {
            var client = clients.pop();
            var d = JSON.parse(msg);
            d.timestamp = moment(d.timestamp).format("MM/DD h:mma");
            client.json({
                count : counter, //messages.length,
                messages : [
                    d
                ]
            });
        }
        res.end();
    });
});

//message broadcast / client listener
app.get("/client/:room/:pid", function (req, res) {
    var pid = req.params.pid;
    var room = req.params.room;
    var id = 0;

    //check if room exist
    var room_exist = function() {
        var deferred = Q.defer();
        redis.hexists(room, "id", function (err, response) {
            if (err)
                throw err;
            deferred.resolve(response);
        });
        return deferred.promise;
    };

    //get the message counter in that room
    var getMessageCounter = function () {
        var deferred = Q.defer();
        redis.hget(room, "id", function (err, response) {
            if (err)
                throw err;
            deferred.resolve(parseInt(response));
        });
        return deferred.promise;
    };
 
    //sumarize room_exist and getMessageCounter
    var getPidCounter = function () {
        return room_exist()
        .then(function (exist) {
            if (exist == 1) {
                return getMessageCounter()
                .then(function (counter) {
                    return counter;
                });
            } else {
                return 0;
            }
        });
    };

    //finally call this function to return data
    getPidCounter().then(function (id) {
        if (id > pid) {
            //get first 10;
            var hmget = [];
            for (var i = id; i > 0 && i > ((id - 10) >= 0?(id-10):0) &&  i >= pid; i--) {
                hmget.push(i);
            }
            hmget.push(room);
            hmget.push("hmget");

            hmget = _(hmget).reverse().value();
            
            //using promise to defer process
            var multi = function () {
                var deferred = Q.defer();
                redis.multi([hmget]).exec(function (err, replies) {
                    var messages = [];
                    for (var i in replies[0]) {
                        var d = JSON.parse(replies[0][1]);
                        d.timestamp = moment(d.timestamp).format("MM/DD h:mma");
                        messages.push(d);
                    }
                    deferred.resolve(messages);
                });
                return deferred.promise;
            };
            multi().then(function (body) {
                res.json({
                    count : id,
                    messages : body
                });
            });
        } else {
            clients.push(res);
        }
    });
});

//set server to listen to ...
http.createServer(app).listen(app.get('port'), function(){
    console.info('Express server listening on port '+ app.get('port'));
});