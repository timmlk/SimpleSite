var app = module.exports = require('express')()
var models = require('../models'), sys = require('util'), util = require('./routeutil');

Document = global.Document, User = global.User, Comment = global.Comment, Painting = global.Painting,
		passport = global.Passport;
/**
 * Always try to load doc TODO maybe convert to middleware
 */
app.all('/paintings/:id.:format?*', function(req, res, next) {
	console.log("trying to default load doc");
	if (req.params.id) {
		Painting.findById(req.params.id, function(err, doc) {
			console.log("Setting current doc");
			req.current_doc = doc;
			res.locals.enableCommentDelete = util.isDocOwner(req);
			next();
		});
	} else {
		console.log("loadDoc next");
		next();
	}

});
// comments
app.get('/paintings/:id/comments/new', util.ensureAuthenticated, function(req, res) {
	Painting.findById(req.params.id, function(err, d) {
		// console.log(sys.inspect(models));
		var com = new Comment();
		com.created_date = new Date();
		res.render('comments/new.jade', {
			d : d,
			c : com
		});
	});
});
app.del('/paintings/:id/comments/:comid', util.ensureAuthenticated, function(req,
		res) {
	console.log("delete comment");
	Painting.findById(req.params.id, function(err, d) {
		if (util.isDocOwner(req)) {
			console.log("Found doc");
			d.comments.id(req.params.comid).remove();
			d.save(function() {
				util.handleFormat(req, res, d, null, function() {
					res.redirect('/paintings/' + d.id);
				});

			});
		} else {
			console.log("redirect to not authorized");
			res.redirect('/notauthorized.jade');
		}

	});
});
app.post('/paintings/:id/comments/new', util.ensureAuthenticated,
		function(req, res) {
			Painting.findById(req.params.id, function(err, d) {
				console.log(sys.inspect(d));
				var com = new Comment(req.body['comment']);
				if (!com.created_date) {
					com.created_date = new Date();
				}
				if (!com.user_id) {
					com.user_id = req.user.id;
					com.user_name = req.user.name;
				}
				d.comments.push(com)
				d.save(function() {
					util.handleFormat(req, res, d, null, function() {
						res.redirect('/paintings/' + req.params.id);
					});
				});

			});
		});

// setup painting handlers
// List
app.get('/paintings.:format?', function(req, res) {
	console.log("got req glsadf: " + req.url);
	Painting.find(function(err, paintings) {
		if (!paintings)
			paintings = [];
		util.handleFormat(req, res, paintings,null,function(){
			res.render('paintings/index.jade', {
				paintings : paintings
			});
		});
	});
});

// Create
app.post('/paintings/:id.:format?', util.ensureAuthenticated, function(req, res) {
	var painting = new Painting(req.body['painting']);
	console.log(sys.inspect(req.body['painting']));
	if (!Painting.created_date) {
		Painting.created_date = new Date();
	}
	if (!Painting.user_id && req.user) {
		Painting.user_id = req.user.id;
	}
	painting.save(function() {
		util.handleFormat(req, res, painting, null, function() {
			res.redirect('/paintings');
		})
	});
});

// Read
app.get('/paintings/:id.:format?/edit', function(req, res) {
	console.log("got edit for id : " + req.params.id);
	Painting.findById(req.params.id, function(err, d) {
		res.render('paintings/edit.jade', {
			d : d
		});
	});
});
// get for create form
app.get('/paintings/new', function(req, res) {

	var d = new Painting();
	d.created_date = new Date();
	console.log("Date : " + d.created_date);
	res.render('paintings/new.jade', {
		d : d
	});
});

// read for individual painting
app.get('/paintings/:id.:format?', function(req, res) {
	console.log("got read for id : " + req.params.id);
	Painting.findById(req.params.id, function(err, d) {
		// console.log(sys.inspect(d));
		util.handleFormat(req, res, d, null, function() {
			res.render('paintings/view.jade', { // todo
				d : d
			});
		});
	});
});

// Update
app.put('/paintings/:id.:format?', function(req, res) {
	// Load the painting
	Painting.findById(req.body.painting.id, function(err, d) {
		console.log("Update painting: " + req.body.painting.id);
		// Do something with it
		d.title = req.body.painting.title;
		d.data = req.body.painting.data;
		d.save(function() {
			util.handleFormat(req, res, d, null, function() {
				res.redirect('/paintings');
			});
		})
	});
});

// Delete
app.del('/paintings/:id.:format?', util.ensureAuthenticated, function(req, res) {
	console.log('deleting:' + req.params.id)
	// Load the painting
	Painting.findById(req.params.id, function(err, d) {
		// remove the painting
		d.remove(function() {
			// Respond according to the request format
			util.handleFormat(req, res, d, null, function() {
				res.redirect('/paintings');
			});

		});
	});

});
