var socket = io({
	'sync disconnect on unload': true
});

var audio/* = null*/;
var songs = [];
var songi = 0;

var cntAudio = new Audio('/audio/62282main_countdown_launch_10_corrected.wav');
var cntOffset = -10.1 * 1000;
var cntTimeout = null;
var cntVolume = 0.2;

function tween(d) {
	var t = 1 - d / totaltime;

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
	stopAudio(false);
	if (songi >= 0 && songi < songs.length) { // don't play if no songs listed
		audio = new Audio('/audio/music/' + songs[songi]);
		audio.volume = 1.0;
		audio.play();
	}

	cntTimeout = setTimeout(function() {
		if (audio)
			audio.volume = cntVolume;

		cntAudio.currentTime = 0;
		cntAudio.play();
	}, defaulttime + cntOffset);
}

function stopAudio(stopCnt) {
	//if (audio !== null && !audio.paused) {
	if (audio) {
		audio.pause();
		audio.currentTime = 0;
		//audio = null;
	}

	clearTimeout(cntTimeout);
	cntTimeout = null;

	if (stopCnt && !cntAudio.paused) {
		cntAudio.pause();
	}
}

socket.on('resettimer', function(time, totalTime) {
	resetTimer(time, totalTime, tween);
	stopAudio(true);

	$('#timer').removeClass('noaudio');
});

socket.on('starttimer', function(time, totalTime, audio) {
	resetTimer(time, totalTime, tween);
	stopAudio(false);

	if (audio)
		$('#timer').removeClass('noaudio');
	else
		$('#timer').addClass('noaudio');

	startTimer(time, totalTime, tween);
	if (audio)
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
	resetTimer(defaulttime, defaulttime, tween);
});
