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
    Q = require('q');

redis.on("error", function (err) {
    console.log("Redis Error" + err);
});

var app = express();
//message are not saved - could use redis here
// var messages = [];
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
app.get("/msg/:room/:msg", function (req, res) {
    var msg = req.params.msg;
    var room = req.params.room;
    var id = 0;

    var room_exist = function () {
        var deferred = Q.defer();
        redis.hexists(room, "id", function (err, response) {
            if (err)
                throw err;
            deferred.resolve(response);
        });
        return deferred.promise;
    };


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

    var createRoom = function () {
        var deferred = Q.defer();
        redis.hset(room, "id", 1, function (err) {
            if (err)
                throw err;
            deferred.resolve("success");
        });
        return deferred.promise;
    };


    room_exist().then(function (exist) {
        //room exist
        if (exist == 1) {
            return getMessageCounter().then(function (counter) {
                console.log("@counter", counter);
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
            client.json({
                count : counter, //messages.length,
                messages : [{
                    msg : msg
                }]
            });
        }
        res.end();
    });
});

//message broadcast / client listenr
app.get("/poll/:room/:pid", function (req, res) {
    var pid = req.params.pid;
    var room = req.params.room;
    var id = 0;

    //check if room exist
    var room_exist = function() {
        var deferred = Q.defer();
        redis.hexists(room, "id", function (err, response) {
            if (err)
                throw err;
            console.log("@checker", response);
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
            console.log("_@id", response);
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
        console.log("@id", id);
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
                        messages.push({
                            msg : replies[0][i]
                        });
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