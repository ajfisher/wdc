/** This file is the main body of the racing game **/

if (!window.requestAnimationFrame) { // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimationFrame = window.webkitRequestAnimationFrame || 
                                 window.mozRequestAnimationFrame    || 
                                 window.oRequestAnimationFrame      || 
                                 window.msRequestAnimationFrame     || 
                                 function(callback, element) {
                                   window.setTimeout(callback, 1000 / 60);
                                 }
}

// Set up all of the general bits. Yes I **know** these are globals, but
// speed etc...
var fps = 60;
var step = 1/fps; // how often to attempt to get a new frame.
var width = 800;
var height = 500;
var canvas = null;
var ctx = null;

// camera and FOV settings
var camera_depth = 0.8;
var camera_height = 1000;
var player_z_scale = null;

// constants
var COLOURS = {
  SKY:  'cyan',
  LIGHT:  { road: '#6B6B6B', grass: '#10AA10', curb: 'white' },
  DARK:   { road: '#696969', grass: '#009A00', curb: 'red' },
  START:  { road: 'white',   grass: '#10AA10',   curb: 'white' },
  FINISH: { road: 'black',   grass: '#009A00',   curb: 'black' }
};

var KEY = {
  LEFT:  37,
  UP:    38,
  RIGHT: 39,
  DOWN:  40,
};

var PLAYER = { w: 80, h: 50, colour: "#ffffff" };

// defines everything around the road geometry
var ROAD = {
    LENGTH: { NONE: 0, SHORT:  25, MEDIUM:  50, LONG:  100 }, // num segments
    CURVE:  { NONE: 0, EASY:    2, MEDIUM:   4, HARD:    6 },

    add_segment: function (curve) {
        var n = segments.length;
        segments.push({
            index: n,
            p1: { world: { z:  n * segment_length }, camera: {}, screen: {} },
            p2: { world: { z: (n+1) * segment_length }, camera: {}, screen: {} },
            curve: curve,
            colour: Math.floor(n/curb_segments)%2 ? COLOURS.DARK : COLOURS.LIGHT
        });
    },

    add_road: function(enter, hold, leave, curve) {
        var n;
        for(n = 0 ; n < enter ; n++) {
            this.add_segment(Misc.easeIn(0, curve, n/enter));
        }
        for(n = 0 ; n < hold  ; n++) {
            this.add_segment(curve);
        }
        for(n = 0 ; n < leave ; n++) {
            this.add_segment(Misc.easeInOut(curve, 0, n/leave));
        }
    },

    add_straight: function (num) {
        num = num || ROAD.LENGTH.MEDIUM;
        this.add_road(num, num, num, 0);
    },

    add_curve: function (num, curve) {
        num = num || ROAD.LENGTH.MEDIUM;
        curve = curve || ROAD.CURVE.MEDIUM;
        this.add_road(num, num, num, curve);
    },
        
    add_scurves: function () {
        this.add_road(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY);
        this.add_road(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.MEDIUM);
        this.add_road(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,   ROAD.CURVE.EASY);
        this.add_road(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.EASY);
        this.add_road(ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM, ROAD.LENGTH.MEDIUM,  -ROAD.CURVE.MEDIUM);
    }
};

// segment set up
var segments = [];          // array of all the road segments in the level.
var road_width = 2000; 
var segment_length = 200;   // length of an individual segment in the road.
var curb_segments = 4;      // number of segments used for each curb piece.
var track_length = null;    // determined when you load the track.
var draw_distance = 200;    // number of segments to draw out.
var finish_offset = 0.75*draw_distance;// number of segments to finish from the end.
var MAX_SEGMENTS = 500 + finish_offset;
// sprite scale
var sprite_scale = 0.3 * (1 / PLAYER.w) * road_width // this helps scale for the size of the road

// player details
var player_x = 0;
var player_z = null;
var speed = 0;
var position = 0;          // position of the player on the length of the track.
var max_speed = segment_length/step;
var accel = max_speed / 5;
var decel = -max_speed /10;
var braking = -max_speed*0.8;
var offroad_decel = -max_speed / 2;
var offroad_limit = 0.3*max_speed;
var centrifugal = 0.3;

