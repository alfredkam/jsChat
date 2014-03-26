'use strict';

var http = require("http"),
    request = require("request"),
    express = require("express"),
    path = require('path'),
    fs = require('fs');

var app = express();
var messages = [];
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
    messages.push(msg);
    while(clients.length > 0) {
        var client = clients.pop();
        client.json({
            count : messages.length,
            append : msg + "\n"
        });
    }
    res.end();
});

//message broadcast / client listenr
app.get("/poll/:room/:pid", function (req, res) {
    var pid = req.params.pid;
    if (messages.length > pid) {
        res.json({
            count : messages.length,
            append : messages.slice(pid).join("\n")+"\n"
        });
    } else {
        clients.push(res);
    }
});
/* end of mocking routes */

//set server to listen to ...
http.createServer(app).listen(app.get('port'), function(){
    console.info('Express server listening on port '+ app.get('port'));
});