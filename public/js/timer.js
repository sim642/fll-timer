var socket = io({
	'sync disconnect on unload': true
});

var audio/* = null*/;
var songs = [];
var songi = 0;

function tween(d) {
	var t = 1 - d / defaulttime;

	var r, g;
	if (t < 0.5) {
		g = 1.0;
		r = 2 * t;
	}
	else {
		r = 1.0;
		g = 1 - 2 * (t - 0.5);
	}

	$('#timer').css('color', 'rgb(' + Math.floor(256 * r) + ', ' + Math.floor(256 * g) + ', 0)');
}

function startAudio() {
	stopAudio();
	if (songi >= 0 && songi < songs.length) { // don't play if no songs listed
		audio = new Audio('/audio/' + songs[songi]);
		audio.play();
	}
}

function stopAudio() {
	//if (audio !== null && !audio.paused) {
	if (audio) {
		audio.pause();
		audio.currentTime = 0;
		//audio = null;
	}
}

socket.on('resettimer', function() {
	resetTimer(tween);
	stopAudio();
});

socket.on('starttimer', function() {
	resetTimer();
	stopAudio();

	startTimer(tween);
	startAudio();
});

socket.on('songs', function(data) {
	songs = data;
});

socket.on('songi', function(data) {
	songi = data;
});

$(function() {
	$('#timer').fitText(0.35);
	resetTimer(tween);
});