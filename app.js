var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var exphbs  = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passportSession = require('./routes/authentication');
var config = require("./config/database");

// import models to be used
var index = require('./routes/index');
var users = require('./routes/users');
var shirts = require('./routes/shirts');
var payment = require('./routes/payments');
var UserModel = require('./models/users');
var authentication = require('./routes/authentication');

var PesaPal = require('pesapaljs');
var config = require('./config/payments');

var app = express();

var port = process.env.PORT || 8000;

app.use(session({
	secret: 'session_secret',
	cookie: { 
        secure: false,
        expires: false
    },
	resave: true,
	saveUninitialized: true,
  store: new RedisStore(config.redis)
}));


app.use(passportSession.passport.initialize());
app.use(passportSession.passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('trust proxy', 'loopback');


// setup the logger and only log errors
var accessLogStream = fs.createWriteStream('geek-a-shirt.log',
	{ flags: 'a' });
app.use(logger('combined', { stream: accessLogStream,
    skip: function (req, res) { return res.statusCode < 400 } }));


app.use(favicon(__dirname + '/assets/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('session_secret'));
app.use(express.static(path.join(__dirname, 'assets')));


// middleware to use for all requests
app.all("*", function(req, res, next) {
    console.log('request being processed');
    next();
});

app.get('/auth/twitter', passportSession.passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passportSession.passport.authenticate('twitter', {
    successReturnToOrRedirect: '/', failureRedirect: '/login' })
);

app.get('/auth/google', passportSession.passport.authenticate('google',
    { scope: [ 'profile', 'email', 'https://www.googleapis.com/auth/plus.me' ] })
);
app.get('/auth/google/callback', passportSession.passport.authenticate('google', {
    successReturnToOrRedirect: '/', failureRedirect: '/login' })
);

app.get('/auth/facebook', passportSession.passport.authenticate('facebook',
    { scope: ['email', 'public_profile', 'user_photos'], display: 'touch' }
));
app.get('/auth/facebook/callback', passportSession.passport.authenticate('facebook', {
    successReturnToOrRedirect: '/', failureRedirect: '/login' })
);


app.get('/logout',
  function(req, res) {
    req.logout();
    res.redirect('/');
});

/*  Authenticate a route with
    app.post('/api/post/addPost/', ensureAuthenticated, posts.addPost);
*/

/*
  // make user available in every template - middleware
  app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
  });
*/

// static pages routes
app.get('/', index.index);
app.get('/login', index.login);
app.get('/api', index.checkApi);

app.get('/ipn', PesaPal.paymentListener, payment.ipn);
app.get('/makeOrder', payment.makeOrder);


//app.post('/api/user/elasticSearchUsers/', ESusers.elasticSearchUsers);
//app.post('/api/post/elasticSearchPosts/', ESusers.elasticSearchPosts);


// 404 error handler
app.get('*', function(req, res) {
  res.render('404', 404);
});

/*
500 error handler --> production only
need to improve 500 logging
app.use(function(error, req, res, next) {
    res.status(500);
    res.render('500', { title:'500: Internal Server Error', error: error });
});
*/

// ensure request is application/json
function ensureJSON(req, res, next) {
    if ( ! req.is('application/json') ) {
      res.status(400).json({ 'Error': 'Bad Request' });
    } return next();
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } res.redirect('/login');
}

module.exports = app;

app.listen(port);

console.log('Magic happens on port ' + port);
