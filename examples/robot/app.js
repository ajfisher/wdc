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
        // control messages send two bytes followed by \n to the arduino
        // Byte 0: 0-255: speed with 128 being 0, >128 is forward and <128 backwards
        // Byte 1: 0-255: direction with 128 being 0, >128 turns right and < 128 turns left
        //
        // for testing we use 0-127 with 64 being the flip over point.
        console.log(data);
        var base = 64;
        var change = 32;
        var serstring = "";
        if (data.fwd) {
            console.log("Going forward");

            serstring = serstring + String.fromCharCode(base+change) + String.fromCharCode(base);
            //serstring = "Z@";
        }
        if (data.stop) {
            console.log("STOP!!");
            serstring = serstring + String.fromCharCode(base) + String.fromCharCode(base);
            //serstring = "@@";
        }
        if (data.rev) {
            console.log("Going backwards");
            serstring = serstring + String.fromCharCode(base-change) + String.fromCharCode(base);
            //serstring = " @";
        }

        if (data.left) {
            console.log("going left");
            serstring = serstring + String.fromCharCode(110) + String.fromCharCode(1);
        }
        if (data.right) {
            console.log("going right");
            serstring = serstring + String.fromCharCode(110) + String.fromCharCode(126);
        }
        
        serstring = serstring + "\n";

        console.log(serstring);

        ser.write(serstring);
    });

    socket.on("disconnect", function() {
        console.log("User has been disconnected");
    });


});


// set up the serial connection
var ser = new SerialPort("/dev/ttyUSB0"); // TODO fix this to work properly.

ser.on("open", function() {
    console.log("Serial Port is ready for business");
});

ser.on("error", function(err) {
        console.log("Couldn't open the USB port");
});


