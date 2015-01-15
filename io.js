var io = require('socket.io')();

var teams = ["Superkarud", "Robogängstad", "Team Villu Pillu", "Karu põder lehm ja mäger"];

io.on('connection', function(socket) {
	console.log('client connected');
	socket.emit('teams', teams);
	socket.emit('showteams', [1, 3]);

	socket.on('disconnect', function() {
		console.log('client disconnected');
	});
});

module.exports = io;