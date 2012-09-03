var sys = require('util'),
	passport = require('passport'), 
	LocalStrategy = require('passport-local').Strategy, 
	GoogleStrategy = require('passport-google').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy;

var host_name = process.env.HOST_NAME;

if(!host_name){
	host_name = 'http://localhost:3000';
}

exports.configPassport = function configurePassport(app) {
	var User = app.User;
	// LOCAL config
	passport.use(new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password'
	}, function(username, password, done) {
		console.log("passport login, Username = " + username);
		User.findOne({
			email : username
		}, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {
					message : 'Unknown user'
				});
			}
			if (!user.authenticate(password)) {
				return done(null, false, {
					message : 'Invalid password'
				});
			}
			return done(null, user);
		});
	}));
	passport.serializeUser(function(user, done) {
		console.log("serialize : " + sys.inspect(user));
		if (user.id) {
			return done(null, user.id);
		}
		return done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		console.log("deserializeUser " + id);
		User.findById(id, function(err, user) {
			console.log("found user : " + sys.inspect(user));
			done(err, user);
		});
	});
	// openid -- google
	passport.use(new GoogleStrategy({
		returnURL : host_name+'/auth/google/return',
		realm : host_name // +/
	}, function(identifier, profile, done) {
		console.log("Return from google : " + identifier + ", profile: "
				+ sys.inspect(profile));
		User.findOne({
			openId : identifier
		}, function(err, usr) {
			if (!usr || usr == "") {
				var user = new User();// createUser(options);
				user.openId = identifier;
				user.email = profile.emails[0].value;
				user.name = profile.displayName;
				user.provider = "google";
				console.log("saving user: " + sys.inspect(user));
				return user.save(function(err, newuser) {
					return done(err, newuser);
				});
			}
			return done(err, usr);
		});
	}));

	// oauth -- facebook 
	passport.use(new FacebookStrategy({
	    clientID: "126100004165704",
	    clientSecret: "7def62be7dea141009a41c9df7c89177",
	    callbackURL: host_name+"/auth/facebook/callback"
	  },
	  function(accessToken, refreshToken, profile, done) {
		  console.log("Return from facebook : " + sys.inspect(profile));
		  console.log("accessToken : "+ accessToken );
			done(null,null);
			User.findOne({
				openId : profile.id
			}, function(err, usr) {
				if (!usr || usr == "") {
					var user = new User();// createUser(options);
					user.openId = profile.id;
					user.email = profile.emails[0].value;
					user.name = profile.displayName;
					user.provider = "facebook";
					console.log("saving user: " + sys.inspect(user));
					return user.save(function(err, newuser) {
						return done(err, newuser);
					});
				}
				return done(err, usr);
			});	
	   
	  }
	));
	app.Passport = passport;
}