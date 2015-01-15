var teams = [];
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


socket.on('rounds', function(newRounds) {
	rounds = newRounds;
	renderRounds();
});

function renderTeams() {
	var emitTeams = function(params) {
		var D = new $.Deferred;
		teams[params.pk] = params.value;
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
		$('#teamlist').append($('<li></li>').addClass('list-group-item').append(editable));
	});
}

var matchesHeader = $('<tr></tr>');
matchesHeader.append($('<th></th>').text('Aeg'));
matchesHeader.append($('<th></th>').text('1. laud'));
matchesHeader.append($('<th></th>').text('2. laud'));
matchesHeader.append($('<th></th>').text('3. laud'));
matchesHeader.append($('<th></th>').text('4. laud'));

function renderRounds() {
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
