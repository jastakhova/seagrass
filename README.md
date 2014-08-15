This is an iPhone control app for Burning Man project https://www.facebook.com/seagrassProject . It mixes in PhoneGap (cordova), AngularJS and Onsen UI.

## Run instructions

	> git clone git@github.com:jastakhova/seagrass.git
	> cd seagrass
	> cordova platform add ios
	> cordova plugin add org.apache.cordova.geolocation

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

 * GPS for showing current location (http://docs.phonegap.com/en/2.0.0/cordova_geolocation_geolocation.md.html)
 * extra circle for selected member on the map
 * structure the project
 * Change range for battery to 10-15 (right now 0-15) ?
 * Use pattern names from GET /pattern/names when it's ready, sort patterns in alphabetical order
 * Make data tables nicer (like in twitter bootstrap)
 * Configurable ordering in data tables (!)
 * set parameters for current pattern (GET /pattern/current)
 * History graphs can be smaller at startup
 * set image for the app
 * history should not be refreshed on backend url change but marked as needed to be refreshed

 ## Problems

 * Sensor PUT/POST still returns 405, as only OPTIONS is allowed
 * for sensor-1 only 1 range is showing
 * Control requests (PUT, POST) doesn't work in browser (because of not configured CORS headers at backend), but seem to work in the emulator

 ## Auxiliary. Gradient map

  if (currentVoltage < 6.2) {

         ofSetColor(165, 0, 38);

     } else if (currentVoltage < 6.8) {

         ofSetColor(215,48,39);

     } else if (currentVoltage < 7.0) {

         ofSetColor(244,109,67);

     } else if (currentVoltage < 7.05) {

         ofSetColor(253,174,97);

     } else if (currentVoltage < 7.1) {

         ofSetColor(254,224,139);

     } else if (currentVoltage < 7.15) {

         ofSetColor(255,255,191);

     } else if (currentVoltage < 7.4) {

         ofSetColor(217,239,139);

     } else if (currentVoltage < 7.6) {

         ofSetColor(166,217,106);

     } else if (currentVoltage < 7.8) {

         ofSetColor(102,189,99);

     } else if (currentVoltage < 8.0) {

         ofSetColor(26,152,80);

     } else {

         ofSetColor(0,104,55);

     }

## Auxiliary. App image

![Image for app](https://github.com/jastakhova/seagrass/blob/master/img/seagrass.png "Image for app")