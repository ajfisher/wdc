// slide show code to make things "flick"

var debug = false;

var current_motion; // used to hold current motion object for use.
var flick_threshold = 1.8 // how many ms^-2 to pull to consider a flick - arbitrary but works
var TRAJECTORY = {RIGHT: 1, NONE: 0, LEFT: -1};
var current_trajectory = TRAJECTORY.NONE; // used to hold general direction of travel.
var cooldown_period = 1500; // # msec to wait for debounce purposes.
var cooldown_counter = 0;

var sample_rate = 1000 / 60;    // sample rate in msec at 60 samples per s

var motion_running = false;
var tracker_interval = 0;
var click_motion = function() {
    // deals with toggling the motion detection on and off.
    if (motion_running) {
        window.removeEventListener("devicemotion", update_accel);
        motion_running = false;
        $("#motiontoggle span").text("Start");
        window.clearInterval(tracker_interval);
    } else {
        window.addEventListener("devicemotion", update_accel, false);
        motion_running = true;
        $("#motiontoggle span").text("Stop");
        tracker_interval = window.setInterval(motion_tracker, sample_rate);
    }
}

var update_accel = function(e) {
    // simply updates the motion value with the event data so there's no lag.
    current_motion = deviceMotion(e);
}

var motion_tracker = function() {
    // used to do the motion tracking (we're only interested in X value.
    
    var ax = current_motion.acceleration.x;

    // This is a really dirty cooldown method. Essentially it relies on
    // there being a fairly well known period on the interval period. It's not
    // perfect but good enough for some debouncing on the accelerometer and
    // without needing to much around with Date objects which slows things down.
    cooldown_counter = cooldown_counter - sample_rate;
    if (cooldown_counter <= 0) {

        if (Math.abs(ax) > flick_threshold && current_trajectory === TRAJECTORY.NONE) {
            // we're moving at speed
            if (ax > 0) {
                current_trajectory = TRAJECTORY.RIGHT;
            } else {
                current_trajectory = TRAJECTORY.LEFT;
            }
        } else if (current_trajectory !== TRAJECTORY.NONE && Math.abs(ax) < (0.5*flick_threshold)) {
            // we've now rapidly stopped - so lets switch the image
            if (current_trajectory === TRAJECTORY.RIGHT) {
                $(".cycle-slideshow").cycle("prev");
                if (debug) {
                    $("#stat").text("Flicked Left");
                }
            } else {
                $(".cycle-slideshow").cycle("next");
                if (debug) {
                    $("#stat").text("Flicked Right");
                }
            }
            current_trajectory = TRAJECTORY.NONE;
            // reset the cooldown so we don't check all this again for a bit
            // and we only care about it when we've actually stopped.
            cooldown_counter = cooldown_period;
        }
    }
    if (debug) {
        $("#motionx").text(ax);
        $("#trajectory").text(current_trajectory);
        $("#absx").text(Math.abs(ax));
    }
}

$(document).ready(function() {
    mo.init();

    if (mo.motion === false) {
        $("#nomotion").show();
    } else {
        // we do all the set up stuff.
        $("#motiontoggle").show();
        if (debug) {
            $("#motiondata").show();
        }
        $("#motiontoggle").bind("click", click_motion); 
    }
});

