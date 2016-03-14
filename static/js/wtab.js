var app=angular.module('OETL', ['ngResource']);

app.factory('Source', function ($resource) {
	return $resource("/rest/source");
});

app.controller('Controller', function($scope, $window, Source) {
	$scope.INPUT_PAGE = 'input';
	$scope.EDIT_PIPELINE = 'edit-pipeline';
	$scope.page = $scope.INPUT_PAGE;

	$scope.source = "";

	$scope.gotoPage = function(page){
		$scope.page = page;
	}

	$scope.addSource = function(){
		console.log('go')
		var source = new Source();
		source.source = $scope.source;
		source.$save(function(){
			$scope.gotoPage($scope.EDIT_PIPELINE);
		});
	}

	$scope.init = function(){
		$scope.readSource();
	}

	$scope.readSource = function(){
		Source.get(function(data){
			$scope.source = data.source;
		});
	}
 });
