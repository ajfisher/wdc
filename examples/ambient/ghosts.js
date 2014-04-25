/** Code for manipulating the images that go into the space around your head. **/
var base_path = "i";

var dim = {
    path: "/dim/",
    files: ["06-star03.svg","02-moon02.svg",  "09-sparkle2.svg", "13-zeppelin.svg"],
    images: [],
};
var bright = {
    path: "/bright/",
    files: ["04-cloud2.svg", "06-sun.svg", "02-bird.svg", "05-baloon.svg"],
    images: [],

};

var dark = {
    path: "/dark/",
    files: [  "04-cloudandmoon.svg", "05-spider.svg","03-grave.svg","07-ghost.svg"],
    images: [],
};

var current_state = bright;

function init_overlays() {

    [dark, bright, dim].forEach(function(lightitem) {
        // load up all of the files and see how we go.
        for (var i = 0; i<lightitem.files.length; i++) {
            var img = new Image();
            img.src = base_path + lightitem.path + lightitem.files[i];
            img.onload = function(i) {

                // now we have the file, normalise it to be about 30px across.
                var max_width = 80;
                var scale_factor = i.width / max_width;
                i.width = max_width;
                i.height = img.height / scale_factor;
            }(img);
            console.log("Loaded img " + img.src);
            lightitem.images.push(img);
        }
    });
}

function image_overlay(evt) {
// produces an image overlay for the frame
//
    var head = {
        l: -(evt.width/2),
        r: -(evt.width/2)+evt.width,
        t: -(evt.height/2),
        b: -(evt.height/2)+evt.height,
        w: evt.width,
        h: evt.height,
        bounds: {
            l: -(evt.width),
            r: -(evt.width)+evt.width*2,
            t: -(evt.height*0.7),
            b: -(evt.height*0.7)+evt.height*1.4,
            w: evt.width*2,
            h: evt.height*1.4
        }
    }
    octx.clearRect(0,0,640,480);
    octx.save();
    // translate the context to the specific point where you want to draw the boxes.
    octx.translate(evt.x, evt.y);
    //octx.rotate(evt.angle-(Math.PI/2));
    //draw_face_boxes(head);


    var i = 0;
    // top left
    octx.drawImage(current_state.images[i],
            head.bounds.r,
            head.bounds.t-(0.4*current_state.images[i].height), 
            current_state.images[i].width, 
            current_state.images[i].height);

    // top right
    i = 1;
    octx.drawImage(current_state.images[i],
            head.bounds.l-current_state.images[i].width-(0.5*current_state.images[i].height),
            head.bounds.t-(0.8*current_state.images[i].height), 
            current_state.images[i].width, 
            current_state.images[i].height);

    // bottom right
    i = 2;
    octx.drawImage(current_state.images[i],
            head.bounds.l-current_state.images[i].width,
            (0.6*head.bounds.b)-current_state.images[i].height, 
            current_state.images[i].width, 
            current_state.images[i].height);
    // bottom left
    i = 3;
    octx.drawImage(current_state.images[i],
            head.bounds.r+(0.5*current_state.images[i].height),
            (0.5*head.bounds.b)-current_state.images[i].height, 
            current_state.images[i].width, 
            current_state.images[i].height);
    // restore the context
    octx.restore();
}

function draw_face_boxes(head) {
    // draws the boxes around the face etc
    // face box
    octx.strokeStyle = "rgba(240,210,50, 0.6)";
    octx.lineWidth = 2;
    octx.strokeRect(head.l, head.t, head.w, head.h);
    // head box
    octx.strokeStyle = "rgba(240,210,50, 0.2)";
    octx.lineWidth = 1;
    octx.strokeRect(head.bounds.l, head.bounds.t, head.bounds.w, head.bounds.h);
}
