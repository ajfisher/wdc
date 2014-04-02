# Device API support research

This outlines various findings around support for different parts of the 
Device API as of April 2014.

# Vibrate

Current status: Last Call Draft 
Spec: http://www.w3.org/TR/2014/WD-vibration-20140211/
Supported: Chrome for Android 4.0+, Firefox for Android
Demo: /examples/vibrate
Unsupported: OSX Safari, iOS Safari. 
Non-detectable unsupported: Chrome desktop

Notes: Biggest issue is purported support on Chrome for Desktop devices (ie
the navigator.vibrate object exists) making detection hard. As there is no
secondary event that is fired once a vibration occurs it would be difficult to
tell whether there was true support or not. 

Detection options: Look for something like android in UA to determine if supported, 
alternatively do a test after trigging a vibration event for something like
device motion to detect the jitter.

# Proximity API

Current status: Candidate Recommendation (October 2013)
Spec: http://www.w3.org/TR/proximity/
Supported: Firefox for Android 4.0+
Demo: /examples/proximity
Unsupported: all others

Notes: Heavily dependent on the proximity sensor in the device. Nexus 7 can only
maximally go 5cm for example.

Currently has issues with a live value, it is all or nothing at the moment.
