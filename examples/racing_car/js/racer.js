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
var max_speed = segment_length/step; // TODO
var accel = max_speed / 5;
var decel = -max_speed /10;
var braking = -max_speed*0.8;
var offroad_decel = -max_speed / 2;
var offroad_limit = 0.3*max_speed;

var key_left = false;
var key_right = false;
var key_accel = false;
var key_decel = false;

function project (p, camerax, cameray, cameraz, camera_depth, width, height, road_width) {
    // takes a point and projects it on to the screen
    p.camera.x     = (p.world.x || 0) - camerax;
    p.camera.y     = (p.world.y || 0) - cameray;
    p.camera.z     = (p.world.z || 0) - cameraz;
    p.screen.scale = camera_depth/p.camera.z;
    p.screen.x     = Math.round((width/2)  + (p.screen.scale * p.camera.x  * width/2));
    p.screen.y     = Math.round((height/2) - (p.screen.scale * p.camera.y  * height/2));
    p.screen.w     = Math.round(             (p.screen.scale * road_width   * width/2));
}

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
    }

}

function find_segment(z) {
    // finds the segment in the array related to the z position provided.
    return segments[Math.floor(z/segment_length) % segments.length];
}

function setup_road () {
    segments = [];
    for (var i=0; i< MAX_SEGMENTS; i++) {
        segments.push({
            index: i,
            p1: { world: { z: i * segment_length}, camera:{}, screen: {} },
            p2: { world: { z: (i+1)*segment_length}, camera:{}, screen:{} },
            colour: Math.floor(i/curb_segments) % 2 ? COLOURS.DARK : COLOURS.LIGHT
        });
    }

    segments[7].colour = COLOURS.START;
    segments[8].colour = COLOURS.START;

    for(var i = 0 ; i < curb_segments; i++) {
        segments[segments.length-1-(i+finish_offset)].colour = COLOURS.FINISH;
    }

    track_length = segments.length * segment_length;
}

function setup_listeners() {
    // sets up the key bindings.
    
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

}

function setup() {
    
    canvas = document.getElementById("canv");
    ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    setup_listeners();

    player_z = (camera_height * camera_depth);
    player_z_scale = (camera_depth / player_z);

}

function draw_frame() {
    // renders the game out to the canvas.
    
    var player_segment = find_segment(position); // grabs the player pos, gets the segment from that.
    var max_y = height;

    ctx.clearRect(0, 0, width, height);

    Draw.background();

    var i, segment;
    for (i=0; i<draw_distance; i++) {
        segment = segments[(player_segment.index + i) % segments.length];

        project(segment.p1, (player_x * road_width), camera_height, position, camera_depth, width, height, road_width);
        project(segment.p2, (player_x * road_width), camera_height, position, camera_depth, width, height, road_width);

        if ((segment.p1.camera.z <= camera_depth) || (segment.p2.screen.y >= max_y)) 
            continue;
        Draw.segment(ctx, segment);

        max_y = segment.p2.screen.y;

    }

    Draw.player();

    $("#speed").text("Speed: " + speed);
    $("#maxspeed").text("Max: " + max_speed);
    $("#offlimit").text("Off: " + offroad_limit);
}

function update(dt) {

    position = position + (dt * speed);
    if (position > (track_length - (finish_offset * segment_length))) {
        console.log("Finished the race");
        position = track_length - (finish_offset * segment_length);
        key_accel = false;
        speed = 0;
    }
    if (position < 0) {
        position = 0;
    }

    var dx = dt * 2 * (speed/max_speed); // factor left to right speed taking about 1 sec

    if (key_left)
        player_x = player_x - dx;
    else if (key_right)
        player_x = player_x + dx;

    if (key_accel)
        speed = Physics.accelerate(speed, accel, dt);
    else if (key_decel)
        speed = Physics.accelerate(speed, braking, dt);
    else
        speed = Physics.accelerate(speed, decel, dt);

    if (((player_x < -1) || (player_x > 1)) && (speed > offroad_limit)) {
        console.log("OFFROAD");
        speed = Physics.accelerate(speed, offroad_decel, dt);
    }

    player_x = Physics.limit(player_x, -2, 2);     // dont ever let player go too far out of bounds
    speed   = Physics.limit(speed, 0, max_speed); // or exceed maxSpeed

}

// physics components
var Physics = {

    accelerate: function(speed, accel, time) { 
        //console.log("Accelerating");
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
                update (step);
            }
            draw_frame();
            last = now;
            requestAnimationFrame(frame, canvas);
        }

        // go speed racer go.
        frame();

    },

}
