var app = module.exports = require('express')()
var models = require('../models'), sys = require('util'), util = require('./routeutil');

Document = global.Document, User = global.User, Comment = global.Comment,
		passport = global.Passport;
/**
 * Always try to load doc TODO maybe convert to middleware
 */
app.all('/documents/:id.:format?*', function(req, res, next) {
	console.log("trying to default load doc");
	if (req.params.id) {
		Document.findById(req.params.id, function(err, doc) {
			console.log("Setting current doc");
			req.current_doc = doc;
			
			next();
		});
	} else {
		console.log("loadDoc next");
		next();
	}

});
// comments
app.get('/documents/:id/comments/new', util.ensureAuthenticated, function(req, res) {
	Document.findById(req.params.id, function(err, d) {
		// console.log(sys.inspect(models));
		var com = new Comment();
		com.created_date = new Date();
		res.render('documents/document_fragment.jade', function(err, html) {
			 res.render('comments/new.jade', {
					d : d,
					c : com,
					context : 'documents',
					html: html
				});
		    });
	});
});
app.del('/documents/:id/comments/:comid', util.ensureAuthenticated,util.ensureAuthorized, function(req,
		res) {
	console.log("delete comment");
	Document.findById(req.params.id, function(err, d) {
			d.comments.id(req.params.comid).remove();
			d.save(function() {
				util.handleFormat(req, res, d, null, function() {
					res.redirect('/documents/' + d.id);
				});

			});
	});
});
app.post('/documents/:id/comments/new', util.ensureAuthenticated,
		function(req, res) {
			Document.findById(req.params.id, function(err, d) {
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
						res.redirect('/documents/' + req.params.id);
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
		util.handleFormat(req, res, documents);
	});
});

// Create
app.post('/documents/:id.:format?', util.ensureAuthenticated,util.ensureAuthorized, function(req, res) {
	var document = new Document(req.body['document']);
	if (!document.created_date) {
		document.created_date = new Date();
	}
	if (!document.user_id && req.user) {
		document.user_id = req.user.id;
	}
	document.save(function() {
		util.handleFormat(req, res, document, null, function() {
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
		// console.log(sys.inspect(d));
		util.handleFormat(req, res, d, null, function() {
			res.render('documents/view.jade', { // todo
				d : d,
				context : 'documents'
			});
		});
	});
});

// Update
app.put('/documents/:id.:format?', util.ensureAuthenticated,util.ensureAuthorized,function(req, res) {
	// Load the document
	Document.findById(req.body.document.id, function(err, d) {
		console.log("Update document: " + req.body.document.id);
		// Do something with it
		d.title = req.body.document.title;
		d.data = req.body.document.data;
		d.save(function() {
			util.handleFormat(req, res, d, null, function() {
				res.redirect('/documents');
			});
		})
	});
});

// Delete
app.del('/documents/:id.:format?', util.ensureAuthenticated,util.ensureAuthorized, function(req, res) {
	console.log('deleting:' + req.params.id)
	// Load the document
	Document.findById(req.params.id, function(err, d) {
		// remove the document
		d.remove(function() {
			// Respond according to the request format
			util.handleFormat(req, res, d, null, function() {
				res.redirect('/documents');
			});

		});
	});

});
