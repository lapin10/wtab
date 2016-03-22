var app=angular.module('wtab', ['ngResource']);

app.factory('Songs', function ($resource) {
	return $resource("/rest/songs");
});

app.factory('Song', function ($resource) {
	return $resource("/rest/songs/:song", {song : '@song'});
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
var leftKey = 37, upKey = 38, rightKey = 39, downKey = 40, insKey = 45, delKey = 46, homeKey = 36, endKey = 35, bsKey = 8;

app.controller('Controller', function($scope, $window, $timeout, Songs, Song) {
	$scope.CHOOSE_SONG_PAGE = '1';
	$scope.EDIT_SONG_PAGE = '2';
	$scope.CREATE_SONG_PAGE = '3';
	$scope.page = $scope.CHOOSE_SONG_PAGE;

	$scope.song = '';
	$scope.songs = []
	$scope.strings = 4;

	$scope.dirty = false;
	$scope.saveTimerMs = 1500; // save after 1.5 s
	$scope.timer = false;

	$scope.changeSong = function(){
		$scope.dirty = true;
		$scope.saveSong();
	}

	$scope.saveSong = function(){
		if($scope.timer){
			$timeout.cancel($scope.timer);
		} 
		$scope.timer = $timeout($scope.doSave, $scope.saveTimerMs);
	}

	$scope.doSave = function(){
		var song = new Song(); 
		song.song = $scope.song;
		song.strings = $scope.strings;
		song.track = $scope.track;
		$scope.timer = false;
		Song.save(song, 
			function() {
				console.log('saved !')
				$scope.dirty = false;
			},
			function(error){
				console.log('NOT saved : '+error)
			});
	}

	$scope.editSong = function(song){
		Song.get({ song : song}, function ready(data){
			$scope.strings = data.data.strings;
			$scope.track = data.data.track;
			//console.log($scope.track)
			$scope.cursor = { x : 0, y : $scope.strings - 1};
			$scope.page = $scope.EDIT_SONG_PAGE;
			$scope.song = song;
			$scope.redraw();
		});
	}

	// attention : avant $scope.track
	$scope.newColumn = function(){
		var frets = [];
		for(var i = 0; i < $scope.strings; i++){
			frets.push(-1);
		}
		return { frets : frets };
	}

	$scope.hasTwoLastEmpties = function(){
		var len = $scope.track.length;
		if(len < 2){
			return false;
		}

	}

	$scope.track = [ $scope.newColumn() ];
	$scope.charWidth = 0;
	$scope.lineHeight = 0;
	$scope.cursor = { x : 0, y : $scope.strings - 1 };
	$scope.HORIZONTAL_MODE = 1;
	$scope.VERTICAL_MODE = 2;
	$scope.DIAGONAL_UP_MODE = 3;
	$scope.DIAGONAL_DOWN_MODE = 4;
	$scope.PEDAL_MODE = 5;
	$scope.pedalUp = true;
	$scope.onHold = false;

	$scope.mode = $scope.HORIZONTAL_MODE;
	$scope.tabFont = '16px bold Arial';
	$scope.newSongName = '';
	$scope.colsPerRow = 1;

	$scope.init = function(){
		Songs.get(function ready(data){
			$scope.songs = data.data;
		});
		tab = document.getElementById('tab');
		tab.font = $scope.tabFont; 
		tab.width = 550;
		tab.height = 800;
		ctx = tab.getContext('2d');
		$scope.charWidth = ctx.measureText('M').width;
		$scope.noteWidth = 3 * $scope.charWidth;
		// TOOD : on resize too
		$scope.colsPerRow = ~~((tab.width / $scope.noteWidth) - 1);
		var measures = getTextHeight(tab.font);
		$scope.lineHeight = measures.height;
		$scope.descent = measures.descent;
		$scope.ascent = measures.ascent;
		$scope.redraw();
		tab.focus();
	}

	$scope.addSong = function(){
		$scope.newSongName = '';
		$scope.page = $scope.CREATE_SONG_PAGE;
	}

	$scope.doCreateSong = function(songName){
		$scope.song = songName;
		$scope.track = [];
		$scope.page = $scope.CREATE_SONG_PAGE;
		$scope.doSave();

	}

	$scope.cursorLeft = function(){
		if($scope.cursor.x > 0){
			$scope.cursor.x--;
			$scope.redraw();
		}
	}

	$scope.cursorRight = function(){
		if($scope.cursor.x >= $scope.track.length - 1){
			// already last note, let's add one
			$scope.track.push($scope.newColumn());
			$scope.changeSong();
		}
		$scope.cursor.x++;
		$scope.redraw();
	}

	$scope.cursorUp = function(shiftKey){
		if(shiftKey){
			if($scope.cursor.x - $scope.colsPerRow >= 0){
				$scope.cursor.x -= $scope.colsPerRow;
			}
		} else {
			if($scope.cursor.y > 0){
				$scope.cursor.y--;
			} else {
				$scope.cursor.y = $scope.strings - 1;
			}
		}
		$scope.redraw();		
	}

	$scope.cursorDown = function(shiftKey){
		if(shiftKey){
			if($scope.cursor.x + $scope.colsPerRow <= $scope.track.length - 1){
				$scope.cursor.x += $scope.colsPerRow;
			}
		} else {
			if($scope.cursor.y < $scope.strings - 1){
				$scope.cursor.y++;
			} else {
				$scope.cursor.y = 0;
			}
		}
		$scope.redraw();		
	}

	$scope.home = function(){
		$scope.cursor.x = 0;
		$scope.redraw();
	}

	$scope.end = function(){
		$scope.cursor.x = $scope.track.length - 1;
		$scope.redraw();
	}

	$scope.onKeydown = function($event){
		if($event.keyCode == upKey){
			$scope.cursorUp($event.shiftKey);
			$event.preventDefault();
		} else if($event.keyCode == leftKey){
			$scope.cursorLeft();
			$event.preventDefault();
		} else if($event.keyCode == downKey){
			$scope.cursorDown($event.shiftKey);
			$event.preventDefault();
		} else if($event.keyCode == rightKey){
			$scope.cursorRight();
			$event.preventDefault();
		} else if($event.keyCode == delKey){
			$scope.deleteDigit($event.ctrlKey);
			$event.preventDefault();
		} else if($event.keyCode == insKey){
			$scope.insertDigit();
			$event.preventDefault();
		} else if($event.keyCode == homeKey){
			$scope.home();
			$event.preventDefault();
		} else if($event.keyCode == endKey){
			$scope.end();
			$event.preventDefault();
		} else if($event.keyCode == bsKey){
			$scope.backspace();
			$event.preventDefault();
		}
	};

	$scope.onKeyup = function($event){
	};

	$scope.onKeypress = function($event){
		var ch = String.fromCharCode($event.which);
		if($event.which >= 48 && $event.which <= 48+9){
			// is a digit
			if($scope.onHold){
				$scope.onHold = false;
			} else {
				if($event.which == 49 || $event.which <= 50){
					$scope.onHold = true;
				} else {
					$scope.onHold = false;
				}
			}
			$scope.addDigit($event.which - 48);
		} else if(ch == 'h'){
			$scope.mode = $scope.HORIZONTAL_MODE;
		} else if(ch == 'v'){
			$scope.mode = $scope.HORIZONTAL_VERTICAL;
		} else if(ch == 'd'){
			$scope.mode = $scope.DIAGONAL_DOWN_MODE;
		} else if(ch == 'D'){
			$scope.mode = $scope.DIAGONAL_UP_MODE;
		} else if(ch == 'p'){
			$scope.mode = $scope.PEDAL_MODE;
			$scope.pedalUp = true;						
		} else if(ch == '%'){
			$scope.copyLastNote();
		} else if(ch == 'a'){
			$scope.onHold = true;
			$scope.addDigit(1);
		} else if(ch == 'b'){
			$scope.onHold = true;			
			$scope.addDigit(2);
		}
	};

	$scope.copyLastNote = function(){
		if($scope.cursor.x > 0){
			for(var i = 0; i < $scope.strings; i++){
				$scope.track[$scope.cursor.x].frets[i] = $scope.track[$scope.cursor.x - 1].frets[i];
			}
			$scope.redraw();
		}
	}

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
			$scope.redraw();
			$scope.changeSong();
		} else if($scope.track[$scope.cursor.x].frets[$scope.cursor.y] == -1){
			// this note is already a silence...
			if($scope.isEmptyCol($scope.cursor.x)){
				// full silence : destroy !
				if($scope.track.length > 1){
					// need more than one note 
					$scope.track.splice($scope.cursor.x, 1);
					if($scope.cursor.x > $scope.track.length - 1){
						// cursor is on last note, move it back
						$scope.cursor.x = $scope.track.length - 1;
					}
					$scope.redraw();
					$scope.changeSong();
				}
			} else {
				// silence the nodes
				for(var i = 0; i < $scope.strings; i++){
					$scope.track[$scope.cursor.x].frets[i] = -1;
				}
				$scope.redraw();
				$scope.changeSong();
			}
		} else {
			// replace note with silence
			$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = -1;
			$scope.redraw();
			$scope.changeSong();
		}
	}

	$scope.backspace = function(){
		if($scope.cursor.x > 0){
			// need more than one note 
			$scope.track.splice($scope.cursor.x - 1, 1);
			$scope.cursor.x -- ;
			$scope.redraw();
			$scope.changeSong();
		}
	}

	$scope.insertDigit = function(){
		$scope.track.splice($scope.cursor.x, 0, $scope.newColumn());
		$scope.redraw();
		$scope.changeSong();
	}

	$scope.addDigit = function(d){
		// TOOD : si d == 1 / 2 => mode wait
		if($scope.track[$scope.cursor.x].frets[$scope.cursor.y] != -1){
			$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = d + $scope.track[$scope.cursor.x].frets[$scope.cursor.y] * 10;
		} else {
			$scope.track[$scope.cursor.x].frets[$scope.cursor.y] = d;
		}
		if(!$scope.onHold){
			if($scope.mode == $scope.HORIZONTAL_MODE){
				$scope.cursor.x ++;
				if($scope.cursor.x >= $scope.track.length){
					$scope.track.push($scope.newColumn()); 
				}
			} else if($scope.mode == $scope.VERTICAL_MODE){
				$scope.cursor.y --;
				if($scope.cursor.y < 0){
					$scope.cursor.x ++;
					if($scope.cursor.x >= $scope.track.length){
						$scope.track.push($scope.newColumn()); 
					}
					$scope.cursor.y = $scope.strings - 1;
				}
			} else if($scope.mode == $scope.DIAGONAL_UP_MODE){
				$scope.cursor.y --;
				$scope.cursor.x ++;
				if($scope.cursor.x >= $scope.track.length){
					$scope.track.push($scope.newColumn()); 
				}			
				if($scope.cursor.y < 0){
					$scope.cursor.y = 1;
					$scope.mode = $scope.DIAGONAL_DOWN_MODE;
				}			
			} else if($scope.mode == $scope.DIAGONAL_DOWN_MODE){
				$scope.cursor.y ++
				$scope.cursor.x ++;
				if($scope.cursor.x >= $scope.track.length){
					$scope.track.push($scope.newColumn()); 
				}			
				if($scope.cursor.y > $scope.strings - 1){
					$scope.cursor.y -= 2;
					$scope.mode = $scope.DIAGONAL_UP_MODE;
				}
			} else if($scope.mode == $scope.PEDAL_MODE){
				$scope.cursor.x ++;
				if($scope.cursor.x >= $scope.track.length){
					$scope.track.push($scope.newColumn()); 
				}			
				if($scope.pedalUp){
					$scope.cursor.y --;
					if($scope.cursor.y < 0){
						$scope.cursor.y = $scope.strings - 1;
					}
					$scope.pedalUp = false;
				} else {
					$scope.cursor.y ++;
					if($scope.cursor.y > $scope.strings - 1){
						$scope.cursor.y = 0;
					}
					$scope.pedalUp = true;
				}
			}
			$scope.changeSong();
		}
		$scope.redraw();
	}

	$scope.style = { bg : '#FFF', tab : '#000', cursor : '#0FF', text : '#000' };

	$scope.redraw = function(){
		var hasFocus = (document.activeElement === this);
		var ctx = tab.getContext('2d');
		ctx.font = tab.font;
		ctx.textBaseline = 'top';
		ctx.fillStyle = $scope.style.bg;
		ctx.fillRect(0, 0, tab.width, tab.height);

		var numRows = 1;
		if($scope.track.length > 0){
			numRows = ~~($scope.track.length / $scope.colsPerRow);
			if(($scope.track.length % $scope.colsPerRow) > 0){
				numRows ++;
			}
		} 
		var w = tab.width - 2 * $scope.charWidth;

		for(var row = 0, idx = 0; idx < $scope.track.length; row++, idx += $scope.colsPerRow){
			var x0 = $scope.charWidth;
			var y0 = $scope.lineHeight + row * ($scope.strings + 2) * $scope.lineHeight;

			w = Math.min($scope.colsPerRow, $scope.track.length - idx) * $scope.noteWidth + $scope.charWidth;

			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = $scope.style.tab;

			ctx.rect(x0, y0, w, ($scope.strings - 1) * $scope.lineHeight);

			for(var string = 1; string < $scope.strings-1; string++){
				ctx.moveTo(x0, y0 + string * $scope.lineHeight);
				ctx.lineTo(x0 + w, y0 + string * $scope.lineHeight);
			}
			ctx.stroke();
			for(var note = idx; note < $scope.track.length && note < idx + $scope.colsPerRow; note++){
				var x = x0 + $scope.charWidth / 2 + (note - idx) * $scope.noteWidth;
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
	}
 });
