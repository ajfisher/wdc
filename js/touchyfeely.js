  // TouchyFeely Andrew fisher
  
  var touchyfeely = {
    touch: 0,
    gesture: 0,
    multitouch: 0,
  }

  try {
    document.createEvent("TouchEvent");
    touchyfeely.touch = 1;
  } catch(e){
    touchyfeely.touch = 0;
  }

  try {
    document.createEvent("GestureEvent");
    touchyfeely.gesture = 1;
  } catch (e) {
    touchyfeely.gesture = 0;
  }

  if (touchyfeely.gesture) {
    // we're an ios device with gesture so implied multitouch
    touchyfeely.multitouch = 1;
  }else {
    // try some tests
    try {
      // try and create some touch objects. In modern browsers this will work and we can
      // interact with both touch points independently. We add them to the touch list to 
      // see if they work properly though
      var t = document.createTouch(window, document, 1234, 0,0, 0,0, 0,0);
      var t2 = document.createTouch(window, document, 5678, 0,0, 0,0, 0,0);
      var tl = document.createTouchList(t, t2);
      if (tl.length == 2) {
        // if they add to the touch list correctly then we're on a modern version of android and
        // it's all good. 
        touchyfeely.multitouch = 1;
      } else {
        // otherwise we're old and single touch is it.
        touchyfeely.multitouch = 0;
      }
    } catch (e) {
      touchyfeely.multitouch = 0;
    }
  }  

