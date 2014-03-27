<h4>This is just a something i wrote in couple of hours, cheers - ak</h4>

##A js chat client / nodejs server
So wanted to create a simple chat client. After poking around decided to use nodejs, long polling and try out redis as a data store.

The server supports multiple chat rooms and automaticly creates a new room if it does not exist.


Link to <a href='http://132.206.3.203/game/odimZu'>Demo</a> (integrated with krakenjs / marionette)

##Usage with client
include jquery 1.8.3<br>
include client.js<br>
and initiate with 
<pre>jsChat.init($("element"), 'room number', 'username');</pre>
you can define the dom element any size you want, but i will suggest no smaller then h:300px w:200px<br>

##Usage without client
if you are going to design your on client<br>
your client can poll on<br>
<pre>
messageCounter sets where you left off, setting it to 0 will indicate you just initalize your client
GET: /client/:roomName/:messageCounter
</pre>
<pre>
//returns the 10 newest message if its your first time syncing with server
return {
        count : messageCounter, //returns the latest message counts
        messages: [{
            user : username,
            timestamp : timestamp,  //i use momentjs to create the timestamp
        }]
    }
</pre>
EXAMPLE : https://github.com/alfredkam/jsChat/blob/master/client.js#L24
<br><br>
<pre>
POST: /msg/:roomName/:message
</pre>
Also need to pass 
<pre>
{
    user : username     //if you dont pass it, it will store the name as 'Guest'
}
</pre>
EXAMPLE : https://github.com/alfredkam/jsChat/blob/master/client.js#L45

## To run
npm install<br>
cd server <br>
PORT=3000 node-dev app.js <br>
<br>
Visit http://localhost:3000