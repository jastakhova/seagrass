var backend = "http://thawing-hamlet-4746.herokuapp.com";

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
        }
    );

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
            return member.battery < 7;
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
            $log.info("Loaded " + data.length + " " + data[0] + " " + data[1] + " " + data[2]);
            for(var i = 0; i < data[0].length; i++)
            {
                var date = new Date(time);
                var tick = date.getMinutes() % 10 === 0;
                time = time - minute;
                var tick = tick ? date.getHours() + ":" + date.getMinutes() : "";
                home.entries.push({cpu : data[0][i], battery : data[1][i], memory: data[2][i], time : tick});
                $log.info(home.entries.length + " time " + time + " " + new Date(time).toTimeString());
            }
        });
    }]);
}());

