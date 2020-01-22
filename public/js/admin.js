var teams = [];
var tables = [];
var logos = [];
var rounds = [];
var current = {ri: 0, mi: 0};
var songs = [];
var songi = 0;
var automatch = false;
var texts = {};

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

socket.on('logos', function(newLogos) {
	logos = newLogos;
	renderTables();
});

socket.on('rounds', function(newRounds) {
	rounds = newRounds;
	renderRounds();
});

socket.on('current', function(newCurrent) {
	current = newCurrent;
	renderRounds();
});

socket.on('resettimer', function(time, totalTime) {
	resetTimer(time, totalTime);
});

socket.on('starttimer', function(time, totalTime) {
	resetTimer(time, totalTime);
	startTimer(time, totalTime);
});

socket.on('songs', function(newSongs) {
	songs = newSongs;
	renderSongs();
});

socket.on('songi', function(newSongi) {
	songi = newSongi;
	renderSongs();
});

socket.on('texts', function(newTexts) {
	texts = newTexts;
	renderRounds();
});

function dateToMinuteString(date) {
	var hr = date.getHours();
	var min = date.getMinutes();
	var text = (hr < 10 ? '0' : '') + hr + ':' + (min < 10 ? '0' : '') + min;
	return text;
}

socket.on('clocktime', function(data) {
	var text = dateToMinuteString(new Date(data));
	$('#clocktime').text(text);

	if (automatch) {
		automatch_ri:
		for (var ri = current.ri; ri < rounds.length; ri++) {
			var round = rounds[ri];
			for (var mi = (ri == current.ri ? current.mi : 0); mi < round.matches.length; mi++) {
				var match = round.matches[mi];
				if (match.time.startsWith(text)) {
					emitCurrent({'ri': ri, 'mi': mi});
					break automatch_ri;
				}
			}
		}
	}
});

