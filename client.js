
var net = require("net");
var readline = require("readline");

function ChatClient(port) {
  this.io = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // this.client is a socket connecting the client with the server
  this.client = new net.Socket();
  this.client.connect(port, "localhost");// Connect to the server on its port
  this.clientId = null;

  this.attachIOListeners();
  this.attachChatListeners();
};

ChatClient.prototype.attachIOListeners = function() {
  // Write user input to socket
  this.io.on("line", function(userInput){
    this.client.write(userInput);
  }.bind(this));

  this.io.on("SIGINT", function() {
    // Close client connection and I/O listener
    console.log("Closing client...");
    this.clientId = null;
    this.client.end();
    this.io.close();
  }.bind(this));
};

ChatClient.prototype.attachChatListeners = function() {
  // Handle JSON data when the client socket emits the "data" event
  this.client.on("data", function(dataReadin){
    // Convert buffer to JSON
    var dataRead = JSON.parse(dataReadin.toString('utf8', 0, dataReadin.len));
    // React to JSON object
    if (dataRead.type === "OK"){
      this.clientId = dataRead.clientId;
    } else if (dataRead.type === "JOIN"){
      console.log("Client #" + dataRead.clientId.toString() + " has joined.");
    } else if (dataRead.type === "MSG"){
      if (dataRead.clientId === this.clientId){
        console.log("ME: " + dataRead.message);
      } else {
        console.log("CLIENT #" + dataRead.clientId.toString() + ": " + dataRead.message);
      }
    } else if (dataRead.type === "LEAVE"){
        console.log("CLIENT #" + dataRead.clientId.toString() + " has left.");
    }
  });
  this.client.on("end", function() {
    if(this.client) {
      // Handle a client exiting
      this.clientId = null;
      this.client.end();
      this.io.close();
    }
  }.bind(this));

  this.client.on("error", function(e) {
    // Handle errors
    console.log("Server closed connection.");
    this.clientId = null;
    this.client.end();
    this.io.close();
  }.bind(this));
};

var client = new ChatClient(4242);