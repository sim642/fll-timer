var io = require('socket.io')();

var teams = ['Superkarud', 'Robogängstad', 'Team Villu Pillu', 'Karu põder lehm ja mäger'];
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
];

io.on('connection', function(socket) {
	console.log('client connected');
	socket.emit('teams', teams);
	socket.emit('rounds', rounds);
	socket.emit('showteams', [1, 3]);

	socket.on('disconnect', function() {
		console.log('client disconnected');
	});

	socket.on('teams', function(newTeams, fn) {
		teams = newTeams;
		fn();
		socket.broadcast.emit('teams', teams);
	});

	socket.on('rounds', function(newRounds, fn) {
		rounds = newRounds;
		fn();
		socket.broadcast.emit('rounds', rounds);
	})
});

module.exports = io;