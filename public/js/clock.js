var socket = io({
	'sync disconnect on unload': true
});

socket.on('clocktime', function(data) {
	var time = new Date(data);
	var hr = time.getHours();
	var min = time.getMinutes();
	$('#clocktime').text((hr < 10 ? '0' : '') + hr + ':' + (min < 10 ? '0' : '') + min);
});

$(function() {
	$('#clock').fitText(0.35);
});
