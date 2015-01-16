var teams = [];
var tables = [];
var rounds = [];

var socket = io({
	'sync disconnect on unload': true
});

$.fn.editable.defaults.mode = 'inline'; // X-editable

socket.on('teams', function(newTeams) {
	teams = newTeams;
	renderTeams();
	renderRounds();
});

socket.on('tables', function(newTables) {
	tables = newTables;
	renderTables();
	renderRounds();
})

socket.on('rounds', function(newRounds) {
	rounds = newRounds;
	renderRounds();
});

function renderTeams() {
	var emitTeams = function(params) {
		var D = new $.Deferred;

		if (params.delete) {
			teams.splice(params.pk, 1);
			renderTeams();
		}
		else if (params.pk != -1)
			teams[params.pk] = params.value;
		else {
			teams.push(params.value);
			renderTeams();
		}
		socket.emit('teams', teams, function() {
			D.resolve();
		});
		renderRounds();
		return D.promise();
	};

	$('#teamlist').empty();
	teams.forEach(function(team, ti) {
		var editable = $('<a></a>').text(team).editable({
			type: 'text',
			pk: ti,
			url: emitTeams
		});
		var deletable = $('<a></a>').addClass('pull-right glyphicon glyphicon-trash').click(function() {
			emitTeams({pk: ti, delete: true});
		});

		$('#teamlist').append($('<li></li>').addClass('list-group-item').append(editable).append(deletable));
	});

	var editable = $('<a></a>').text('Lisa meeskond').editable({
		type: 'text',
		pk: -1,
		url: emitTeams
	});
	$('#teamlist').append($('<li></li>').addClass('list-group-item list-group-item-info').append(editable));
}

function renderTables() {
	var emitTables = function(params) {
		var D = new $.Deferred;
		tables[params.pk] = params.value;
		socket.emit('tables', tables, function() {
			D.resolve();
		});
		renderRounds();
		return D.promise();
	};

	$('#tablelist').empty();
	tables.forEach(function(table, i) {
		var editable = $('<a></a>').text(table).editable({
			type: 'text',
			pk: i,
			url: emitTables
		});
		$('#tablelist').append($('<li></li>').addClass('list-group-item').append(editable));
	});
}


function renderRounds() {
	var matchesHeader = $('<tr></tr>');
	matchesHeader.append($('<th></th>').text('Aeg'));
	tables.forEach(function(table) {
		matchesHeader.append($('<th></th>').text(table));
	});

	var editRounds = function(params) {
		var D = new $.Deferred;
		rounds[params.pk.ri].matches[params.pk.mi].tables[params.pk.i] = params.value;
		socket.emit('rounds', rounds, function() {
			D.resolve();
		});
		return D.promise();
	};

	var teams2 = [];
	teams.forEach(function(team, ti) {
		teams2.push({'value': ti, 'text': team});
	});
	console.log(teams2);

	$('#roundlist').empty();
	rounds.forEach(function(round, ri) {
		var panel = $('<div></div>').addClass('panel panel-default');
		panel.append($('<div></div>').addClass('panel-heading').text(round.name));

		var table = $('<table></table>').addClass('table table-hover');
		matchesHeader.clone().appendTo(table);

		round.matches.forEach(function(match, mi) {
			var tr = $('<tr></tr>');
			tr.append($('<td></td>').text(match.time));

			match.tables.forEach(function(ti, i) {
				var editable = $('<a></a>').editable({
					type: 'select',
					pk: {'ri': ri, 'mi': mi, 'i': i},
					value: ti,
					source: teams2,
					url: editRounds
				});
				tr.append($('<td></td>').append(editable));
			});

			table.append(tr);
		});

		panel.append(table);
		$('#roundlist').append(panel);
	});
}