// determine key state
var key_left = false;
var key_right = false;
var key_accel = false;
var key_decel = false;


// MISC functions
var Misc = {
    easeIn:    function(a,b,percent) { return a + (b-a)*Math.pow(percent,2);                           },
    easeOut:   function(a,b,percent) { return a + (b-a)*(1-Math.pow(1-percent,2));                     },
    easeInOut: function(a,b,percent) { return a + (b-a)*((-Math.cos(percent*Math.PI)/2) + 0.5);        },
    percent_left: function(n, total) { return (n % total) / total; },

    project: function (p, camerax, cameray, cameraz, camera_depth, width, height, road_width) {
        // takes a point and projects it on to the screen
        p.camera.x     = (p.world.x || 0) - camerax;
        p.camera.y     = (p.world.y || 0) - cameray;
        p.camera.z     = (p.world.z || 0) - cameraz;
        p.screen.scale = camera_depth/p.camera.z;
        p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
        p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
        p.screen.w     = Math.round(             (p.screen.scale * road_width   * width/2));
    },

}

// Now into the main bit
var Draw = {

    segment_poly: function (ctx, x1, y1, x2, y2, x3, y3, x4, y4, colour) {
        // this method draws a segment poly to the canvas.
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
        ctx.closePath();
        ctx.fill();
    },

    segment: function (ctx, segment) { //, x1, y1, w1, x2, y2, w2, colour) {
        // draws an actual road and game segment.
        
        // work out the curb widths
        var c1 = segment.p1.screen.w / 6;
        var c2 = segment.p2.screen.w / 6;
        var x1 = segment.p1.screen.x;
        var x2 = segment.p2.screen.x;
        var y1 = segment.p1.screen.y;
        var y2 = segment.p2.screen.y;
        var w1 = segment.p1.screen.w;
        var w2 = segment.p2.screen.w;

        ctx.fillStyle = segment.colour.grass;
        ctx.fillRect(0, y2, width, y1 - y2);
        
        Draw.segment_poly(ctx, x1-w1-c1, y1, x1-w1, y1, x2-w2, y2, x2-w2-c2, y2, segment.colour.curb);
        Draw.segment_poly(ctx, x1+w1+c1, y1, x1+w1, y1, x2+w2, y2, x2+w2+c2, y2, segment.colour.curb);
        Draw.segment_poly(ctx, x1-w1, y1, x1+w1, y1, x2+w2, y2, x2-w2, y2, segment.colour.road);
    },

    background: function() {
        // draws the background in
        ctx.fillStyle = COLOURS.SKY;
        ctx.fillRect(0, 0, width, height);
    },

    player: function() {
        // draws the racer in
        ctx.fillStyle = "#ffffff";

        // this compensates the scale factors of the vehicle etc back to 
        // the overall scale of the display
        w = (PLAYER.w * player_z_scale * width / 2) * sprite_scale;
        h = (PLAYER.h * player_z_scale * width /2) * sprite_scale;

        // this creates the relative offset to then draw the item.
        x = width /2 + (w * -0.5);
        y = height + (h * -1.0); 

        // TODO Actually draw the car...
        ctx.fillRect(x, y, w , h);
    },

    frame: function () {
        // renders the game out to the canvas.
        
        var player_segment = find_segment(position); // grabs the player pos, gets the segment from that.
        var percent_left = Misc.percent_left(position, segment_length);
        var max_y = height;

        var x  = 0;
        var dx = - (player_segment.curve * percent_left);

        ctx.clearRect(0, 0, width, height);

        Draw.background();

        var i, segment;
        for (i=0; i<draw_distance; i++) {
            segment = segments[(player_segment.index + i) % segments.length];

            Misc.project(segment.p1, (player_x * road_width) - x, camera_height, position, camera_depth, width, height, road_width);
            Misc.project(segment.p2, (player_x * road_width) - x - dx, camera_height, position, camera_depth, width, height, road_width);

            x = x + dx;
            dx = dx + segment.curve;

            if ((segment.p1.camera.z <= camera_depth) || (segment.p2.screen.y >= max_y)) 
                continue;
            Draw.segment(ctx, segment);

            max_y = segment.p2.screen.y;
        }

        Draw.player();

        $("#speed").text("Speed: " + speed);
        $("#maxspeed").text("Max: " + max_speed);
        $("#offlimit").text("Off: " + offroad_limit);
    },
}

