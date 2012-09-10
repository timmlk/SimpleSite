var models = require('./models'), sys = require('util'), q = require('q');

var Document, User, Comment;

function flash(level, msg, req) {
	console.log("flash");
	req.session.msg = {
		level : level,
		message : msg
	}
}

function setupRoutes(app) {
	Document = app.Document, User = app.User, Comment = app.Comment,
			passport = app.Passport;
	// setup route handlers
	// always try to set user
	app.all('*', function(req, res, next) {
		console.log("App all *");
		if (req.session.msg) { // hack to facilitate obsolete flash method used
								// in express... change express
			res.locals.msg = req.session.msg;
			req.session.msg = null;
		}
		if (!req.flash) {// hack to facilitate obsolete flash method used in
							// express... change express
			req.flash = function(lvl, msg) {
				flash(lvl, msg, req);
			};
		}

		if (req.user) {
			console.log("setting user " + req.user);
			res.locals.user = req.user;
		} else {
			console.log('No user in req : ' + sys.inspect(req));
		}
		console.log("HANDLING REQUEST FOR WORKER : " + app.woker_id);
		next();
	});

	// Redirect the user to Google for authentication. When complete, Google
	// will redirect the user back to the application at
	// /auth/google/return
	app.get('/auth/google', passport.authenticate('google'));

	// Google will redirect the user to this URL after authentication. Finish
	// the process by verifying the assertion. If valid, the user will be
	// logged in. Otherwise, authentication has failed.
	app.get('/auth/google/return', passport.authenticate('google', {
		successRedirect : '/documents',
		failureRedirect : '/sessions/new',
		failureFlash : true
	}));

	// Redirect the user to Facebook for authentication. When complete,
	// Facebook will redirect the user back to the application at
	// /auth/facebook/callback
	app.get('/auth/facebook', passport.authenticate('facebook'));

	// Facebook will redirect the user to this URL after approval. Finish the
	// authentication process by attempting to obtain an access token. If
	// access was granted, the user will be logged in. Otherwise,
	// authentication has failed.
	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect : '/documents',
		failureRedirect : '/sessions/new',
		failureFlash : true
	}));

}

exports.setupRoutes = setupRoutes;