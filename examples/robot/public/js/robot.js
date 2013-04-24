var socket; // used for everything.

var change = 48;
var MAXSPEED = 50; // set as constant
var REVERSE_ANGLE = 60; // breakpoint for when you are reversing
var REVERSE_ANGLE_MAX = 90; // limit
var REVERSE_RANGE = REVERSE_ANGLE_MAX - REVERSE_ANGLE; // gives an operating range

var FORWARD_ANGLE = 45; // breakpoint for when yor are forwarding
var FORWARD_ANGLE_MAX = 5; // limit
var FORWARD_RANGE = FORWARD_ANGLE - FORWARD_ANGLE_MAX; // operating range

var STEERING_ANGLE_MIN = 5; // when to start 
var STEERING_ANGLE_MAX = 60; // limit
var STEERING_RANGE = STEERING_ANGLE_MAX - STEERING_ANGLE_MIN; // operating range

// orientation globals
var orientation_running = false; // check if things are running or not
var current_orientation; // holds the orientation event stuff.
var sample_rate = 1000 / 10; // number of times to sample sensor a second
var orientation_interval = null;

function drive(velocity, turnamt) {
    socket.emit('control', {vel: Math.round(velocity), turn: Math.round(turnamt)});
}

function emergencystop() {
    // emergency kill switch messaging
    console.log("Emergency stop");
    socket.emit('faststop', {stop:true});
    $("#connection").removeClass();
    $("#connection").addClass("emergency");
    $("#connection").text("Emergency Stop");
    window.removeEventListener("deviceorientation", update_gyro);
    orientation_running = false;
    clearInterval(orienation_interval);
}

function start() {
    // start up everything
    if (orientation_running) {
        orientation_running = false;
        window.removeEventListener("deviceorientation", update_gyro);
        clearInterval(orientation_interval);
    } else {
        orientation_running = true;
        window.addEventListener("deviceorientation", update_gyro);
        orientation_interval = setInterval(orientation_tracker, sample_rate);
    }
}



function update_gyro(e) {
    // just sets the gyro values to a global for later use.
    current_orientation = e;
}

var orientation_tracker = function() {
    // gets the current orientation values
    if (current_orientation.gamma === null) { return; }

    var beta = current_orientation.beta;
    var gamma = current_orientation.gamma;
    var vel = 0;
    var vel_dir = 0;
    var turn = 0;
    var turn_dir = 0;

    $("#gamma").text(gamma);
    $("#beta").text(beta);
    // so we assume that when the device is on its side that gamma is for 
    // acceleration and beta is for steering

    // let's assume a comfortable "neutral" position for gamma is about 45 deg
    // and this is absolute = so + - doesn't matter. > 45 means reversing, <45
    // means accelerating. we then work across a range to accomodate speed.

    var gamma_abs = Math.abs(gamma); // so we don't keep calulating it

    $("#status").text(gamma_abs);

    if (gamma_abs > REVERSE_ANGLE) {
        // pulling back to reverse
        vel_dir = -1;
        if (gamma_abs > REVERSE_ANGLE_MAX) {
            gamma_abs = REVERSE_ANGLE_MAX;
        }
        vel = (gamma_abs - REVERSE_ANGLE) / REVERSE_RANGE * MAXSPEED;
    } else if (gamma_abs < FORWARD_ANGLE) {
        // pushing forward to accelerate
        vel_dir = 1;
        if (gamma_abs < FORWARD_ANGLE_MAX) {
            gamma_abs = FORWARD_ANGLE_MAX;
        }
        vel = (FORWARD_ANGLE - gamma_abs) / FORWARD_RANGE * MAXSPEED;
        // now we determine the extent.
    }

    vel = vel * vel_dir;
    $("#vel").text(vel);

    // now we do the steering. This can invert depending on the gamma. 
    // So if gamma is positive then steering to the right (clockwise) will
    // have a -ive value for beta. If gamma is -ive then this will reverse.

    var gamma_correction = -1; // assumes a +ive gamma
    if (gamma < 0) {
        gamma_correction = 1;
    }

    var beta_corrected = beta * gamma_correction;
    var beta_abs = Math.abs(beta_corrected);

    if (beta_corrected < -STEERING_ANGLE_MIN) {
        // we're going left
        turn_dir = -1;
    } else if (beta_corrected > STEERING_ANGLE_MIN) {
        turn_dir = 1;
    }

    // turning works much the same as acceleration. Just look at the angle
    // on the range and then map it to the acceptable input range.

    if (turn_dir !== 0) {
        // we're turning, now by how much
        if (beta_abs > STEERING_ANGLE_MAX) {
            beta_abs = STEERING_ANGLE_MAX;
        }
        turn = (beta_abs - STEERING_ANGLE_MIN) / STEERING_RANGE * MAXSPEED;
    }
    turn = turn * turn_dir;
    $("#turn").text(turn);

    // send the message with the speed and turn.
    drive(vel, turn);
}


$(document).ready(function() {
    console.log("Initialising motion stuff");
    mo.init();

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

    $("#startgyro").bind("click", start);
    $("#emergency").bind("click", emergencystop);

    // set up the web sockets stuff.
    console.log("Setting up websockets");
   
    socket = io.connect(location.host);
    socket.on('connect_ack', function(data) {
        // we are connected
        console.log("Connected");
        $("#connection").removeClass();
        if (data.state == "ONLINE") {
            $("#connection").addClass("connected");
            $("#connection").text("Robot online...");
        } else {
            $("#connection").addClass("nomotors");
            $("#connection").text("Control online but no motors");
        }
    });

    socket.on("disconnect", function() {
        // disconnected
        console.log("Disconnected");
        $("#connection").removeClass();
        $("#connection").addClass("disconnected");
        $("#connection").text("Robot disconnected");
    });
});
