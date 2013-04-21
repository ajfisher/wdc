/** Core server code for the robotic control **/
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var fs = require('fs');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

// configuration and routing
app.configure(function() {
    app.set('port', 8000);
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

server.listen(app.get('port'));

var io = require('socket.io').listen(server);

console.log("Web server now listening");

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/public/index.html');
});


// now we define all the socket routing

io.sockets.on("connection", function(socket) {
    socket.emit("connect_ack", {msg: "Welcome Control"});

    socket.on("control", function(data) {
        console.log(data);
        if (data.fwd) {
            console.log("Going forward");
            ser.write("Z@\n");
        }
        if (data.stop) {
            console.log("STOP!!");
            ser.write("@@\n");
        }
        if (data.rev) {
            console.log("Going backwards");
            ser.write(" @\n");
        }
    });

});


// set up the serial connection
var ser = new SerialPort("/dev/ttyUSB0");
ser.on("open", function() {
    console.log("Serial Port is ready for business");
});


