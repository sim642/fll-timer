var io = require('socket.io')();
var fs = require('fs');

var teams = [];
var tables = [];
var logos = [];
var rounds = [];
var current = {ri: 0, mi: 0};
var songs = [];
var songi = 0;

setInterval(function() {
	io.sockets.emit('clocktime', Date.now());
}, 15 * 1000);

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

	socket.on('starttimer', function() {
		socket.broadcast.emit('starttimer');
	});

	socket.on('resettimer', function() {
		socket.broadcast.emit('resettimer');
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

	io.sockets.emit('teams', teams);
	io.sockets.emit('tables', tables);
	io.sockets.emit('logos', logos);
	io.sockets.emit('rounds', rounds);
	io.sockets.emit('songs', songs);
});

function saveData() {
	var data = {
		'teams': teams,
		'tables': tables,
		'logos': logos,
		'rounds': rounds,
		'songs': songs
	};
	fs.writeFile('data.json', JSON.stringify(data, null, 4));
}

module.exports = io;
