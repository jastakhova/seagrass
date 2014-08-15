var staticBackends = ["http://192.168.1.101:8080", "http://10.0.1.53:8080", "http://localhost:8080", "http://thawing-hamlet-4746.herokuapp.com"];
var patternRange = 30;
var batteryThreshold = 7;

var defaultPattern = 0;

var speedMin = 0;
var speedMax = 255;
var speedDefault = 128;

var intensityMin = 0;
var intensityMax = 255;
var intensityDefault = 128;

var modDelayDefault = 0;
var modDelayMin = 0;
var modDelayMax = 15;

var historyDataPeriod = 360;
var historyXTicks = historyDataPeriod / 60;
var historyCPURange = 100;
var historyMemoryRange = 100;
var historyBatteryRange = 15;

var mapMargin = 0.1;

(function() {
    var seagrass = angular.module("seagrass", ['onsen']).
        service("StorageService", function() {
           this.get = function(key) {
               return window.localStorage.getItem(key);
           };

           this.set = function(key, value) {
               window.localStorage.setItem(key, value);
           };
        }).
        service("BackendService", function(StorageService) {
            var home = this;

            this.key = "backend";
            this.getBackends = function() {
                return staticBackends;
            };

            this.getBackend = function() {
                var stored = StorageService.get(home.key);
                return stored ? stored : home.getBackends()[0];
            };
        }).
        service('Util', function() {
            this.formatDate = function(date) {
                return date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
            };
        }).
        service('ErrorService', function($http) {
           var home = this;

           this.errorCallback = function(data, status) {
               home.error = "Request status was " + status + ".";
               if (home.listener)
               {
                   home.listener(home.error);
               }
               errormodal.show();
               setTimeout('errormodal.hide()', 1500);
           };

           this.setListener = function(listener) {
               home.listener = listener;
           };
        }).
        service('HttpService', function($http, ErrorService, BackendService) {
            var callback = function(op) {
               op.success(function() {
                   checkmodal.show();
                   setTimeout('checkmodal.hide()', 700);
               }).error(ErrorService.errorCallback);
            };

            this.post = function(url) {
                callback($http.post(BackendService.getBackend() + url));
            };

            this.put = function(url) {
                callback($http.put(BackendService.getBackend() + url));
            };
        }).
        service('LastUpdateService', function($http, $log, Util, ErrorService) {
            this.time = {};
            this.listeners = {};
            this.refresh = {};

            var home = this;

            home.formatDateById = function(id) {
                return Util.formatDate(new Date(home.time[id]))
            };

            this.getGeneral = function(request, id) {
                var refreshFunction = function() {
                    request();

                    home.time[id] = new Date().getTime();

                    var listener = home.listeners[id];
                    if (listener) {
                        listener(home.formatDateById(id));
                    }
                }

                home.refresh[id] = refreshFunction;
                refreshFunction();
            };

            this.get = function(path, callback, id) {
                var errorCallback = function() {};
                home.getGeneral(function() {$http.get(path).success(callback).error(ErrorService.errorCallback)}, id);
            };

            this.getLastUpdated = function(id) {
                return home.time[id] ? home.formatDateById(id) : "";
            };

            this.addListener = function(id, callback) {
                home.listeners[id] = callback;
            };

            this.refresh = function(id) {
                if (home.refresh[id])
                {
                    home.refresh[id]();
                }
            }
        }).
        service('History', function($http, $q, $log, LastUpdateService, ErrorService, BackendService) {
            this.get = function(metric){
                var deferred = $q.defer();

                $http.get(BackendService.getBackend() + '/metrics/' + metric).success(function(data, status) {
                    deferred.resolve(data.history);
                }).error(function(data, status) {
                    deferred.reject(data);
                    ErrorService.errorCallback(data, status);
                });

                return deferred.promise;
            }
        }).
        service('CachedService', function($http, $log, LastUpdateService, BackendService) {
            this.sensor = "";
            this.sensors = [];
            this.members = [];
            this.patterns = [];

            this.get = function() {
                return this.sensor;
            };

            this.set = function(s) {
                this.sensor = s;
            }

            var home = this;

            this.getSensors = function(callback) {
                if (home.sensors.length === 0)
                {
                    LastUpdateService.get(BackendService.getBackend() + '/metrics/sensors', function(data) {
                        callback(data.collection);
                        home.sensors = data.collection;
                    }, "sensors");
                } else {
                    callback(home.sensors);
                }
            }

            this.getMembers = function(callback) {
                if (home.members.length === 0)
                {
                    LastUpdateService.get(BackendService.getBackend() + '/members', function(data) {
                        callback(data.collection);
                        home.members = data.collection;
                    }, "members");
                } else {
                    callback(home.members);
                }
            }

            this.getPatterns = function(callback) {
                if (home.patterns.length === 0)
                {
                    LastUpdateService.get(BackendService.getBackend() + '/pattern/names', function(data) {
                        callback(data);
                        home.patterns = data;
                    }, "patterns");
                } else {
                    callback(home.patterns);
                }
            }

            this.clear = function() {
                home.members = [];
                home.sensors = [];
                home.patterns = [];
            }

            this.batteryFilter = function (member) {
                return member.battery < batteryThreshold;
            };
        }).
        service("SetBackendService", function(StorageService, BackendService, CachedService, LastUpdateService) {
            this.setBackend = function(value) {
                StorageService.set(BackendService.key, value);
                CachedService.clear();

                LastUpdateService.refresh("cpu");
            };
        }).
        service('GraphService', function($log) {
            var home = this;
            home.graph = [];

            this.drawGraph = function(data, yrange, metric) {
                /* taken from https://gist.github.com/benjchristensen/2579599 */
                /* implementation heavily influenced by http://bl.ocks.org/1166403 */

                // define dimensions of graph
                var m = [20, 20, 20, 35]; // margins
                var w = 300 - m[1] - m[3]; // width
                var h = 180 - m[0] - m[2]; // height

                // X scale will fit all values from data[] within pixels 0-w
                var x = d3.scale.linear().domain([0, data.length]).range([0, w]);
                // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
                var y = d3.scale.linear().domain([0, yrange]).range([h, 0]);
                // automatically determining max range can work something like this
                // var y = d3.scale.linear().domain([0, d3.max(data)]).range([h, 0]);

                // create a line function that can convert data[] into x and y points
                var line = d3.svg.line()
                    // assign the X function to plot our line as we wish
                    .x(function(d,i) {
                        // return the X coordinate where we want to plot this datapoint
                        return x(i);
                    })
                    .y(function(d) {
                        // return the Y coordinate where we want to plot this datapoint
                        return y(d);
                    });

                if (d3.select("#" + metric + "svg").empty()) {
                    // Add an SVG element with the desired dimensions and margin.
                    var graph = d3.select("#" + metric + "Graph").append("svg:svg")
                        .attr("width", w + m[1] + m[3])
                        .attr("height", h + m[0] + m[2])
                        .attr("id", metric + "svg")
                        .append("svg:g")
                        .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

                    var xTicks = [];
                    for (var i = 0; i <= 360; i+=60) {
                        xTicks.push(i);
                    }

                    // create xAxis
                    var xAxis = d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(function(i) {return Math.floor(i / 60) + "h";});
                    // Add the x-axis.
                    graph.append("svg:g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + h + ")")
                        .call(xAxis);


                    // create left yAxis
                    var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
                    // Add the y-axis to the left
                    graph.append("svg:g")
                        .attr("class", "y axis")
                        .attr("transform", "translate(-5,0)")
                        .call(yAxisLeft);

                    // Add the line by appending an svg:path element with the data line we created above
                    // do this AFTER the axes above so that the line is above the tick-lines
                    home.graph[metric] = graph.append("svg:path");
                    home.graph[metric].attr("d", line(data));
                } else {
                    home.graph[metric].attr("d", line(data));
                }
            };
        }).service("NavigationService", function($log) {
          var home = this;

          this.message = "def";

//          navigator.geolocation.getCurrentPosition(function(position) {
//            home.message = "ok";
//            $log.info(position);
//          }, function(error) {
//            home.message = "not ok";
//            $log.info(error)});

        }).service('MapService', function($log, NavigationService) {
            var home = this;

            this.drawMap = function(members) {
                // data that you want to plot, I've used separate arrays for x and y values
                var xdata = members.map(function(member) {return member.lon;}),
                    ydata = members.map(function(member) {return member.lat;});

                // TODO: should be set by navigation service
                var lon = -119.5;
                var lat = 39.5;

                var names = members.map(function(member) {return member.name;});
                var batteryLevels = members.map(function(member) {return member.battery;});
                var gradient = [6.2, 6.8, 7.0, 7.05, 7.1, 7.15, 7.4, 7.6, 7.8, 8.0];

                var chooseColorClass = function(battery) {
                    for (var i = 0; i < gradient.length; i++) {
                        if (battery < gradient[i])
                        {
                            return "color" + (i + 1);
                        }
                    }
                    return "color" + (gradient.length + 1);
                };

                // size and margins for the chart
                var margin = {top: 20, right: 20, bottom: 20, left: 20}
                    , width = 300 - margin.left - margin.right
                    , height = 300 - margin.top - margin.bottom;

                // x and y scales, I've used linear here but there are other options
                // the scales translate data values to pixel values for you
                var xMin = d3.min(xdata);
                var xMax = d3.max(xdata);
                var xMargin = mapMargin * (xMax - xMin);
                var x = d3.scale.linear()
                    .domain([xMin - xMargin, xMax + xMargin])  // the range of the values to plot
                    .range([ 0, width ]);        // the pixel range of the x-axis

                var yMin = d3.min(ydata);
                var yMax = d3.max(ydata);
                var yMargin = mapMargin * (yMax - yMin);
                var y = d3.scale.linear()
                    .domain([yMin - yMargin, yMax + yMargin])
                    .range([ height, 0 ]);

                // the chart object, includes all margins
                var chart = d3.select('#map')
                    .append('svg:svg')
                    .attr('width', width + margin.right + margin.left)
                    .attr('height', height + margin.top + margin.bottom)
                    .attr('class', 'chart')

                // the main object where the chart and axis will be drawn
                var main = chart.append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('class', 'main')

                // draw the graph object
                var g = main.append("svg:g");

                var map = g.selectAll("scatter-dots")
                    .data(ydata)  // using the values in the ydata array
                    .enter();
                map.append("svg:circle")  // create a new circle for each value
                    .attr("cy", function (d) { return y(d); } ) // translate y value to a pixel
                    .attr("cx", function (d,i) { return x(xdata[i]); } ) // translate x value
                    .attr("r", 10) // radius of circle
                    .attr("class", function(d, i) {return chooseColorClass(batteryLevels[i]);})
                    .style("opacity", 0.6); // opacity of circle
                map.append("text")
                    .attr("x", function(d, i) { return x(xdata[i]); })
                    .attr("y", function(d) { return y(d) + 4; })
                    .attr("text-anchor", "middle")
                    .text(function(d, i) {return names[i];})
                    .attr("class", "dot-id");

//                home.cursor = g.append("svg:circle");
//
//                home.cursor.attr("cx", x(lon))
//                    .attr("cy", y(lat))
//                    .attr("r", 5)
//                    .attr("class", "myself");
            };
        });

    seagrass.controller("MetricsController", [function () {
        this.activeTab = 1;

        this.chooseTab = function(tab) {
          this.activeTab = tab;
        };

        this.isSelected = function(tab) {
            return this.activeTab === tab;
        };
    }]);

    seagrass.controller("MembersController", ['$scope', '$http', '$log', 'CachedService', 'LastUpdateService', function ($scope, $http, $log, CachedService, LastUpdateService) {
        $scope.batteryFilter = CachedService.batteryFilter;

        $scope.members = [];

        CachedService.getMembers(function(members) {

            CachedService.getPatterns(function(patterns) {
                $scope.members = members.map(function(member) {
                    member.pattern = patterns[member.pattern];
                    return member;
                });
            });
        });

        var id = "members";

        LastUpdateService.addListener(id, function(time) {
            $scope.lastUpdated = time;
        });

        $scope.lastUpdated = LastUpdateService.getLastUpdated(id);

        $scope.refresh = function() {
           LastUpdateService.refresh(id);
        };
    }]);

    seagrass.controller("SensorsController", ['$scope', '$http', '$log', 'CachedService', 'LastUpdateService', function ($scope, $http, $log, CachedService, LastUpdateService) {
        $scope.sensors = [];

        var id = "sensors";

        LastUpdateService.addListener(id, function(time) {
            $scope.lastUpdated = time;
        });

        $scope.lastUpdated = LastUpdateService.getLastUpdated(id);

        $scope.refresh = function() {
            LastUpdateService.refresh(id);
        };

        CachedService.getSensors(function(data) {
            $scope.sensors = data;
        });
    }]);

    seagrass.controller("ComputerController", ['$scope', '$http', '$log', '$q', 'History', 'Util', 'LastUpdateService', "GraphService", function ($scope, $http, $log, $q, History, Util, LastUpdateService, GraphService) {
        $scope.entries = [];

        var minute = 60*1000;

        load = function() {
            $q.all([
                    History.get('cpu'),
                    History.get('battery'),
                    History.get('memory')
                ]).then(function(data) {
                    var time = new Date().getTime();
                    $scope.entries = [];

                    for (var i = 0; i < data[0].length; i++)
                    {
                        var date = new Date(time);
                        var tick = date.getMinutes() % 10 === 0;
                        time = time - minute;
                        var tick = tick ? Util.formatDate(date) : "";
                        var entry = {cpu : data[0][i], battery : data[1][i], memory: data[2][i], time : tick};
                        $scope.entries.push(entry);
                    }

                    // generation of random data so that the history graph would have all 6h set
//                    if (data[0].length < historyDataPeriod)
//                    {
//                        var initialLength = data[0].length;
//                        for (var i = 0; i < historyDataPeriod - initialLength; i++)
//                        {
//                            data[0].push(Math.floor((Math.random() * 100) + 1));
//                        }
//                    }

                    GraphService.drawGraph(data[0], historyCPURange, "cpu");
                    GraphService.drawGraph(data[1], historyMemoryRange, "memory");
                    GraphService.drawGraph(data[2], historyBatteryRange, "battery");
                });
        };

        var id = "cpu";

        LastUpdateService.addListener(id, function(time) {
            $scope.lastUpdated = time;
        });

        $scope.lastUpdated = LastUpdateService.getLastUpdated(id);

        $scope.refresh = function() {
            LastUpdateService.refresh(id);
        };

        LastUpdateService.getGeneral(load, id);
    }]);

    seagrass.controller("ControlController",
        ['$scope', '$http', '$log', 'CachedService', 'HttpService', 'BackendService', 'SetBackendService',
            function ($scope, $http, $log, CachedService, HttpService, BackendService, SetBackendService) {
        $scope.backends = BackendService.getBackends();
        $scope.chosen_backend = BackendService.getBackend();

        $scope.setBackend = function() {
            SetBackendService.setBackend($scope.chosen_backend);
        };

        $scope.restart = function() {
            HttpService.put('/restart');
        };

        $scope.reboot = function() {
            HttpService.put('/reboot');
        };

        $scope.shutdown = function() {
            HttpService.put('/shutdown');
        };

        $scope.chosen_sensor = CachedService.get();

        $scope.sensors = [];

        CachedService.getSensors(function(data) {
            $scope.sensors = data.map(function(sensor) {
                return sensor.name;
            });
        });

        $scope.chooseSensor = function(navigator, page) {
            if ($scope.chosen_sensor != "")
            {
                CachedService.set($scope.chosen_sensor);
                navigator.pushPage(page, { animation : 'slide' } );
            }
        };
    }]);

    seagrass.controller("PatternController", ['$scope', '$http', '$log', 'HttpService', function ($scope, $http, $log, HttpService) {
        $scope.patterns = Array.apply(null, Array(patternRange)).map(function (_, i) {return i;});

        $scope.chosen_pattern = defaultPattern;

        $scope.speed = speedDefault;
        $scope.speedMin = speedMin;
        $scope.speedMax = speedMax;

        $scope.intensity = intensityDefault;
        $scope.intensityMin = intensityMin;
        $scope.intensityMax = intensityMax;

        $scope.modDelay = modDelayDefault;
        $scope.modDelayMin = modDelayMin;
        $scope.modDelayMax = modDelayMax;

        $scope.red = 0;
        $scope.green = 0;
        $scope.blue = 0;

        $scope.submit = function() {
            HttpService.put('/pattern/' + $scope.chosen_pattern + '?intensity=' + $scope.intensity +
                '&red=' + $scope.red + '&green=' + $scope.green + '&blue=' + $scope.blue +
                '&speed=' + $scope.speed + '&modDelay=' + $scope.modDelay);
        };
    }]);

    seagrass.controller("ChosenSensorController", ['$scope', '$http', '$log', 'CachedService', 'HttpService', function ($scope, $http, $log, CachedService, HttpService) {
        $scope.chosen_sensor = CachedService.get();

        $scope.filterLength = 0;
        $scope.threshold = 0;
        $scope.throttle = 100;

        $scope.submit = function() {
            HttpService.put('/sensor/' + $scope.chosen_sensor + '?threshold=' + $scope.threshold);
            HttpService.put('/sensor/' + $scope.chosen_sensor + '?filterLength=' + $scope.filterLength);
            HttpService.put('/sensor/' + $scope.chosen_sensor + '?throttle=' + $scope.throttle);
        };

        CachedService.getSensors(function(data) {
           data.map(function(sensor) {
              if (sensor.name === $scope.chosen_sensor)
              {
                  $scope.threshold = sensor.threshold;
                  $scope.filterLength = sensor.filterLength;
                  $scope.throttle = sensor.throttle;
              }

              return sensor;
           })
        });
    }]);

    seagrass.controller("MapController", ['$scope', 'MapService', 'CachedService', function ($scope, MapService, CachedService) {
        CachedService.getMembers(function(data) {
            MapService.drawMap(data);
        });
    }]);

    seagrass.controller("ErrorController", ['$scope', '$log', 'ErrorService', function($scope, $log, ErrorService) {
        $scope.error = "";

        ErrorService.setListener(function(message) {
           $scope.error = message;
        });
    }]);
}());

