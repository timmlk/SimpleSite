var models = require('./models'),sys = require('util'), q= require('q');

var Document, User, Comment;

function pr(nodeAsyncFn, context) {
	  return function() {
	    var defer = q.defer()
	      , args = Array.prototype.slice.call(arguments);

	    args.push(function(err, val) {
	      if (err !== null) {
	        return defer.reject(err);
	      }

	      return defer.resolve(val);
	    });

	    nodeAsyncFn.apply(context || {}, args);

	    return defer.promise;
	  };
	};
	
var findDoc;// = q.node(Document.findById);

function isDocOwner(req){
	console.log('isDocOwner : req.current_doc'+req.current_doc );//+ (req.current_doc && req.current_doc.user_id ==req.session.user_id));
	return (req.user && req.current_doc) && req.current_doc.user_id ==req.user.id;
	/*if(!findDoc) findDoc = q.nbind(Document.findById, Document);
	return findDoc(docid).then(function(doc){
		console.log("Return from promise then");
		return doc && userid && doc == userid;
	})*/
	/*return Document.findById(docid, function(doc){
		return doc && userid && doc == userid;
	});*/
	
	
}



function loadUser(req, res, next) {
	if (req.session.user_id) {
		User.findById(req.session.user_id, function(err, user) {
			if (user) {
				req.currentUser = user;
				next();
			} else {
				flash('error', 'You have to be logged in to perform that operation',res);
				res.render('sessions/new.jade', {
					user : new User()
				});
			}
		});
	} else {
		flash('error', 'You have to be logged in to perform that operation',res);
		//res.redirect('/sessions/new');
		res.render('sessions/new.jade', {
			user : new User(),
			redirectTo : req.query
		});
	}
}


function handleFormat(req, res, data/* json handler, default handler */) {
	switch (req.params.format) {
	case 'json':
		if (arguments[3])
			arguments[3]();
		else {
			if (data instanceof Array) {
				res.send(data.map(function(d) {
					console.log(d);
					return d;
				}));
			} else {
				res.send(data);
			}
		}
		break;

	default:
		if (arguments[4]) {
			arguments[4]();
		} else {
			res.render('documents/index.jade', {
				documents : data
			});
		}
	}
}
function ensureAuthenticated(req, res, next) {
	  if (req.isAuthenticated()) { return next(); }
	  res.redirect('/sessions/new')
	}
function flash(level, msg, req){
	console.log("flash");
	req.session.msg = {
			level : level,
			message: msg
	}
}