function find_segment(z) {
    // finds the segment in the array related to the z position provided.
    return segments[Math.floor(z/segment_length) % segments.length];
}

var Setup = {

    create_straight_track: function() {
        segments = [];

        ROAD.add_straight(ROAD.LENGTH.LONG*4);
        Setup.start_finish();
    },

    create_bendy_track: function() {
        segments = [];

        ROAD.add_straight(ROAD.LENGTH.SHORT/4);
        ROAD.add_scurves();
        ROAD.add_straight(ROAD.LENGTH.LONG);
        ROAD.add_curve(ROAD.LENGTH.MEDIUM, ROAD.CURVE.MEDIUM);
        ROAD.add_curve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM);
        ROAD.add_straight();
        ROAD.add_scurves();
        ROAD.add_scurves();
        ROAD.add_curve(ROAD.LENGTH.LONG, -ROAD.CURVE.MEDIUM);
        ROAD.add_curve(ROAD.LENGTH.LONG, ROAD.CURVE.MEDIUM);
        ROAD.add_straight();
        ROAD.add_scurves();
        ROAD.add_curve(ROAD.LENGTH.LONG, -ROAD.CURVE.EASY);

        Setup.start_finish();
    },

    start_finish: function() {
        // this method just gets all the track positions etc in same spot.
        segments[find_segment(player_z).index + 2].colour = COLOURS.START;
        segments[find_segment(player_z).index + 3].colour = COLOURS.START;
        for(var i = 0 ; i < curb_segments ; i++) {
            segments[segments.length-1-(i + finish_offset)].colour = COLOURS.FINISH;
        }
        track_length = segments.length * segment_length;
    },

    setup_listeners: function() {
        // sets up the key bindings.

        document.addEventListener("click", click_orientation);

        document.addEventListener("keydown", function(event) {
            switch (event.keyCode) {
                case KEY.LEFT:
                    key_left = true;
                    break;
                case KEY.RIGHT:
                    key_right = true;
                    break;
                case KEY.UP:
                    key_accel = true;
                    break;
                case KEY.DOWN:
                    key_decel = true;
                    break;
            }
        });

        document.addEventListener("keyup", function(event) {
            switch (event.keyCode) {
                case KEY.LEFT:
                    key_left = false;
                    break;
                case KEY.RIGHT:
                    key_right = false;
                    break;
                case KEY.UP:
                    key_accel = false;
                    break;
                case KEY.DOWN:
                    key_decel = false;
                    break;
            }
        });
    },

    init: function() {
        // hooks everything together.

        canvas = document.getElementById("canv");
        ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;

        this.setup_listeners();

        player_z = (camera_height * camera_depth);
        player_z_scale = (camera_depth / player_z);

    },
}


// physics components
var Physics = {

    accelerate: function(speed, accel, time) { 
        return (speed + (accel * time)); 
    },

    limit: function(value, min, max) { return ( Math.max(min, (Math.min(value, max))) ); },

}

// main game bit here.

