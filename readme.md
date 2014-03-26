<h4>This is just a something i wrote in couple of hours, cheers - ak</h4>

##A js chat client / nodejs server
So wanted to create a simple chat client. After poking around decided to use nodejs, long polling and try out redis as a data store.

The server supports multiple chat rooms and automaticly creates a new room if it does not exist.

##Usage with client
include jquery 1.8.3<br>
include client.js<br>
and initiate with jsChat.init($("element"), 'room number', 'username');<br>
you can define the jquery element any size you want, but i will suggest no smaller then h:300px w:200px<br>

##Usage without client
if you are going to design your on client<br>
your client can poll on<br>

messageCounter sets where you left off, setting it to 0 will indicate you just initalize your client<br>
GET: /client/:roomName/:messageCounter<br>
<pre>
//returns the 10 newest message if its your first time syncing with server
return {
        count : int, //returns the latest message counter
        messages: [{
            user : username,
            timestamp : timestamp,  //i use momentjs to create the timestamp
            counter : 
        }]
    }
</pre>
EXAMPLE : https://github.com/alfredkam/jsChat/blob/master/client.js#L24

POST: /msg/:roomName/:message <be>
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