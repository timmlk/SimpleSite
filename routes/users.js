var app = module.exports = require('express')()
var models = require('../models'), sys = require('util');
User = global.User, Comment = global.Comment, passport = global.Passport;

app.get('/users/new', function(req, res) {
	res.render('users/new', {
		user : new User()
	});
});

app.post('/users.:format?', function(req, res) {
	console.log("new user");
	var user = new User(req.body.user);
	user.provider = 'local';
	user.role = 'user';
	console.log("user to create : " + sys.inspect(user));

	function userSaved() {
		switch (req.params.format) {
		case 'json':
			res.send(user);
			break;

		default:
			req.session.user_id = user.id;
			res.redirect('/documents');
		}
	}

	function userSaveFailed(err) {
		console.log(err);
		res.render('users/new.jade', {
			locals : {
				user : user
			}
		});
	}

	user.save(userSaved, userSaveFailed);
});
