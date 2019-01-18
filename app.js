var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var auth = require('http-auth');
var process = require('process');

var routes = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(process.cwd(), 'views')); // process.cwd() instead of __dirname for pkg
app.set('view engine', 'ejs');
require('ejs'); // require so pkg would package ejs

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public'))); // process.cwd() instead of __dirname for pkg

var basic = auth.basic({
    realm: 'fll-timer',
    file: 'auth.htpasswd'
});
app.use(auth.connect(basic));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
