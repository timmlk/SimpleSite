module.exports.ensureAuthenticated =  function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/sessions/new')
}

module.exports.isDocOwner = function isDocOwner(req) {
	console.log('isDocOwner : req.current_doc' + req.current_doc);
	return (req.user && req.current_doc)
			&& req.current_doc.user_id == req.user.id;
}

module.exports.handleFormat =  function handleFormat(req, res, data/* json handler, default handler */) {
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