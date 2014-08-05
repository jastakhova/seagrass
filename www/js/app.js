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

    seagrass.controller("SensorsController", ['$http', '$log', function ($http, $log) {
        var home = this;

        home.sensors = [];

        $http.get(backend + '/metrics/sensors').success(function(data) {
            home.sensors = data.collection;
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

    seagrass.controller("ControlController", ['$http', '$log', function ($http, $log) {
        this.startup = function() {
          $http.post(backend + '/startup');
        };

        this.restart = function() {
            $http.post(backend + '/restart');
        };

        this.shutdown = function() {
            $http.post(backend + '/shutdown');
        };

        this.dummy = 0;
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
}());

