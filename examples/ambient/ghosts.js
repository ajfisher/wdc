/** Code for manipulating the images that go into the space around your head. **/

var source = new Image();

var base_path = "i";

var dim = {
    path: "/dim/",
    files: ["01-moon01.svg", "04-star01.svg", "11-cloud1.svg"],
    images: [],
};
var bright = {
    path: "/bright/",
    files: ["01-butterfly.svg", "02-bird.svg", "06-sun.svg"],
    images: [],

};
var dark = {
    path: "/dark/",
    files: ["01-bat.svg", "02-skull.svg", "07-ghost.svg"],
    images: [],
};



function init_overlays() {

    source.src = 'i/bright/01-butterfly.svg';

    [dark, bright, dim].forEach(function(lightitem) {
        // load up all of the files and see how we go.
        for (var i = 0; i<lightitem.files.length; i++) {
            var img = new Image();
            img.src = base_path + lightitem.path + lightitem.files[i];
            img.onload = function(i) {

                // now we have the file, normalise it to be about 30px across.
                var max_width = 30;
                var scale_factor = i.width / max_width;
                i.width = max_width;
                i.height = img.height / scale_factor;
            }(img);
            console.log("Loaded img " + img.src);
            lightitem.images.push(img);
        }
    });


}
