var app=angular.module('wtab', ['ngResource']);

app.factory('Source', function ($resource) {
	return $resource("/rest/source");
});

//ctx.measureText(text).width;
var getTextHeight = function(font) {
  var text = $('<span>Hg</span>').css({ fontFamily: font });
  var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');
  var div = $('<div></div>');
  div.append(text, block);
  var body = $('body');
  body.append(div);
  try {
    var result = {};
    block.css({ verticalAlign: 'baseline' });
    result.ascent = block.offset().top - text.offset().top;
    block.css({ verticalAlign: 'bottom' });
    result.height = block.offset().top - text.offset().top;
    result.descent = result.height - result.ascent;
  } finally {
    div.remove();
  }
  return result;
};

var tab;
var leftKey = 37, upKey = 38, rightKey = 39, downKey = 40;

app.controller('Controller', function($scope, $window, Source) {
	$scope.track = [ { frets : [ 0, -1, -1, 12] }, { frets : [ 3, -1, -1, -1] }, { frets : [ -1, 4, -1, -1] }, { frets : [ -1, 12, 14, 14] }, { frets : [ -1, 12, 0, 14] }];
	$scope.strings = 4;
	$scope.charWidth = 0;
	$scope.lineHeight = 0;
	$scope.cursor = { x : 0, y : 2};

	$scope.init = function(){
		tab = document.getElementById('tab');
		tab.font = '16px bold Arial';
		tab.width = 1000;
		tab.height = 800;
		tab.setAttribute('tabindex','0');
		ctx = tab.getContext('2d');
		$scope.charWidth = ctx.measureText('M').width;
		$scope.noteWidth = 3 * $scope.charWidth;
		var measures = getTextHeight(tab.font);
		$scope.lineHeight = measures.height;
		$scope.descent = measures.descent;
		$scope.ascent = measures.ascent;
		$scope.draw();
		tab.focus();
	}

	$scope.onKeydown = function($event){
		if($event.keyCode == upKey){
			if($scope.cursor.y > 0){
				$scope.cursor.y--;
			} else {
				$scope.cursor.y = $scope.strings - 1;
			}
			$scope.draw();
			$event.preventDefault();
		} else if($event.keyCode == leftKey){
			if($scope.cursor.x > 0){
				$scope.cursor.x--;
				$scope.draw();
			}
			$event.preventDefault();
		} else if($event.keyCode == downKey){
			if($scope.cursor.y < $scope.strings - 1){
				$scope.cursor.y++;
			} else {
				$scope.cursor.y = 0;
			}
			$scope.draw();			
			$event.preventDefault();
		} else if($event.keyCode == rightKey){
			if($scope.cursor.x < $scope.track.length - 1){
				$scope.cursor.x++;
				$scope.draw();
			}
			$event.preventDefault();
		}
	};

	$scope.onKeyup = function($event){
		//console.log('onKeyup:'+$event.charCode);
		//console.log($event);
	};

	$scope.onKeypress = function($event){
		if($event.which >= 48 && $event.which <= 48+9){
			// is a digit
			$scope.addDigit($event.which - 48);
		}
	};

	$scope.addDigit = function(d){
		$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = d;
		$scope.cursor.x ++;
		if($scope.cursor.x >= $scope.track.length){
			$scope.track.push({ frets : [-1,-1,-1,-1]}); // TOOD : array size 
		}
		$scope.draw();
	}

	$scope.draw = function(){
//		console.log($scope.cursor)
		var hasFocus = (document.activeElement === this);
		var ctx = tab.getContext('2d');
		ctx.font = tab.font;
		ctx.textBaseline = 'top';
		ctx.fillStyle = '#EEE';
		ctx.fillRect(0, 0, tab.width, tab.height);

		var x0 = $scope.charWidth;
		var w = tab.width - 2 * $scope.charWidth;
		var y0 = $scope.lineHeight;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000';
		ctx.rect(x0, y0, w, ($scope.strings - 1) * $scope.lineHeight);

		for(var string = 1; string < $scope.strings-1; string++){
			ctx.moveTo(x0, y0 + string * $scope.lineHeight);
			ctx.lineTo(x0 + w, y0 + string * $scope.lineHeight);
		}
		ctx.stroke();
		ctx.fillStyle = '#000';
		for(var note = 0; note < $scope.track.length; note++){
			var x = x0 + $scope.charWidth / 2 + note * $scope.noteWidth;
			var col = $scope.track[note];
			for(var string = 0; string < $scope.strings; string++){
				var fret = col.frets[string];
				if(fret != -1){
					var y = y0 + string * $scope.lineHeight - $scope.ascent / 2 - 3; // BOOHHH HACK! 
					if($scope.cursor.x == note && $scope.cursor.y == string){
						ctx.fillStyle = '#0FF';
					} else {
						ctx.fillStyle = '#EEE';
					}
					if(fret > 9){
						ctx.fillRect(x, y, 2.5 * $scope.charWidth, $scope.lineHeight);
						ctx.fillStyle = '#000';
						ctx.fillText(''+fret, x + $scope.charWidth / 4, y);
					} else {
						ctx.fillRect(x + $scope.charWidth, y, 1.5 * $scope.charWidth, $scope.lineHeight);
						ctx.fillStyle = '#000';
						ctx.fillText(''+fret, x + $scope.charWidth + $scope.charWidth / 4, y);						
					}
				}
			}			
			if(note == $scope.cursor.x && col.frets[$scope.cursor.y] == -1){
				// no note under cursor
				var y = y0 + $scope.cursor.y * $scope.lineHeight - $scope.ascent / 2 - 3; // BOOHHH HACK!
				ctx.fillStyle = '#0FF';
				ctx.fillRect(x + $scope.charWidth, y, 1.5 * $scope.charWidth, $scope.lineHeight);
			}

		}
	}
 });
