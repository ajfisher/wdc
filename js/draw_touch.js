// set up a remove option so we can pull items out of an array nice and quick
Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
}

// set up the canvas
var canv = document.getElementById("canv");
canv.width = window.innerWidth - 10;
canv.height = window.innerHeight - $("header").height() - 10;
var context = canv.getContext("2d");
var canv_offset_x = $("#canv").position().left;
var canv_offset_y = $("#canv").position().top;

function draw_touch (touch, offset_x, offset_y, outline, fill) {
  // draw an actual touch
    
    var x=0, y=0, r=35;
    
    if (touch) {
      x = touch.pageX;
      y = touch.pageY;
    } else {
      return;
    }
    
    // just need to get relative position of the canvas we're about to draw on and
    // normalise the touch point.
    //x -= offset_x;
    y -= offset_y;
    
    context.save();
    context.translate(x,y)
    context.fillStyle = "#333333";
    context.font = "normal 13px sans-serif";
    context.textAlign = "left";
		context.textBaseline = "top"
    var x_str = "cx: " + touch.clientX + " px: " + touch.pageX + " sx: " + touch.screenX;
    var y_str = "cy: " + touch.clientY + " py: " + touch.pageY + " sy: " + touch.screenY;
    var id_str = "id: " + touch.identifier + " target: " + touch.target.nodeName;
    context.fillText(x_str, 3, -(2*r));
    context.fillText(y_str, ((2*r*0.9)), -20);
    context.fillText(id_str, ((2*r*0.9)), 2);
    context.beginPath();
    context.arc(0,0,r,0,Math.PI*2,true);
    context.closePath();
    context.strokeStyle = outline;
    context.stroke();
    context.fillStyle = fill;
    context.fill();
    
    context.strokeStyle = "#666";
    context.beginPath();
    context.moveTo(-5,0);
    context.lineTo((2*r), 0);
    context.stroke();
    context.beginPath();
    context.moveTo(0,5);
    context.lineTo(0, -(2*r));
    context.stroke();
    
    context.restore();
  
}

  function draw_touches () {
    context.clearRect(0, 0, canv.width, canv.height);
    draw_touch(start_point, canv_offset_x, canv_offset_y, "rgba(255,0,0,1)", "rgba(255,0,0,0.4)");
    draw_touch(current_point, canv_offset_x, canv_offset_y, "rgba(0,255,0,1)", "rgba(0,255,0,0.4)");
    draw_touch(end_point, canv_offset_x, canv_offset_y, "rgba(0,0,255,1)", "rgba(0,0,255,0.4)");
  }

  function draw_multi_touches() {
    context.clearRect(0, 0, canv.width, canv.height);
    for (var i=0; i<current_point.length; i++) {
        draw_touch(current_point[i], canv_offset_x, canv_offset_y, "rgba(0,255,0,1)", "rgba(0,255,0,0.4)");
    }
    for (var i=0; i<start_point.length; i++) {
        draw_touch(start_point[i], canv_offset_x, canv_offset_y, "rgba(255,0,0,1)", "rgba(255,0,0,0.4)");
    }
    
    for (var i=0; i<end_point.length; i++) {
        draw_touch(end_point[i], canv_offset_x, canv_offset_y, "rgba(0,0,255,1)", "rgba(0,0,255,0.4)");
    } 
  }
  