var Racer = {

    run: function() {
        // the actual bit that runs
        var now = null;
        var last = new Date().getTime();
        dt = 0;
        gdt = 0;

        function frame() {
            // this actually proceeds everythign along.
            now = new Date().getTime();
            dt = Math.min(1, (now - last) / 1000);
            gdt = gdt + dt;
            // this updates at the right frame speed/ 
            while (gdt > step) {
                gdt = gdt - step;
                Racer.update (step);
            }
            Draw.frame();
            last = now;
            requestAnimationFrame(frame, canvas);
        }

        // go speed racer go.
        frame();
    },

    update: function(dt) {
        // this method updates the game world by the amount of time.

        var speed_percent = speed / max_speed;
        var player_segment = find_segment(position + player_z);
        var dx = dt * 2 * (speed/max_speed); // factor left to right speed taking about 1 sec
        
        position = position + (dt * speed);

        // check if we've finished the race.
        if (position > (track_length - (finish_offset * segment_length))) {
            console.log("Finished the race");
            position = track_length - (finish_offset * segment_length);
            key_accel = false;
            speed = 0;
        }
        if (position < 0) {
            position = 0;
        }

        if (key_left) {
            player_x = player_x - dx;
        } else if (key_right) {
            player_x = player_x + dx;
        }

        player_x = player_x - (dx * speed_percent * player_segment.curve * centrifugal);

        if (key_accel) {
            speed = Physics.accelerate(speed, accel, dt);
        } else if (key_decel) {
            speed = Physics.accelerate(speed, braking, dt);
        } else {
            speed = Physics.accelerate(speed, decel, dt);
        }

        if (((player_x < -1) || (player_x > 1)) && (speed > offroad_limit)) {
            console.log("OFFROAD");
            speed = Physics.accelerate(speed, offroad_decel, dt);
        }

        player_x = Physics.limit(player_x, -2, 2);     // dont ever let player go too far out of bounds
        speed   = Physics.limit(speed, 0, max_speed); // or exceed maxSpeed
    },
}

// THIS SECTION DEFINES THE CONTROL HANDLER FOR THE GYRO
var current_orientation = null; // stores the values
var orientation_running = false; // switch orientation on or off to save batt
var sample_rate = 1000 / fps;

var click_orientation = function() {
    // deals with toggling the motion detection on and off.
    if (orientation_running) {
        window.removeEventListener("deviceorientation", update_gyro);
        orientation_running = false;
        $("#orientationtoggle span").text("Start");
        window.clearInterval(tracker_interval);
    } else {
        window.addEventListener("deviceorientation", update_gyro, false);
        orientation_running = true;
        $("#orientationtoggle span").text("Stop");
        tracker_interval = window.setInterval(orientation_tracker, sample_rate);
    }
}

var update_gyro = function(e) {
    // simply updates the orientation value with the event data so there's no lag.
    current_orientation = deviceOrientation(e);
}

var orientation_tracker = function() {
    // gets the current orientation values.
    var debug = false;

    if (debug) {
        $("#beta").text(current_orientation.beta);
        $("#gamma").text(current_orientation.gamma);
    }
    beta = current_orientation.beta;
    gamma = current_orientation.gamma;

    // so we assume that when the device is on its side that gamma is for 
    // acceleration and beta is for steering

    // let's assume a comfortable "neutral" position for gamma is about 45 deg
    // and this is absolute = so + - doesn't matter. > 45 means breeaking, <45
    // means accelerating. And we'll put some break points in there too.
    
    if (Math.abs(gamma) > 60) {
        // pulling back to break
        key_accel = false;
        key_decel = true;
        if (debug) {
            $("#status").text("breaking");
        }
    } else if (Math.abs(gamma) < 40) {
        // pushing forward to accelerate
        key_accel = true;
        key_decel = false;
        if (debug) {
            $("#status").text("accelerating");
        }
    } else {
        // assume neutral
        key_accel = false;
        key_decel = false;
        if (debug) {
            $("#status").text("neutral");
        }
    }

    // now we do the steering. This can invert depending on the gamma. 
    // So if gamma is positive then steering to the right (clockwise) will
    // have a -ive value for beta. If gamma is -ive then this will reverse.

    var gamma_correction = -1; // assumes a +ive gamma
    if (gamma < 0) {
        gamma_correction = 1;
    }

    beta_corrected = beta * gamma_correction;

    //TODO: Possibly change this to variable steering

    if (beta_corrected < -12) {
        // we're steering left
        key_left = true;
        key_right = false;
    } else if (beta_corrected > 12) {
        // we're going right
        key_left = false;
        key_right = true;
    } else {
        // neutral
        key_left = false;
        key_right = false;
    }

}



