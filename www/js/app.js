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
        service('History', function($http, $q, $log) {
            this.get = function(metric){
                var deferred = $q.defer();
                $http.get(backend + '/metrics/' + metric).success(function(data, status) {
                    deferred.resolve(data.history);
                }).error(function(data, status) {
                    deferred.reject(data);
                });

                return deferred.promise;
            }
        }).
        service('Sensor', function($http, $log) {
            this.sensor = "";
            this.sensors = [];

            this.get = function() {
                return this.sensor;
            };

            this.set = function(s) {
                this.sensor = s;
            }

            this.getSensors = function(callback) {
                if (this.sensors.length == 0)
                {
                    $http.get(backend + '/metrics/sensors').success(function(data) {
                        callback(data.collection);
                        this.sensors = data.collection;
                    });
                } else {
                    callback(data.collection);
                }

            }
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

    seagrass.controller("MembersController", ['$http', '$log', function ($http, $log) {
        var home = this;

        this.batteryFilter = function (member) {
            return member.battery < batteryThreshold;
        };

        home.members = [];

        $http.get(backend + '/members').success(function(data) {
           home.members = data.collection;
        });
    }]);

    seagrass.controller("SensorsController", ['$http', '$log', 'Sensor', function ($http, $log, Sensor) {
        var home = this;

        home.sensors = [];

        Sensor.getSensors(function(data) {
            home.sensors = data;
        });
    }]);

    seagrass.controller("ComputerController", ['$http', '$log', '$q', 'History', function ($http, $log, $q, History) {
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
                var tick = tick ? date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) : "";
                home.entries.push({cpu : data[0][i], battery : data[1][i], memory: data[2][i], time : tick});
            }
        });
    }]);

    seagrass.controller("ControlController", ['$scope', '$http', '$log', 'Sensor', function ($scope, $http, $log, Sensor) {
        $scope.startup = function() {
          $http.post(backend + '/startup');
        };

        $scope.restart = function() {
            $http.post(backend + '/restart');
        };

        $scope.shutdown = function() {
            $http.post(backend + '/shutdown');
        };

        $scope.chosen_sensor = Sensor.get();

        $scope.sensors = [];

        Sensor.getSensors(function(data) {
            $scope.sensors = data.map(function(sensor) {
                return sensor.name;
            });
        });

        $scope.chooseSensor = function(navigator, page) {
            if ($scope.chosen_sensor != "")
            {
                Sensor.set($scope.chosen_sensor);
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

    seagrass.controller("ChosenSensorController", ['$scope', '$http', '$log', 'Sensor', function ($scope, $http, $log, Sensor) {
        $scope.chosen_sensor = Sensor.get();

        $scope.filterLength = 0;
        $scope.threshold = 0;

        $scope.submit = function() {
            $http.post(backend + '/sensor/' + $scope.chosen_sensor + '?threshold=' + $scope.threshold);
            $http.post(backend + '/sensor/' + $scope.chosen_sensor + '?filterLength=' + $scope.filterLength);
        };

        Sensor.getSensors(function(data) {
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
}());

