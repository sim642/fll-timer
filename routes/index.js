var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});

router.get('/table', function(req, res) {
	res.render('table');
});

router.get('/table2', function(req, res) {
	res.render('table2');
});

router.get('/admin', function(req, res) {
	res.render('admin');
});

router.get('/timer', function(req, res) {
	res.render('timer');
});

module.exports = router;
