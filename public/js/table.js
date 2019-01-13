var fadeTime = 400;

var teams = [];
var tables = [];
var logos = [];
var rounds = [];
var current = {ri: 0, mi: 0};
var showtables = null;
var texts = {};

var socket = io({
	'sync disconnect on unload': true
});

function fadeText($elem, text) {
	var noshow = /^-/.test(text);
	text = noshow ? texts.free : text;

	if ($elem.text() != text) {
		$elem.fadeOut(fadeTime, function() {
			$elem.toggleClass('no-show', noshow);
			$elem.text(text);
			$elem.fadeIn(fadeTime);
		});
	}
}

function renderTeams() {
	if ($('#teamnames').is(':visible')) {
		var ri = current.ri;
		var mi = current.mi;

		var getRealTeam = function(i) {
			var value = teams[rounds[ri].matches[mi].tables[i]];

			for (var mmi = mi - 1; value === "+PREV" && mmi >= 0; mmi--) {
				value = teams[rounds[ri].matches[mmi].tables[i]];
			}

			return value;
		};

		fadeText($('#leftteam'), getRealTeam(showtables[0]));
		fadeText($('#rightteam'), getRealTeam(showtables[1]));
	}
}

function renderTables() {
	$('#tableselect select').empty();
	tables.forEach(function(table, i) {
		$('#tableselect select').append($('<option></option>').val(i).text(table));
	});

	if (showtables !== null) {
		$('#lefttable').text(tables[showtables[0]]);
		$('#righttable').text(tables[showtables[1]]);

		renderLogos();
	}
}

function renderTop() {
	fadeText($('#matchtime'), rounds[current.ri].matches[current.mi].time);
	fadeText($('#roundname'), rounds[current.ri].name);
}

function renderLogos() {
	$('#leftlogo img').attr('src', '/img/' + logos[showtables[0]]);
	$('#rightlogo img').attr('src', '/img/' + logos[showtables[1]]);
}

socket.on('teams', function(data) {
	teams = data;
	renderTeams();
});

socket.on('tables', function(data) {
	tables = data;
	renderTables();

	if (showtables == null)
		$('#tableselect').show();
});

socket.on('logos', function(data) {
	logos = data;
	if (showtables !== null)
		renderLogos();
});

socket.on('rounds', function(data) {
	rounds = data;
	renderTop();
	renderTeams();
});

socket.on('current', function(data) {
	current = data;
	renderTop();
	renderTeams();
});

socket.on('texts', function(newTexts) {
	texts = newTexts;
	renderTeams();
});

socket.on('clocktime', function(data) {
	var time = new Date(data);
	var hr = time.getHours();
	var min = time.getMinutes();
	$('#clocktime').text((hr < 10 ? '0' : '') + hr + ':' + (min < 10 ? '0' : '') + min);
});

$(function() {
	$('#select').click(function() {
		showtables = [-1, -1];
		showtables[0] = parseInt($('#leftselect option:selected').first().val());
		showtables[1] = parseInt($('#rightselect option:selected').first().val());

		$('#tableselect').hide();
		$('#tablenames').show();
		renderTables();
		$('#teamnames').show();
		renderTeams();

		$('.tablename').fitText(1.1);
		$('.teamname').fitText(1.2);
	});

	$('#clocktime').fitText(0.25);
});
