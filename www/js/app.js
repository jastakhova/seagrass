(function() {
    var seagrass = angular.module("seagrass", ['onsen']);

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

        $http.get('http://thawing-hamlet-4746.herokuapp.com/members').success(function(data) {
           home.members = data.collection;
        });
    }]);
}());

