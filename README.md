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

## TODO

Base functionality:

 * Error callback for all http requests
 * Scrolling at pattern page and probably others
 * Refresh for sensor list in sensor control page

Additional functionality:

 * Graphs for history (d3?)
 * Map for geolocations of members (would be easier to generate at backend IMHO)
 * Make data tables nicer (like in twitter bootstrap)
 * Center range inputs in pattern page
 * Configurable ordering in data tables
 * Colored battery levels
 * probably smth else - I left my TODO paper somewhere
 * Last refreshed time for metrics pages
 * Refresh could show progress
