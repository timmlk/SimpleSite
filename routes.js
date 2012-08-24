var models = require('./models'),sys = require('util');

var Document, User, Comment;

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
			user : new User()
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

function flash(level, msg, res){
	console.log("flash");
	res.locals.msg = {
			level : level,
			message: msg
	}
}

function setupRoutes(app){
	Document = app.Document, User = app.User, Comment = app.Comment;
	// setup route handlers
	//always try to set user
	app.all('*',function(req,res,next){
		console.log("app.all : "+req+ ", "+res);
		if(req.session.user_id){
			User.findById(req.session.user_id, function(err, user) {
				if (user) {
					req.currentUser = user;
					res.locals.user_email = user.email;
				}
			});	
		}
		next();
	});
	
	// comments
	
	app.get('/documents/:id/comments/new', loadUser, function(req,res){
		Document.findById(req.params.id, function(err, d) {
			console.log(sys.inspect(models));
			res.render('comments/new.jade', {
				d : d,
				c : new Comment()
			});
		});
	});
	app.post('/documents/:id/comments/new', loadUser, function(req,res){
		Document.findById(req.params.id, function(err, d) {
			console.log(sys.inspect(d));
			var com = new Comment(req.body['comment']);
			if(!com.created_date){
				com.created_date = new Date();
			}
			if(!com.user_id){
				com.user_id = req.session.user_id;
			}
			d.comments.push(com)
			d.save(function(){
				handleFormat(req, res, d, null, function() {
					res.redirect('/documents');
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
	app.post('/documents/:id.:format?', function(req, res) {
		var document = new Document(req.body['document']);
		if(!document.created_date){
			document.created_date = new Date();
		}
		if(!document.user_id && req.currentUser){
			document.user_id=req.currentUser._id;
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
			console.log(sys.inspect(d));
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
	app.del('/documents/:id.:format?',loadUser, function(req, res) {
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
		console.log("new session");
		res.render('sessions/new.jade', {
			user : new User()
		});
	});

	app.post('/sessions', function(req, res) {
		// Find the user and set the currentUser session variable
		  User.findOne({ email: req.body.user.email }, function(err, user) {
			    if (user && user.authenticate(req.body.user.password)) {
			      req.session.user_id = user.id;

			      // Remember me
			      if (req.body.remember_me) {
			        var loginToken = new LoginToken({ email: user.email });
			        loginToken.save(function() {
			          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
			          res.redirect('/documents');
			        });
			      } else {
			        res.redirect('/documents');
			      }
			    } else {
			      flash('error', 'Incorrect credentials',res);
			      res.render('sessions/new', { user: new User()});
			    }
			  }); 
	});

	app.del('/sessions', loadUser, function(req, res) {
		console.log("close session");
		// Remove the session
		if (req.session) {
			req.session.destroy(function() {
			});
		}
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

		function userSaveFailed() {
			res.render('users/new.jade', {
				locals : {
					user : user
				}
			});
		}

		user.save(userSaved, userSaveFailed);
	});
	

	

}

exports.setupRoutes = setupRoutes;