function setupRoutes(app){
	Document = app.Document, User = app.User, Comment = app.Comment, passport = app.Passport;
	// setup route handlers
	//always try to set user
	app.all('*',function(req,res,next){
		if(req.session.msg){ // hack to facilitate obsolete flash method used in express... change express
			res.locals.msg =req.session.msg; 
			req.session.msg = null;
		}
		if(!req.flash){// hack to facilitate obsolete flash method used in express... change express
			req.flash = function(lvl,msg){flash(lvl,msg,req);};
		}
		
		if(req.user){
			console.log("setting user "+req.user);
			res.locals.user = req.user;
		}
		next();
	});
	
	/**
	 * Always try to load doc
	 * TODO maybe convert to middleware
	 */
	app.all('/documents/:id.:format?*', function (req,res,next){
		console.log("trying to default load doc");
		if(req.params.id){
			Document.findById(req.params.id,function (err, doc){
				console.log("Setting current doc");
				req.current_doc = doc;
				res.locals.enableCommentDelete = isDocOwner(req);
				next();
			});
		}else{
			console.log("loadDoc next");
			next();
		}
		
	});
	// comments
	app.get('/documents/:id/comments/new', ensureAuthenticated, function(req,res){
		Document.findById(req.params.id, function(err, d) {
			//console.log(sys.inspect(models));
			var com = new Comment();
			com.created_date = new Date();
			res.render('comments/new.jade', {
				d : d,
				c : com
			});
		});
	});
	app.del('/documents/:id/comments/:comid', ensureAuthenticated, function(req,res){
		console.log("delete comment");
		Document.findById(req.params.id, function(err, d) {
			if(isDocOwner(req)){
				console.log("Found doc");
				d.comments.id(req.params.comid).remove();
				d.save(function(){
					handleFormat(req, res, d, null, function() {
						res.redirect('/documents/'+d.id);
					});
						
				});
			}else{
				console.log("redirect to not authorized");
				res.redirect('/notauthorized.jade');
			}
			
		});
	});
	app.post('/documents/:id/comments/new', ensureAuthenticated, function(req,res){
		Document.findById(req.params.id, function(err, d) {
			console.log(sys.inspect(d));
			var com = new Comment(req.body['comment']);
			if(!com.created_date){
				com.created_date = new Date();
			}
			if(!com.user_id){
				com.user_id = req.user.id;
				com.user_name = req.user.name;
			}
			d.comments.push(com)
			d.save(function(){
				handleFormat(req, res, d, null, function() {
					res.redirect('/documents/'+req.params.id);
				});
			});
			
		});
	});


	// setup document handlers
	// List
	app.get('/documents.:format?', function(req, res) {
		console.log("got req: " + req.url);
		Document.find(function(err, documents) {
			if (!documents)
				documents = [];
			handleFormat(req, res, documents);
		});
	});

	// Create
	app.post('/documents/:id.:format?',ensureAuthenticated, function(req, res) {
		var document = new Document(req.body['document']);
		if(!document.created_date){
			document.created_date = new Date();
		}
		if(!document.user_id && req.user){
			document.user_id=req.user.id;
		}
		document.save(function() {
			handleFormat(req, res, document, null, function() {
				res.redirect('/documents');
			})
		});
	});

	// Read
	app.get('/documents/:id.:format?/edit', function(req, res) {
		console.log("got edit for id : " + req.params.id);
		Document.findById(req.params.id, function(err, d) {
			res.render('documents/edit.jade', {
				d : d
			});
		});
	});
	// get for create form
	app.get('/documents/new', function(req, res) {
		
		var d = new Document();
		d.created_date = new Date();
		console.log("Date : " + d.created_date);
		res.render('documents/new.jade', {
			d : d
		});
	});

	// read for individual document
	app.get('/documents/:id.:format?', function(req, res) {
		console.log("got read for id : " + req.params.id);
		Document.findById(req.params.id, function(err, d) {
			//console.log(sys.inspect(d));
			handleFormat(req, res, d, null, function() {
				res.render('documents/view.jade', { // todo
					d : d
				});
			});
		});
	});

	// Update
	app.put('/documents/:id.:format?', function(req, res) {
		// Load the document
		Document.findById(req.body.document.id, function(err, d) {
			console.log("Update document: " + req.body.document.id);
			// Do something with it
			d.title = req.body.document.title;
			d.data = req.body.document.data;
			d.save(function() {
				handleFormat(req, res, d, null, function() {
					res.redirect('/documents');
				});
			})
		});
	});

	// Delete
	app.del('/documents/:id.:format?',ensureAuthenticated, function(req, res) {
		console.log('deleting:' + req.params.id)
		// Load the document
		Document.findById(req.params.id, function(err, d) {
			// remove the document
			d.remove(function() {
				// Respond according to the request format
				handleFormat(req, res, d, null, function() {
					res.redirect('/documents');
				});

			});
		});

	});

	// Sessions
	app.get('/sessions/new', function(req, res) {
		console.log("new session " + res.locals.message);
		console.log("message " + req.message);
		res.render('sessions/new.jade', {
			user : new User(),
			redirectTo : req.get('referrer')
		});
	});

	app.post('/sessions', passport.authenticate('local',{failureRedirect: '/sessions/new', failureFlash: true}), function(req, res) {
		console.log("Login post body");
		if(req.body.redirect){
  		  return res.redirect(req.body.redirect);
		}
  	  return res.redirect('back');
  	  
	
			      // Remember me
	/*		      if (req.body.remember_me) {
			        var loginToken = new LoginToken({ email: user.email });
			        loginToken.save(function() {
			          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
			          return res.redirect('/documents');
			        });
			      } else {
			    	  if(req.body.redirect){
			    		  return res.redirect(req.body.redirect);
			    	  }
			    	  return res.redirect('back');
			      }
			    } else {
			      flash('error', 'Incorrect credentials',res);
			      return res.render('sessions/new', { user: new User(), redirectTo : req.body.redirect});
			    }
			  });*/ 
	});

	app.del('/sessions', ensureAuthenticated, function(req, res) {
		console.log("close session");
		// Remove the session
		if (req.session) {
			req.session.destroy(function() {
			});
		}
		req.logOut();//close passport session
		res.redirect('/sessions/new');
	});

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
		console.log("user to create : "+sys.inspect(user));

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
	
	// Redirect the user to Google for authentication.  When complete, Google
	// will redirect the user back to the application at
	// /auth/google/return
	app.get('/auth/google', passport.authenticate('google'));

	// Google will redirect the user to this URL after authentication.  Finish
	// the process by verifying the assertion.  If valid, the user will be
	// logged in.  Otherwise, authentication has failed.
	app.get('/auth/google/return', 
	  passport.authenticate('google', { successRedirect: '/documents',
	                                    failureRedirect: '/sessions/new',failureFlash: true }));

	// Redirect the user to Facebook for authentication.  When complete,
	// Facebook will redirect the user back to the application at
	// /auth/facebook/callback
	app.get('/auth/facebook', passport.authenticate('facebook'));

	// Facebook will redirect the user to this URL after approval.  Finish the
	// authentication process by attempting to obtain an access token.  If
	// access was granted, the user will be logged in.  Otherwise,
	// authentication has failed.
	app.get('/auth/facebook/callback', 
	  passport.authenticate('facebook', { successRedirect: '/documents',
	                                      failureRedirect: '/sessions/new',failureFlash: true }));

}

exports.setupRoutes = setupRoutes;