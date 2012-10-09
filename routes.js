var models = require('./models'), sys = require('util'), q = require('q'), crypto = require('crypto'), util = require('./routes/routeutil');
require('./extensions');

var Document, User, Comment, Painting;

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
	app.all('/test/*', function(req,res,next){
		console.log("===========================================================================");
		console.log(sys.inspect(req));
		console.log("===========================================================================");
		next();
	});
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
			console.log('No user in req ');
		}
		res.locals.enableCommentDelete = util.isInRole("admin",req);
		// setup context for menus ....
		res.locals.context = req.path.split('/')[1];
		console.log(req.path.split('/'));
		res.locals.menu = [{active : res.locals.context == 'index', href : '/index', title:'Home'},{active : res.locals.context == 'documents', href : '/documents', title:'Documents'},{active : res.locals.context == 'paintings', href : '/paintings', title:'Paintings'}];
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

	
	app.get('/upload', function(req, res){
		res.render('upload/upload.jade');
		  /*res.send('<form method="post" enctype="multipart/form-data">'
		    + '<p>Title: <input type="text" name="title" /></p>'
		    + '<p>Image: <input type="file" name="image" /></p>'
		    + '<p><input type="submit" value="Upload" /></p>'
		    + '</form>');*/
		});

		app.post('/upload', function(req, res, next){
			console.time("post /upload");
		  // the uploaded file can be found as `req.files.image` and the
		  // title field as `req.body.title`
		/*	req.files.forEach(function(file){
				console.log("Present file : "+file.name);
			  res.send(sys.format('\nuploaded %s (%d Kb) as %s to S3'
			    , file.name
			    , file.size / 1024 | 0 
			    , file.mime
			    ));
			})*/
			res.send(req.files);
		  console.timeEnd("post /upload");
		});
		app.get('/direct', function (req,res, next){
			// remember to enable cors <AllowedMethod>POST</AllowedMethod> for your domain
			// requires s3:putObjectACL for the user key
			var bucket = 'patsia';
			var key = process.env.AWSSecretAccessKey;
			var keyId = process.env.AWSAccessKeyId;
			
			var policy = {"expiration": "",	"conditions": [ {"bucket": bucket}, {"acl": "public-read-write"}, ["starts-with", "$Content-Type", "image/"],["starts-with", "$key",""], {"x-amz-meta-uuid": "14365123651274"}, ["starts-with", "$x-amz-meta-tag", ""] ] };
			policy.expiration = new Date(Date.now()+1000*60*15).eformat("UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");
			var base64Policy = new Buffer(JSON.stringify(policy)).toString('base64');
			
			var hmac = crypto.createHmac('sha1', key).update(base64Policy).digest(
						'base64');

		 res.render('upload/direct_upload', {
			 keyID : keyId,
			 policy : base64Policy ,
			 signature : hmac
		 });
			
			
		});
		app.get('/test', function(req,res,next){
				res.render('test');
		});
}

exports.setupRoutes = setupRoutes;