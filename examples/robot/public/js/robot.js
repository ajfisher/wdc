var socket; // used for everything.

var change = 48;

function drive(velocity, turnamt) {
    socket.emit('control', {vel: velocity, turn: turnamt});
} 



$(document).ready(function() {
    console.log("Initialising motion stuff");
    //mo.init();

    // do the even binding
    $("#fwd").bind("click", function() { drive(change, 0)});
    $("#rev").bind("click", function() { drive(-change, 0)});
    $("#left").bind("click", function() { drive(0, change)});
    $("#fwdleft").bind("click", function() { drive(change, change)});
    $("#revleft").bind("click", function() { drive(-change, change)});
    $("#right").bind("click", function() { drive(0, -change)});
    $("#fwdright").bind("click", function() { drive(change, -change)});
    $("#revright").bind("click", function() { drive(-change, -change)});
    $("#stop").bind("click", function() { drive(0, 0)});

    // set up the web sockets stuff.
    console.log("Setting up websockets");
   
    socket = io.connect(location.host);
    socket.on('connect_ack', function(data) {
        // we are connected
        console.log("Connected");
        $("#connection").removeClass("waiting");
        $("#connection").removeClass("disconnected");
        $("#connection").addClass("connected");
        $("#connection").text("Robot online...");
    });
    socket.on("disconnect", function() {
        // disconnected
        console.log("Disconnected");
        $("#connection").removeClass("connected");
        $("#connection").addClass("disconnected");
        $("#connection").text("Robot disconnected");
    });
});
