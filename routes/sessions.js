var app = module.exports = require('express')()
var models = require('../models'), sys = require('util');
var utils = require('./routeutil');

Document = global.Document, User = global.User, Comment = global.Comment,
		passport = global.Passport;

// Sessions
app.get('/sessions/new', function(req, res) {
	console.log("new session " + res.locals.message);
	console.log("message " + req.message);
	res.render('sessions/new.jade', {
		user : new User(),
		redirectTo : req.get('referrer')
	});
});

app.post('/sessions', passport.authenticate('local', {
	failureRedirect : '/sessions/new',
	failureFlash : true
}), function(req, res) {
	console.log("Login post body");
	if (req.body.redirect) {
		return res.redirect(req.body.redirect);
	}
	return res.redirect('back');

	// Remember me
	/*
	 * if (req.body.remember_me) { var loginToken = new LoginToken({ email:
	 * user.email }); loginToken.save(function() { res.cookie('logintoken',
	 * loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000),
	 * path: '/' }); return res.redirect('/documents'); }); } else {
	 * if(req.body.redirect){ return res.redirect(req.body.redirect); } return
	 * res.redirect('back'); } } else { flash('error', 'Incorrect
	 * credentials',res); return res.render('sessions/new', { user: new User(),
	 * redirectTo : req.body.redirect}); } });
	 */
});

app.del('/sessions', utils.ensureAuthenticated, function(req, res) {
	console.log("close session#################################################################");
	// Remove the session
	if (req.session) {
		req.session.destroy('sid',function() {
		});
	}
	req.logOut();// close passport session
	res.redirect('/sessions/new');
});