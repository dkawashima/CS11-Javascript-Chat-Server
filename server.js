
var net = require("net");

function ChatServer(port) {
  this.port = port;
  this.totalClients = 0;
  this.clients = {};
  this.server = net.createServer();

  this.attachListeners();

  
  this.server.listen(port, "localhost", function(){ // Run server
  		// Show that server is running
		console.log("Server listening on port " + this.port.toString()); 
		}.bind(this));
}

// Broadcast the same message to each connected client.
ChatServer.prototype.broadcast = function(message) {
  for (var key in this.clients){
  	this.clients[key].write(message);
  }
};

// This function is called whenever a new client connection is made.
ChatServer.prototype.onConnection = function(socket) {

  // Increment IDs
  this.totalClients++;
  console.log("Client #" + this.totalClients.toString() + " connected!");

  // Add client to clients map
  this.clients[this.totalClients] = socket;

  // Log which client connected and send OK to client
  var newclientInfo = {"type": "OK", "clientId": this.totalClients};
  this.clients[this.totalClients].write(JSON.stringify(newclientInfo));

  // Use broadcast function to send a join JSON message
  var clientJoin = {"type": "JOIN", "clientId": this.totalClients};
  this.broadcast(JSON.stringify(clientJoin));

  // Handle client closing when "close" event comes from client
  var key = this.totalClients;

  /* Broadcast msg message when "data" event comes from client, print info to 
   * server */
  this.clients[key].on("data", function(dataReadin){
  	// Convert buffer to string
  	var dataRead = dataReadin.toString('utf8', 0, dataReadin.len);
  	var toSend = {"type": "MSG", "clientId": key, "message" : dataRead};
  	this.broadcast(JSON.stringify(toSend));
  	console.log("RECV(" + toSend.clientId.toString() + "): " + dataRead);
  }.bind(this));

  // Handle client closing when "close" event comes from client
  this.clients[key].on("close", function(err){
  	if (!err){
  		var closed = {"type": "LEAVE", "clientId": key};
  		delete this.clients[key];
  		this.broadcast(JSON.stringify(closed));
  		console.log("Client #" + key.toString() + " closed its connection.");
  	}
  }.bind(this));

};

// Attach listeners for "connection" and "error" events.
ChatServer.prototype.attachListeners = function() {
  // Handle connection and error events
  this.server.on("connection", this.onConnection.bind(this));

  this.server.on("error", function(){
  	});
};

var server = new ChatServer(4242);