var express = require('express');
var router = express.Router();


exports.index = function(req, res) {
	if (req.isAuthenticated()) {
	  res.render('app', { title: 'taskwetu', user: req.user[0] });
	  console.log(req.user);
	} else {
	  res.render('index', { title: 'taskwetu' });
	}
};


exports.app = function(req, res) {
  res.render('app', { title: 'taskwetu | App' });
};


exports.login = function(req, res) {
  res.render('login', { title: 'taskwetu | Login' });
};


exports.checkApi = function(req, res) {
  res.render('users', { title: 'taskwetu', content: 'API is running' });
};


//module.exports = router;