function teamsDisplay(value, response) {
	var noshow = /^-/.test(value);
	$(this).toggleClass('no-show', noshow).text(value);
}

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
			url: emitTeams,
			onblur: 'submit',
			display: teamsDisplay
		});
		var deletable = $('<a></a>').addClass('pull-right glyphicon glyphicon-trash').click(function() {
			emitTeams({pk: ti, delete: true});
		});

		$('#teamlist').append($('<li></li>').addClass('list-group-item').append(editable).append(deletable));
	});

	var editable = $('<a></a>').text('Add team').editable({
		type: 'text',
		pk: -1,
		url: emitTeams,
		display: teamsDisplay
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

	var emitLogos = function(params) {
		var D = new $.Deferred;
		logos[params.pk] = params.value;
		socket.emit('logos', logos, function() {
			D.resolve();
		});
		return D.promise();
	};

	$('#tablelist').empty();
	var tablesHeader = $('<tr></tr>');
	tablesHeader.append($('<th></th>').addClass('minimize-col').text('#'));
	tablesHeader.append($('<th></th>').text('Name'));
	tablesHeader.append($('<th></th>').text('Logo'));
	$('#tablelist').append(tablesHeader);

	tables.forEach(function(table, i) {
		var tr = $('<tr></tr>');

		var editableTable = $('<a></a>').text(table).editable({
			type: 'text',
			pk: i,
			url: emitTables,
			onblur: 'submit'
		});

		var editableLogo = $('<a></a>').text(logos[i]).editable({
			type: 'text',
			pk: i,
			url: emitLogos,
			onblur: 'submit'
		});

		tr.append($('<td></td>').text(i + 1));
		tr.append($('<td></td>').append(editableTable));
		tr.append($('<td></td>').append(editableLogo));

		$('#tablelist').append(tr);
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
	matchesHeader.append($('<th></th>').text('Time'));
	tables.forEach(function(table) {
		matchesHeader.append($('<th></th>').text(table));
	});
	matchesHeader.append($('<th></th>').addClass('minimize-col')); // delete

	var editRounds = function(params) {
		var D = new $.Deferred;

		var matches = rounds[params.pk.ri].matches;

		if (params.delete)
			matches.splice(params.pk.mi, 1);
		else if (params.pk.mi != -1)
			matches[params.pk.mi].tables[params.pk.i] = parseInt(params.value);
		else {
			var newTime = '00:00-00:00';
			if (matches.length >= 1) {
				var lastTime = matches[matches.length - 1].time;
				var period = parsePeriod(lastTime);
				if (period) {
					var newStart = period.end;

					if (matches.length >= 2) {
						var lastTime2 = matches[matches.length - 2].time;
						var period2 = parsePeriod(lastTime2);
						if (period2) {
							newStart = new Date(newStart.getTime() + (period.start.getTime() - period2.end.getTime()));
						}
					}

					var newEnd = new Date(newStart.getTime() + period.duration);
					newTime = dateToMinuteString(newStart) + '-' + dateToMinuteString(newEnd);
				}
			}

			var arr = [];
			for (var i = 0; i < tables.length; i++)
				arr.push(null);
			matches.push({
				time: newTime,
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

		var panel = $('<div></div>').addClass('panel panel-round table-responsive').attr('data-round', ri);
		panel.addClass('panel-' + (ri == current.ri ? 'success' : 'default'));
		var nameeditable = $('<a></a>').editable({
			type: 'text',
			pk: ri,
			value: round.name,
			url: editName,
			onblur: 'submit'
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
				url: editTime,
				onblur: 'submit'
			});

			tr.append($('<td></td>').append(setCurrent));
			tr.append($('<td></td>').text(mi + 1));
			tr.append($('<td></td>').append(timeeditable));

			match.tables.forEach(function(ti, i) {
				var roundsDisplay = function(value, sourceData, response) {
					value = teams[parseInt(value)];

					var prev = false;
					for (var mmi = mi - 1; value === "+PREV" && mmi >= 0; mmi--) {
						value = teams[rounds[ri].matches[mmi].tables[i]];
						prev = true;
					}

					var noshow = /^-/.test(value);
					$(this).toggleClass('no-show', noshow).toggleClass('prev', prev).text(noshow ? texts.free : value);
				};

				var editable = $('<a></a>').editable({
					type: 'select2',
					pk: {'ri': ri, 'mi': mi, 'i': i},
					value: ti,
					source: teams2,
					url: editRounds,
					onblur: 'submit',
					select2: {
						width: '10vw'
					},
					display: roundsDisplay
				});
				editable.on('shown', function(e, edit) {
					if (arguments.length == 2) {

						setTimeout(function() {
							edit.input.$input.select2('open');
						}, 0);

						edit.input.$input.on('select2-close', function() {
							//edit.$element.editable('submit');
							$('form', edit.container.$form).submit();
						});
					}
					//edit.input.$input.select2('open');
					//edit.input.$input.select2.call(edit.input.$input, 'open');
					/*console.log(edit);
					var asd = $('a.select2-choice', edit.container.$form);
					console.log(asd);
					//asd.mousedown();*/
				});

				tr.append($('<td></td>').append(editable));
			});

			tr.append($('<td></td>').append(deletable));

			table.append(tr);
		});

		var addable = $('<a></a>').addClass('glyphicon glyphicon-plus');
		var addable2 = $('<tr></tr>').addClass('info add-item').append($('<td></td>').addClass('text-center').attr('colspan', tables.length + 4).append(addable)).click(function() {
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

function renderCurSong() {
	$('#songname').text(songs.length > 0 ? (songi + 1) + ". " + songs[songi] : "---");
}

var emitSongi = function(params) {
	songi = (params >= 0 && params < songs.length) ? params : 0;

	socket.emit('songi', songi, function(){});

	$('#songlist li').removeClass('list-group-item-success');
	$('#songlist li[data-song="' + songi + '"]').addClass('list-group-item-success');

	renderCurSong();
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
			emitSongi(songi % songs.length);
			renderSongs();
		}
		else if (params.move)
			renderSongs();
		else if (params.pk != -1) {
			songs[params.pk] = params.value;
			renderCurSong();
		}
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
			url: emitSongs,
			onblur: 'submit'
		});

		var setSongi = $('<a></a>').addClass('glyphicon glyphicon-play').click(function() {
			emitSongi(i);
		});

		var movable = $('<a></a>').addClass('pull-right glyphicon glyphicon-sort move-handle');

		var deletable = $('<a></a>').addClass('pull-right glyphicon glyphicon-trash').click(function() {
			emitSongs({pk: i, delete: true});
		});

		var item = $('<li></li>').addClass('list-group-item').attr('data-song', i).append(setSongi).append(editable).append(deletable).append(movable);
		if (i == songi)
			item.addClass('list-group-item-success');

		$('#songlist').append(item);
	});

	var editable = $('<a></a>').text('Add song').editable({
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
		handle: '.move-handle',
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

	renderCurSong();
}

function parsePeriod(time) {
	var m = time.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);

	function makeDate(hour, minute) {
		var startDate = new Date();
		startDate.setHours(hour);
		startDate.setMinutes(minute);
		startDate.setSeconds(0);
		startDate.setMilliseconds(0);
		return startDate;
	}

	if (m) {
		var startHour = parseInt(m[1]);
		var startMinute = parseInt(m[2]);
		var endHour = parseInt(m[3]);
		var endMinute = parseInt(m[4]);

		var startDate = makeDate(startHour, startMinute);
		var endDate = makeDate(endHour, endMinute);

		return {
			start: startDate,
			end: endDate,
			duration: endDate.getTime() - startDate.getTime()
		};
	}
}

function getCurrentMatchTimes() {
	var match = rounds[current.ri].matches[current.mi];

	var period = parsePeriod(match.time);

	var time = Math.max(0, period.start.getTime() - Date.now());
	return {
		time: time,
		totalTime: period.duration
	};
}

$(function() {
	resetTimer(defaulttime, defaulttime);

	function nextSong() {
		var params = songi;
		params++;
		params %= songs.length;
		emitSongi(params);
		$('#songtext').text('Next song:');
	}

	function resetWrapper(changeSong) {
		var time = defaulttime;
		resetTimer(time, time);
		if (changeSong) {
			nextSong();
		}
		socket.emit('resettimer', time, time);
	};

	function startCurrentMatchWrapper() {
		var times = getCurrentMatchTimes();
		var time = times.time;
		var totalTime = times.totalTime;
		resetTimer(time, totalTime);
		startTimer(time, totalTime);
		socket.emit('starttimer', time, totalTime);
	}

	function startMatchWrapper(time) {
		resetTimer(time, time);
		startTimer(time, time);
		socket.emit('starttimer', time, time);
	}

	function start230Wrapper() {
		var time = defaulttime;
		resetTimer(time, time);
		startTimer(time, time, function (d) {
			var countDownNext = $('#countdown-next').is(':checked');
			if (d <= 0 && countDownNext) {
				// counted down
				setTimeout(function () {
					next();
				}, 0);
			}
		});
		socket.emit('starttimer', time, time, true);
		$('#songtext').text('Current song:');
	}

	function autoTimer() {
		var autotimer = $('#autotimer').is(':checked');
		var autotimer230 = $('#autotimer-230').is(':checked');
		if (autotimer) {
			nextSong();
			if (!autotimer230)
				startCurrentMatchWrapper();
			else
				start230Wrapper();
		}
		else {
			resetWrapper(true);
		}
	}

	function next() {
		var params = $.extend({}, current); // hack to copy object
		do {
			params.mi++;
			if (params.mi >= rounds[params.ri].matches.length) {
				params.mi = 0;
				params.ri++;
				if (params.ri == rounds.length)
					params.ri = 0;
			}
		} while (rounds[params.ri].matches.length === 0); // skip over empty rounds

		emitCurrent(params);
		autoTimer();
	}

	$('#next').click(function() {
		next();
	});

	$('#prev').click(function() {
		var params = $.extend({}, current); // hack to copy object
		do {
			params.mi--;
			if (params.mi <= -1) {
				params.ri--;
				if (params.ri == -1)
					params.ri = rounds.length - 1;
				params.mi = rounds[params.ri].matches.length - 1;
			}
		} while (rounds[params.ri].matches.length === 0); // skip over empty rounds

		emitCurrent(params);
		autoTimer();
	});

	$('#reset-230').click(function() {
		resetWrapper(false);
	});

	$('#reset-0').click(function () {
		var time = 0;
		var totalTime = defaulttime;
		resetTimer(time, totalTime);
		socket.emit('resettimer', time, totalTime);
		$('#songtext').text('Next song:');
	});

	$('#start-230').click(function() {
		start230Wrapper();
	});

	$('#start-match').click(function () {
		startCurrentMatchWrapper();
	});

	$('#start-100').click(function() {
		startMatchWrapper((1 * 60 + 0) * 1000);
	});

	$('#start-200').click(function() {
		startMatchWrapper((2 * 60 + 0) * 1000);
	});

	$('#shuffle').click(function() {
		songs = shuffle(songs);
		renderSongs();
		socket.emit('songs', songs, function() {});
	});

	$('#prevsong').click(function() {
		emitSongi((songi - 1 + songs.length) % songs.length);
	});

	$('#nextsong').click(function() {
		emitSongi((songi + 1) % songs.length);
	});

	$('#importsongs').click(function() {
		socket.emit('importsongs');
	});

	$('#automatch').change(function() {
		automatch = $(this).is(':checked');
	});
});
