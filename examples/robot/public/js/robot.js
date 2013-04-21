var socket; // used for everything.

function fwd () {
    // sends a forward command
    console.log("Sending fwd");
    socket.emit('control', {fwd: 1});
}

function rev () {
    // sends a forward command
    console.log("Sending rev");
    socket.emit('control', {rev: 1});
}
function left () {
    // sends a forward command
    console.log("Sending left");
    socket.emit('control', {left: 1});
}
function right () {
    // sends a forward command
    console.log("Sending right");
    socket.emit('control', {right: 1});
}
function stop () {
    // sends a forward command
    console.log("Sending stop");
    socket.emit('control', {stop: true});
}


$(document).ready(function() {
    console.log("Initialising motion stuff");
    //mo.init();

    // do the even binding
    $("#fwd").bind("click", fwd);
    $("#rev").bind("click", rev);
    $("#left").bind("click", left);
    $("#right").bind("click", right);
    $("#stop").bind("click", stop);

    // set up the web sockets stuff.
    console.log("Setting up websockets");
   
    socket = io.connect("http://localhost");
    socket.on('connect_ack', function(data) {
        // we are connected
        console.log("Connected");
        $("#connection").removeClass("waiting");
        $("#connection").addClass("connected");
        $("#connection").text("Robot online...");
    });
});
