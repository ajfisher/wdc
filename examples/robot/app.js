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

console.log("MESSAGE: Web server now listening");

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/public/index.html');
});


// now we define all the socket routing

io.sockets.on("connection", function(socket) {
    socket.emit("connect_ack", {msg: "Welcome Control"});

    socket.on("control", function(data) {
        // control messages send two bytes followed by \n to the arduino
        // Byte 0: 0-255: speed with 128 being 0, >128 is forward and <128 backwards
        // Byte 1: 0-255: direction with 128 being 0, >128 turns right and < 128 turns left
        //
        // for testing we use 0-127 with 64 being the flip over point.
        console.log(data);
        var base = 64;
        var change = 32;
        var endch = 10;
        var serstring = "";

        var vel = data.vel;
        var turn = data.turn;


        if (vel > 0) {
            console.log("SOCKET:: Going forward");
        } else if (vel < 0) {
            console.log("SOCKET:: Going backwards");
        } else {
            console.log("SOCKET: Stationary");
        }
        serstring = serstring + String.fromCharCode(base + vel);

        if (turn > 0) {
            console.log("SOCKET:: Turning right");
        } else if (turn < 0) {
            console.log("SOCKET:: Turning left");
        } else {
            console.log("SOCKET:: No turn");
        }
        serstring = serstring + String.fromCharCode(base + turn);
        
        serstring = serstring + String.fromCharCode(endch) + String.fromCharCode(endch);

        console.log("SOCKET->SERIAL:: " + serstring);
        ser.write(serstring);
    });

    socket.on("disconnect", function() {
        console.log("SOCKET:: User has been disconnected");
    });


});


// set up the serial connection
var ser = new SerialPort("/dev/ttyUSB0", {
//    parser: serialport.parsers.readline("\n"),
}); // TODO fix this to work properly.

ser.on("open", function() {
    console.log("SERIAL:: Serial Port is ready for business");
});

ser.on('data', function(data) {
//    console.log('SERIAL:: ' + data);
});

ser.on("error", function(err) {
        console.log("SERIAL:: Couldn't open the USB port");
});


