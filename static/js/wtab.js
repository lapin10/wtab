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
var leftKey = 37, upKey = 38, rightKey = 39, downKey = 40, insKey = 45, delKey = 46, homeKey = 36, endKey = 35;

app.controller('Controller', function($scope, $window, Source) {
	$scope.strings = 6;

	// attention : avant $scope.track
	$scope.newColumn = function(){
		var frets = [];
		for(var i = 0; i < $scope.strings; i++){
			frets.push(-1);
		}
		return { frets : frets };
	}

	$scope.track = [ $scope.newColumn() ];
	$scope.charWidth = 0;
	$scope.lineHeight = 0;
	$scope.cursor = { x : 0, y : $scope.strings - 1 };
	$scope.horizontalMode = true;
	$scope.tabFont = '16px bold Arial';

	$scope.init = function(){
		tab = document.getElementById('tab');
		tab.font = $scope.tabFont; 
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
		} else if($event.keyCode == delKey){
			$scope.deleteDigit($event.ctrlKey);
			$event.preventDefault();
		} else if($event.keyCode == insKey){
			$scope.insertDigit();
			$event.preventDefault();
		} else if($event.keyCode == homeKey){
			$scope.cursor.x = 0;
			$scope.draw();
			$event.preventDefault();
		} else if($event.keyCode == endKey){
			$scope.cursor.x = $scope.track.length - 1;
			$scope.draw();
			$event.preventDefault();
		}
	};

	$scope.onKeyup = function($event){
		//console.log('onKeyup:'+$event.charCode);
		//console.log($event);
	};

	$scope.onKeypress = function($event){
		var ch = String.fromCharCode($event.which);
		if($event.which >= 48 && $event.which <= 48+9){
			// is a digit
			$scope.addDigit($event.which - 48);
			return;
		} else if(ch == 'h'){
			$scope.horizontalMode = true;
		} else if(ch == 'v'){
			$scope.horizontalMode = false;
		}
	};

	$scope.isEmptyCol = function(note){
		var frets = $scope.track[note].frets;

		for(var i = 0; i < $scope.strings; i++){
			if(frets[i] != -1){
				return false;
			}
		}
		return true;
	}

	$scope.deleteDigit = function(withCtrl){
		if(withCtrl){
			// w/ctrl : destroy !
			$scope.track.splice($scope.cursor.x, 1);
			$scope.draw();
		} else if($scope.track[$scope.cursor.x].frets[$scope.cursor.y] == -1){
			// already a silence...
			if($scope.isEmptyCol($scope.cursor.x)){
				// full silence : destroy !
				$scope.track.splice($scope.cursor.x, 1);
				$scope.draw();
			} 
		} else {
			// replace note with silence
			$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = -1;
			$scope.draw();
		}
	}

	$scope.insertDigit = function(){
		$scope.track.splice($scope.cursor.x, 0, $scope.newColumn());
		$scope.draw();
	}

	$scope.addDigit = function(d){
		// TOOD : si d == 1 / 2 => mode wait
		$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = d;
		if($scope.horizontalMode){
			// horizontal mode
			$scope.cursor.x ++;
			if($scope.cursor.x >= $scope.track.length){
				$scope.track.push($scope.newColumn()); 
			}
		} else {
			// vertical mode
			$scope.cursor.y --;
			if($scope.cursor.y < 0){
				$scope.cursor.x ++;
				if($scope.cursor.x >= $scope.track.length){
					$scope.track.push($scope.newColumn()); 
				}
				$scope.cursor.y = $scope.strings - 1;
			}
		}
		$scope.draw();
	}

	$scope.style = { bg : '#EEE', tab : '#000', cursor : '#0FF', text : '#000' };

	$scope.draw = function(){
		var hasFocus = (document.activeElement === this);
		var ctx = tab.getContext('2d');
		ctx.font = tab.font;
		ctx.textBaseline = 'top';
		ctx.fillStyle = $scope.style.bg;
		ctx.fillRect(0, 0, tab.width, tab.height);

		var x0 = $scope.charWidth;
		var w = tab.width - 2 * $scope.charWidth;
		var y0 = $scope.lineHeight;

		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = $scope.style.tab;
		ctx.rect(x0, y0, w, ($scope.strings - 1) * $scope.lineHeight);

		for(var string = 1; string < $scope.strings-1; string++){
			ctx.moveTo(x0, y0 + string * $scope.lineHeight);
			ctx.lineTo(x0 + w, y0 + string * $scope.lineHeight);
		}
		ctx.stroke();
		for(var note = 0; note < $scope.track.length; note++){
			var x = x0 + $scope.charWidth / 2 + note * $scope.noteWidth;
			var col = $scope.track[note];
			for(var string = 0; string < $scope.strings; string++){
				var fret = col.frets[string];
				if(fret != -1){
					var y = y0 + string * $scope.lineHeight - $scope.ascent / 2 - 3; // BOOHHH HACK! 
					if($scope.cursor.x == note && $scope.cursor.y == string){
						ctx.fillStyle = $scope.style.cursor;
					} else {
						ctx.fillStyle = $scope.style.bg;
					}
					if(fret > 9){
						ctx.fillRect(x, y, 2.5 * $scope.charWidth, $scope.lineHeight);
						ctx.fillStyle = $scope.style.text;
						ctx.fillText(''+fret, x + $scope.charWidth / 4, y);
					} else {
						ctx.fillRect(x + $scope.charWidth, y, 1.5 * $scope.charWidth, $scope.lineHeight);
						ctx.fillStyle = $scope.style.text;
						ctx.fillText(''+fret, x + $scope.charWidth + $scope.charWidth / 4, y);						
					}
				}
			}			
			if(note == $scope.cursor.x && col.frets[$scope.cursor.y] == -1){
				// no note under cursor
				var y = y0 + $scope.cursor.y * $scope.lineHeight - $scope.ascent / 2 - 3; // BOOHHH HACK!
				ctx.fillStyle = $scope.style.cursor;
				ctx.fillRect(x + $scope.charWidth, y, 1.5 * $scope.charWidth, $scope.lineHeight);
			}

		}
	}
 });
