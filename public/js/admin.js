var teams = [];
var rounds = [];

var socket = io({
	'sync disconnect on unload': true
});

$.fn.editable.defaults.mode = 'inline'; // X-editable
$(function () {
	$('#username').editable();
});

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
	teams.forEach(function(team, i) {
		var editable = $('<a></a>').text(team).attr('data-pk', i).editable({
			type: 'text',
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
	$('#roundlist').empty();
	rounds.forEach(function(round, ri) {
		var panel = $('<div></div>').addClass('panel panel-default');
		panel.append($('<div></div>').addClass('panel-heading').text(round.name));

		var table = $('<table></table>').addClass('table table-hover');
		//table.append(matchesHeader.clone());
		matchesHeader.clone().appendTo(table);

		round.matches.forEach(function(match, mi) {
			var tr = $('<tr></tr>');
			tr.append($('<td></td>').text(match.time));

			match.tables.forEach(function(table, ti) {
				tr.append($('<td></td>').text(teams[table]));
			});

			table.append(tr);
		});

		panel.append(table);
		$('#roundlist').append(panel);
	});
}