This is an iPhone control app for Burning Man project https://www.facebook.com/seagrassProject . It mixes in PhoneGap (cordova), AngularJS and Onsen UI.

## Run instructions

	> git clone git@github.com:jastakhova/seagrass.git
	> cd seagrass
	> cordova platform add ios

It creates this structure:

	> ls platforms/ios
	CordovaLib              Seagrass.xcodeproj      platform_www
	Seagrass                cordova                 www

At this point you can use Seagrass.xcodeproj . Open this project from Xcode. Clean, build, run it.

To run from CL:

	> cordova build
	> cordova emulate ios

## Emulator first page view

![You will get this first screen when running this app](https://github.com/jastakhova/seagrass/blob/master/img/2014-08-05_0758.png "First screen")

## Emulator history graphs view

![Emulator history graphs view](https://github.com/jastakhova/seagrass/blob/master/img/2014-08-07_2349.png "History graphs screen")


## TODO

 * Map for geolocations of members (d3)
 * Use pattern names from GET /pattern/names when it's ready
 * Make data tables nicer (like in twitter bootstrap)
 * Center range inputs in pattern page
 * Configurable ordering in data tables
 * Colored battery levels
 * probably smth else - I left my TODO paper somewhere
 * Refresh could show progress

 ## Problems

 * Control requests (PUT, POST) doesn't work in browser (because of not configured CORS headers at backend), but seem to work in the emulator
 * Sensor PUT/POST still returns 405, as only OPTIONS is allowed
 * url and some properties are still hardcoded
 * history graphs use generated data for missed time (right now I have 4 real points from 360 expected). Mock data generation should be removed
