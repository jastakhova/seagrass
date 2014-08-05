var backend = "http://thawing-hamlet-4746.herokuapp.com";
var patternRange = 30;
var batteryThreshold = 7;

var defaultPattern = 0;

var speedMin = 1;
var speedMax = 10;
var speedDefault = 5;

var intensityMin = 1;
var intensityMax = 5;
var intensityDefault = 2;

(function() {
    var seagrass = angular.module("seagrass", ['onsen']).
        service('Util', function() {
            this.formatDate = function(date) {
                return date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
            };
        }).
        service('LastUpdateService', function($http, $log, Util) {
            this.time = {};
            this.listeners = {};
            this.refresh = {};

            var home = this;

            home.formatDateById = function(id) {
                return Util.formatDate(new Date(home.time[id]))
            };

            this.get = function(path, callback, id) {
                var refreshFunction =  function() {
                    $http.get(path).success(callback);

                    home.time[id] = new Date().getTime();

                    var listener = home.listeners[id];
                    if (listener) {
                        listener(home.formatDateById(id));
                    }
                }

                home.refresh[id] = refreshFunction;
                refreshFunction();
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
        service('History', function($http, $q, $log, LastUpdateService) {
            this.get = function(metric){
                var deferred = $q.defer();

                var onError = function(data, status) {
                    deferred.reject(data);
                };

                LastUpdateService.get(backend + '/metrics/' + metric, function(data, status) {
                    deferred.resolve(data.history);
                }, metric);

                return deferred.promise;
            }
        }).
        service('CachedService', function($http, $log, LastUpdateService) {
            this.sensor = "";
            this.sensors = [];
            this.members = [];

            this.get = function() {
                return this.sensor;
            };

            this.set = function(s) {
                this.sensor = s;
            }

            this.getSensors = function(callback) {
                if (this.sensors.length == 0)
                {
                    LastUpdateService.get(backend + '/metrics/sensors', function(data) {
                        callback(data.collection);
                        this.sensors = data.collection;
                    }, "sensors");
                } else {
                    callback(data.collection);
                }
            }

            this.getMembers = function(callback) {
                if (this.members.length == 0)
                {
                    LastUpdateService.get(backend + '/members', function(data) {
                        callback(data.collection);
                        this.members = data.collection;
                    }, "members");
                } else {
                    callback(data.collection);
                }
            }

            this.batteryFilter = function (member) {
                return member.battery < batteryThreshold;
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

        var id = "members";

        LastUpdateService.addListener(id, function(time) {
            $scope.lastUpdated = time;
        });

        $scope.lastUpdated = LastUpdateService.getLastUpdated(id);

        CachedService.getMembers(function(data) {
            $scope.members = data;
        });

        $scope.refresh = function() {
           LastUpdateService.refresh(id);
        };
    }]);

    seagrass.controller("SensorsController", ['$http', '$log', 'CachedService', function ($http, $log, CachedService) {
        var home = this;

        home.sensors = [];

        CachedService.getSensors(function(data) {
            home.sensors = data;
        });
    }]);

    seagrass.controller("ComputerController", ['$http', '$log', '$q', 'History', 'Util', function ($http, $log, $q, History, Util) {
        var home = this;

        home.entries = [];

        var time = new Date().getTime();
        var minute = 60*1000;

        $q.all([
            History.get('cpu'),
            History.get('battery'),
            History.get('memory')
        ]).then(function(data) {
            for(var i = 0; i < data[0].length; i++)
            {
                var date = new Date(time);
                var tick = date.getMinutes() % 10 === 0;
                time = time - minute;
                var tick = tick ? Util.formatDate(date) : "";
                home.entries.push({cpu : data[0][i], battery : data[1][i], memory: data[2][i], time : tick});
            }
        });
    }]);

    seagrass.controller("ControlController", ['$scope', '$http', '$log', 'CachedService', function ($scope, $http, $log, CachedService) {
        $scope.startup = function() {
          $http.post(backend + '/startup');
        };

        $scope.restart = function() {
            $http.post(backend + '/restart');
        };

        $scope.shutdown = function() {
            $http.post(backend + '/shutdown');
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

    seagrass.controller("PatternController", ['$scope', '$http', '$log', function ($scope, $http, $log) {
        $scope.patterns = Array.apply(null, Array(patternRange)).map(function (_, i) {return i;});

        $scope.chosen_pattern = defaultPattern;

        $scope.speed = speedDefault;
        $scope.speedMin = speedMin;
        $scope.speedMax = speedMax;

        $scope.intensity = intensityDefault;
        $scope.intensityMin = intensityMin;
        $scope.intensityMax = intensityMax;

        $scope.red = 0;
        $scope.green = 0;
        $scope.blue = 0;

        $scope.submit = function() {
            $http.post(backend + '/pattern/' + $scope.chosen_pattern + '?intensity=' + $scope.intensity +
                '&red=' + $scope.red + '&green=' + $scope.green + '&blue=' + $scope.blue + '&speed=' + $scope.speed);
        };
    }]);

    seagrass.controller("ChosenSensorController", ['$scope', '$http', '$log', 'CachedService', function ($scope, $http, $log, CachedService) {
        $scope.chosen_sensor = CachedService.get();

        $scope.filterLength = 0;
        $scope.threshold = 0;

        $scope.submit = function() {
            $http.post(backend + '/sensor/' + $scope.chosen_sensor + '?threshold=' + $scope.threshold);
            $http.post(backend + '/sensor/' + $scope.chosen_sensor + '?filterLength=' + $scope.filterLength);
        };

        CachedService.getSensors(function(data) {
           data.map(function(sensor) {
              if (sensor.name === $scope.chosen_sensor)
              {
                  $scope.threshold = sensor.threshold;
                  $scope.filterLength = sensor.filterLength;
              }

              return sensor;
           })
        });
    }]);

    seagrass.controller("OutOfBatteryController", ['$scope', 'CachedService', function ($scope, CachedService) {
        $scope.outOfBattery = [];

        CachedService.getMembers(function(data) {
            $scope.outOfBattery = data.filter(CachedService.batteryFilter);
        });
    }]);
}());

