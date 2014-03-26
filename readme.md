<h4>This is just a PROTOTYPE</h4>

##A js chat client / nodejs server
So wanted to create a simple chat client. After poking around decided to use nodejs, long polling and try out redis as a data store.

The server supports multiple chat rooms and automaticly creates a new room if it does not exist.

## To run
npm install<br>
cd server <br>
PORT=3000 node-dev app.js <br>
<br>
Visit http://localhost:3000