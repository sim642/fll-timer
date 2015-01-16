var io = require('socket.io')();
var fs = require('fs');

var teams = [];
var tables = [];
var rounds = [];
var current = {ri: 0, mi: 0};

/*var teams = ['Superkarud', 'Robogängstad', 'Team Villu Pillu', 'Karu põder lehm ja mäger'];
var rounds = [
	{
		name: '1. voor',
		matches: [
			{
				time: '12:00-12:10',
				tables: [1, 0, 2, 3]
			},
			{
				time: '12:10-12:20',
				tables: [1, 3, 2, 0]
			},
			{
				time: '12:20-12:30',
				tables: [3, 1, 2, 0]
			}
		]
	},
	{
		name: '2. voor',
		matches: [
			{
				time: '13:00-13:10',
				tables: [1, 0, 2, 3]
			},
			{
				time: '13:10-13:20',
				tables: [1, 3, 2, 0]
			},
			{
				time: '13:20-13:30',
				tables: [3, 1, 2, 0]
			}
		]
	}
];*/

io.on('connection', function(socket) {
	console.log('client connected');
	socket.emit('teams', teams);
	socket.emit('tables', tables);
	socket.emit('rounds', rounds);
	socket.emit('current', current);

	socket.on('disconnect', function() {
		console.log('client disconnected');
	});

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
});

fs.readFile('data.json', function(err, data) {
	if (err)
		throw err;

	data = JSON.parse(data);
	teams = data.teams;
	tables = data.tables;
	rounds = data.rounds;

	io.sockets.emit('teams', teams);
	io.sockets.emit('tables', tables);
	io.sockets.emit('rounds', rounds);
});

function saveData() {
	var data = {
		'teams': teams,
		'tables': tables,
		'rounds': rounds
	};
	fs.writeFile('data.json', JSON.stringify(data, null, 4));
}

module.exports = io;
