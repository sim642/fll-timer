var io = require('socket.io')();
var fs = require('fs');

var teams = [];
var tables = [];
var logos = [];
var rounds = [];
var current = {ri: 0, mi: 0};
var songs = [];
var songi = 0;
var texts = {};

// https://stackoverflow.com/a/10797177/854540
function setIntervalExact(func, interval) {
	// Check current time and calculate the delay until next interval
	var now = new Date(),
		delay = interval - now % interval;

	function start() {
		// Execute function now...
		func();
		// ... and every interval
		setInterval(func, interval);
	}

	// Delay execution until it's an even interval
	setTimeout(start, delay);
}

setIntervalExact(function() {
	io.sockets.emit('clocktime', Date.now());
}, 60 * 1000);

io.on('connection', function(socket) {
	console.log('client connected');

	socket.on('disconnect', function() {
		console.log('client disconnected');
	});


	socket.emit('teams', teams);
	socket.emit('tables', tables);
	socket.emit('logos', logos);
	socket.emit('rounds', rounds);
	socket.emit('current', current);
	socket.emit('songs', songs);
	socket.emit('songi', songi);
	socket.emit('clocktime', Date.now());
	socket.emit('texts', texts);

	socket.on('teams', function(newTeams, fn) {
		teams = newTeams;
		fn();
		socket.broadcast.emit('teams', teams);
		saveData();
	});

	socket.on('tables', function(newTables, fn) {
		tables = newTables;
		fn();
		socket.broadcast.emit('tables', tables);
		saveData();
	});

	socket.on('logos', function(newLogos, fn) {
		logos = newLogos;
		fn();
		socket.broadcast.emit('logos', logos);
		saveData();
	});

	socket.on('rounds', function(newRounds, fn) {
		rounds = newRounds;
		fn();
		socket.broadcast.emit('rounds', rounds);
		saveData();
	});

	socket.on('current', function(newCurrent, fn) {
		current = newCurrent;
		fn();
		socket.broadcast.emit('current', current);
	});

	socket.on('songs', function(newSongs, fn) {
		songs = newSongs;
		fn();
		socket.broadcast.emit('songs', songs);
		saveData();
	});

	socket.on('songi', function(newSongi, fn) {
		songi = newSongi;
		fn();
		socket.broadcast.emit('songi', songi);
	});

	socket.on('starttimer', function(time, totalTime, audio) {
		socket.broadcast.emit('starttimer', time, totalTime, audio);
	});

	socket.on('resettimer', function(time, totalTime) {
		socket.broadcast.emit('resettimer', time, totalTime);
	});

	socket.on('importsongs', function(fn) {
		fs.readdir('public/audio/music/', function(err, files) {
			if (!err) {
				songs = files;
				io.emit('songs', songs);
				saveData();
			}
			else {
				console.log('importsongs error: ', err);
			}
		});
	});
});

fs.readFile('data.json', function(err, data) {
	if (err)
		throw err;

	data = JSON.parse(data);
	teams = data.teams;
	tables = data.tables;
	logos = data.logos;
	rounds = data.rounds;
	songs = data.songs;
	texts = data.texts;

	io.sockets.emit('teams', teams);
	io.sockets.emit('tables', tables);
	io.sockets.emit('logos', logos);
	io.sockets.emit('rounds', rounds);
	io.sockets.emit('songs', songs);
	io.sockets.emit('texts', texts);
});

function saveData() {
	var data = {
		'teams': teams,
		'tables': tables,
		'logos': logos,
		'rounds': rounds,
		'songs': songs,
		'texts': texts
	};
	fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
}

module.exports = io;
