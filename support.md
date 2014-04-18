# Device API support research

This outlines various findings around support for different parts of the 
Device API as of April 2014.

# Vibrate

Current status: Last Call Draft 
Spec: http://www.w3.org/TR/2014/WD-vibration-20140211/
Supported: Chrome for Android 4.0+, Firefox for Android
Unsupported: OSX Safari, iOS Safari. 
Non-detectable unsupported: Chrome desktop
Demo: /examples/vibrate

Notes: Biggest issue is purported support on Chrome for Desktop devices (ie
the navigator.vibrate object exists) making detection hard. As there is no
secondary event that is fired once a vibration occurs it would be difficult to
tell whether there was true support or not. 

Also seems that latest push to chrome has removed support for vibrate from the
device which is annoying. Noted to the Chrome team.

# Proximity API

Current status: Candidate Recommendation (October 2013)
Spec: http://www.w3.org/TR/proximity/
Demo: /examples/proximity
Supported: Firefox for Android 4.0+
Unsupported: all others

Notes: Heavily dependent on the proximity sensor in the device. Nexus 7 can only
maximally go 5cm for example.

Currently has issues with a live, partial value, it is all or nothing at the moment.

# Battery Status API

Current Status: Candidate Recommendation (May 2012)
Spec: http://www.w3.org/TR/battery-status/
Demo: /examples/battery
Supported: Firefox all
Unsupported:Chrome all, Safari all

Notes: Charging, discharging part of the spec is heavily dependent on the device.
It was not available in FF until a recent update around 18 April for Android.

Also note that on OSX FF, report is "unknown" until first tick on change.

# Device Light API

Current status: Candidate Recommendation (October 2013)
Spec: http://www.w3.org/TR/ambient-light/
Supported: Firefox for Android 4.0+
Demo: /examples/ambient
Unsupported: all others

Notes: Very dependent on the sensor available. Phones appear to have better sensors
with higher ranges than laptops however they tend to be highly directional. As a result 
they tend to under report ambient light levels compared to a laptop which tends
to be a bit more normal.

Highest value seen is 10K with a Nexus 4 in direct sunlight.

LightLevel API not currently supported, with direct values only. Currently under
review by the spec team.
