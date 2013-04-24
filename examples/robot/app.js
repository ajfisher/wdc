/** Core server code for the robotic control **/
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var fs = require('fs');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serial_open = false;

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

    if (serial_open) {
        socket.emit("connect_ack", {msg: "Welcome Control", state: "ONLINE"});
    } else {
        socket.emit("connect_ack", {msg: "Welcome Control", state: "NOMOTORS"});
    }

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

        serstring = serstring + String.fromCharCode(base + vel)+ String.fromCharCode(base + turn);

        serstring = serstring + String.fromCharCode(endch) + String.fromCharCode(endch);

        //console.log("SOCKET->SERIAL:: " + serstring);
        ser.write(serstring);
    });

    socket.on("faststop", function() {
        console.log("SOCKET:: CLOSE EMERGENCY");
        ser.close(function() {
            serial_open = false;
            console.log("SERIAL:: CLOSED");
        });
    });


    socket.on("disconnect", function() {
        console.log("SOCKET:: User has been disconnected");
    });


});


// set up the serial connection
var ser = new SerialPort("/dev/ttyUSB0", {
    baudrate: 4800
});

ser.on("open", function() {
    serial_open = true;
    console.log("SERIAL:: Serial Port is ready for business");
});

ser.on("error", function(err) {
        console.log("SERIAL:: Couldn't open the USB port");
});


