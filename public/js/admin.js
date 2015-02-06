var teams = [];
var tables = [];
var rounds = [];
var current = {ri: 0, mi: 0};
var songs = [];
var songi = 0;

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
});

socket.on('rounds', function(newRounds) {
	rounds = newRounds;
	renderRounds();
});

socket.on('current', function(newCurrent) {
	current = newCurrent;
	renderRounds();
});

socket.on('resettimer', function() {
	resetTimer();
});

socket.on('starttimer', function() {
	resetTimer();
	startTimer();
});

socket.on('songs', function(newSongs) {
	songs = newSongs;
	renderSongs();
});

socket.on('songi', function(newSongi) {
	songi = newSongi;
	renderSongs();
});

socket.on('clocktime', function(data) {
	var time = new Date(data);
	var hr = time.getHours();
	var min = time.getMinutes();
	$('#clocktime').text((hr < 10 ? '0' : '') + hr + ':' + (min < 10 ? '0' : '') + min);
});

function renderTeams() {
	var emitTeams = function(params) {
		var D = new $.Deferred;

		if (params.delete) {
			teams.splice(params.pk, 1);

			// fix shifted teams, clean deleted team
			rounds.forEach(function(round, ri) {
				round.matches.forEach(function(match, mi) {
					match.tables.forEach(function(ti, i) {
						if (ti > params.pk)
							rounds[ri].matches[mi].tables[i]--;
						else if (ti == params.pk)
							rounds[ri].matches[mi].tables[i] = null;
					})
				})
			});

			socket.emit('rounds', rounds, function() {});

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
	editable.on('shown', function(e, editable) {
		editable.input.$input.val('');
	});
	$('#teamlist').append($('<li></li>').addClass('list-group-item list-group-item-info add-item').append(editable));
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

var emitCurrent = function(params) {
	var roundchange = current.ri !== params.ri;
	current.ri = params.ri;
	current.mi = params.mi;

	socket.emit('current', current, function(){});

	$('.panel-round tr').removeClass('success');
	$('.panel-round[data-round="' + current.ri + '"] tr[data-match="' + current.mi + '"]').addClass('success');

	if (roundchange && rounds[current.ri]) {
		renderRounds(); // inefficient
	}
};

function renderRounds() {
	var matchesHeader = $('<tr></tr>');
	matchesHeader.append($('<th></th>').addClass('minimize-col')); // play
	matchesHeader.append($('<th></th>').text('#'));
	matchesHeader.append($('<th></th>').text('Aeg'));
	tables.forEach(function(table) {
		matchesHeader.append($('<th></th>').text(table));
	});
	matchesHeader.append($('<th></th>').addClass('minimize-col')); // delete

	var editRounds = function(params) {
		var D = new $.Deferred;

		if (params.delete) {
			rounds[params.pk.ri].matches.splice(params.pk.mi, 1);
		}
		else if (params.pk.mi != -1) 
			rounds[params.pk.ri].matches[params.pk.mi].tables[params.pk.i] = params.value;
		else {
			var arr = [];
			for (var i = 0; i < tables.length; i++)
				arr.push(null);
			rounds[params.pk.ri].matches.push({
				time: '00:00-00:00',
				tables: arr
			});
		}

		renderRounds(); // inefficient
		socket.emit('rounds', rounds, function() {
			D.resolve();
		});
		return D.promise();
	};

	var editTime = function(params) {
		var D = new $.Deferred;
		rounds[params.pk.ri].matches[params.pk.mi].time = params.value;

		renderRounds(); // inefficient
		socket.emit('rounds', rounds, function() {
			D.resolve();
		});
		return D.promise();
	};

	var editName = function(params) {
		var D = new $.Deferred;
		rounds[params.pk].name = params.value;

		renderRounds(); // inefficient
		socket.emit('rounds', rounds, function() {
			D.resolve();
		});
		return D.promise();
	};

	var teams2 = [];
	teams.forEach(function(team, ti) {
		teams2.push({'id': ti, 'text': team});
	});

	var renderRound = function(ri) {
		var round = rounds[ri];

		var panel = $('<div></div>').addClass('panel panel-default panel-round table-responsive').attr('data-round', ri);
		var nameeditable = $('<a></a>').editable({
			type: 'text',
			pk: ri,
			value: round.name,
			url: editName
		});
		panel.append($('<div></div>').addClass('panel-heading').append(nameeditable));

		var table = $('<table></table>').addClass('table table-hover');
		matchesHeader.clone().appendTo(table);

		round.matches.forEach(function(match, mi) {
			var tr = $('<tr></tr>').attr('data-match', mi);
			if (ri == current.ri && mi == current.mi)
				tr.addClass('success');

			var setCurrent = $('<a></a>').addClass('glyphicon glyphicon-play').click(function() {
				emitCurrent({'ri': ri, 'mi': mi});
			});

			var deletable = $('<a></a>').addClass('glyphicon glyphicon-trash').click(function() {
				editRounds({pk: {'ri': ri, 'mi': mi}, delete: true});
			});

			var timeeditable = $('<a></a>').editable({
				type: 'text',
				pk: {'ri': ri, 'mi': mi},
				value: match.time,
				url: editTime
			});

			tr.append($('<td></td>').append(setCurrent));
			tr.append($('<td></td>').text(mi + 1));
			tr.append($('<td></td>').append(timeeditable));

			match.tables.forEach(function(ti, i) {
				var editable = $('<a></a>').editable({
					type: 'select2',
					pk: {'ri': ri, 'mi': mi, 'i': i},
					value: ti,
					source: teams2,
					url: editRounds,
					onblur: 'submit',
					select2: {
						width: '10vw'
					}
				});
				/*editable.on('shown', function(e, edit) {
					edit.input.$input.select2('open');
				});*/

				tr.append($('<td></td>').append(editable));
			});

			tr.append($('<td></td>').append(deletable));

			table.append(tr);
		});

		var addable = $('<a></a>').addClass('glyphicon glyphicon-plus');
		var addable2 = $('<tr></tr>').addClass('info').append($('<td></td>').addClass('text-center').attr('colspan', tables.length + 4).append(addable)).click(function() {
			editRounds({pk: {'ri': ri, 'mi': -1}});
		});

		table.append(addable2);

		panel.append(table);
		return panel;
	}

	$('#roundlist').empty();
	rounds.forEach(function(round, ri) {
		$('#roundlist').append(renderRound(ri));
	});

	if (rounds[current.ri]) {
		$('#currentround').empty().append(renderRound(current.ri));
	}
}

var emitSongi = function(params) {
	songi = params;

	socket.emit('songi', songi, function(){});

	$('#songlist li').removeClass('list-group-item-success');
	$('#songlist li[data-song="' + songi + '"]').addClass('list-group-item-success');

	$('#songname').text(songs[songi]);
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
	for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

function renderSongs() {
	var emitSongs = function(params) {
		var D = new $.Deferred;

		if (params.delete) {
			songs.splice(params.pk, 1);
			renderSongs();
		}
		else if (params.move)
			renderSongs();
		else if (params.pk != -1)
			songs[params.pk] = params.value;
		else {
			songs.push(params.value);
			renderSongs();
		}
		socket.emit('songs', songs, function() {
			D.resolve();
		});
		return D.promise();
	};

	$('#songlist').empty();
	songs.forEach(function(song, i) {
		var editable = $('<a></a>').text(song).editable({
			type: 'text',
			pk: i,
			url: emitSongs
		});

		var setSongi = $('<a></a>').addClass('glyphicon glyphicon-play').click(function() {
			emitSongi(i);
		});

		var deletable = $('<a></a>').addClass('pull-right glyphicon glyphicon-trash').click(function() {
			emitSongs({pk: i, delete: true});
		});

		var item = $('<li></li>').addClass('list-group-item').attr('data-song', i).append(setSongi).append(editable).append(deletable);
		if (i == songi)
			item.addClass('list-group-item-success');

		$('#songlist').append(item);
	});

	var editable = $('<a></a>').text('Lisa laul').editable({
		type: 'text',
		pk: -1,
		url: emitSongs
	});
	editable.on('shown', function(e, editable) {
		editable.input.$input.val('');
	});
	$('#songlist').append($('<li></li>').addClass('list-group-item list-group-item-info add-item').append(editable));

	$('#songlist').sortable({
		axis: 'y',
		containment: 'parent',
		distance: $('#songlist li').first().height(),
		items: '> li:not(.list-group-item-info)',
		update: function(event, ui) {
			var newSongs = [];
			var newSongi = null;
			$('li', '#songlist').each(function(i, elem) {
				if ($(elem).hasClass('list-group-item-info'))
					return;

				newSongs.push($('a.editable', elem).text());

				if ($(elem).hasClass('list-group-item-success'))
					newSongi = i;
			});
			songs = newSongs;
			emitSongs({move: true});
			emitSongi(newSongi);
		}
	});

	$('#songname').text(songs[songi]);
}

$(function() {
	function resetWrapper() {
		resetTimer();
		var params = songi;
		params++;
		params %= songs.length;
		emitSongi(params);
		socket.emit('resettimer');
		$('#songtext').text('Järgmine laul:');
	};

	$('#next').click(function() {
		var params = $.extend({}, current); // hack to copy object
		params.mi++;
		if (params.mi == rounds[params.ri].matches.length) {
			params.mi = 0;
			params.ri++;
			if (params.ri == rounds.length)
				params.ri = 0;
		}
		emitCurrent(params);
		resetWrapper();
	});

	$('#prev').click(function() {
		var params = $.extend({}, current); // hack to copy object
		params.mi--;
		if (params.mi == -1) {
			params.ri--;
			if (params.ri == -1)
				params.ri = rounds.length - 1;
			params.mi = rounds[params.ri].matches.length - 1;
		}
		emitCurrent(params);
		resetWrapper();
	});

	$('#reset').click(function() {
		resetWrapper();
	});

	$('#start').click(function() {
		startTimer();
		socket.emit('starttimer');
		$('#songtext').text('Praegune laul:');
	});

	$('#shuffle').click(function() {
		songs = shuffle(songs);
		renderSongs();
		socket.emit('songs', songs, function() {});
	});
});