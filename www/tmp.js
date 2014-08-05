(function() {
    var myApp = angular.module("myApp", ['onsen']);

    myApp.controller("MyController", ['$scope', '$http', function ($scope, $http) {
        $scope.param = 1;

        //$http.get('http://bit.ly');
    }]);
})();