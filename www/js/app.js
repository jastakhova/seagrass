(function() {
    var seagrass = angular.module("seagrass", ['onsen']);

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

