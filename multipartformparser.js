var utils = require('connect').utils, cloudinary = require('cloudinary'),
formidable = require('formidable'), _limit = require('connect').limit,
		qs = require('qs'), sys = require('util'), s3 = require('./S3Storage'), authorized = require('./routes/routeutil.js').ensureAuthorized, User = global.User;

exports = module.exports = function(options) {
	options = options || {};
	function noop(req, res, next) {
		next();
	}
	var limit = options.limit ? _limit(options.limit) : noop;

	return function multipart(req, res, next) {
		
	
		
		// if body allready parsed
		if (req._body)
			return next();
		
		req.body = req.body || {};
		req.files = req.files || [];// returned as array of {};
		
		// ignore GET
		if ('GET' == req.method || 'HEAD' == req.method)
			return next();

		// check Content-Type
		if ('multipart/form-data' != utils.mime(req)){
			return next();
		}
		// only accept fileuploads if the user is authorized to upload files
		// the broblem is that passport first makes the user available after the file upload is done
		// so we do it our selves here
		if(!req.cookies.sid){
			req._body = true;// todo throw error or signal in other way
			res.redirect('/notauthorized.jade'); 
		}
		
		//load user from db
		if(req.session.passport.user && ! req.user){
			User.findOne(req.session.passport.user, function (err, user) {
			    req.user=user;
			    authorized(req, res,next);
			    
			    parseForm(req,res,limit,options, next);
			  });
		}
		
	}
};

function parseForm(req,res,limit,options,next){
	// flag as parsed
	req._body = true;

	// parse
	limit(
			req,
			res,
			function(err) {
				if (err)
					return next(err);

				var form = new formidable.IncomingForm, data = {}, files = {}, done;

				Object.keys(options).forEach(function(key) {
					form[key] = options[key];
				});

				function ondata(name, val, data) {
					if (val.indexOf('[')) {
						// array
						var arr = name.substring(0, name.indexOf('['));
						var index = name.substring(name.indexOf('[') + 1,
								name.indexOf(']'));
						if (!data[arr]) {
							data[arr] = {};
							data[arr][index] = val;
						} else {
							data[arr][index] = val;
						}
					}else{
						if (Array.isArray(data[name])) {
							data[name].push(val);
						} else if (data[name]) {
							data[name] = [ data[name], val ];
						} else {
							data[name] = val;
						}
					}
				}

				form.on('field', function(name, val) {
					ondata(name, val, data);
				});

	/*			form.on('file', function(name, val) {
					console.log("On file "+name);
					ondata(name, val, files);
					
				});
*/
				form.on('error', function(err) {
					next(err);
					done = true;
				});

				
				var s3stream;
				var cloudinarystream;
				form.on('end', function() {
					if (done)
						return;
					try {
						req.body = qs.parse(data);
					//	req.files = qs.parse(files);
						
						next();
					} catch (err) {
						next(err);
					}
				});

				form.onPart = function(part) {
					if (!part.filename) {
						//let formidable handle all non-file parts : '
							
						return this.handlePart(part);
					}
					// emit on field for collecting filename
					this.emit("field",part.name, part.filename);
					// create PUT strem to S3 for the current file
					var fileName = part.filename;
					var mime = part.mime;
					var size = data['filesize'][part.filename]; // MUST be stored here, AWS S3 requires content-length
					if(!size){
						next(err);
					}
					// create the stream
					s3stream = s3.getS3Request(part.mime,
							data['filesize'][part.filename], part.filename);
					//cloudinarystream = cloudinary.uploader.upload_stream(function(result) { console.log(result); });
					console.log("sending file : "+part.filename + " size : "+data['filesize'][part.filename]);
					//attach file upload handler
					part.on('data', function(buffer) {
//						form.pause();
						// stream file data to S3
						s3stream.write(buffer);
					//	cloudinarystream.write(buffer);
//						form.resume();
					});
					part.on('end', function(){
						if(cloudinarystream){
							cloudinarystream.end();
							cloudinarystream = null;
					
						}
						
						if (s3stream) {
							s3stream.end();
							s3stream = null;
						}
						setTimeout(function (){
						cloudinary.uploader.upload("http://s3.amazonaws.com/patsia/"+part.filename, function(result) { console.log(result) }, 
								{public_id: part.filename.split('.')[0], transformation : {
                            overlay : "watermark"
                         }});
						},1000);
					});
					// store file info in req
					req.files.push({name: part.filename,
						size: data['filesize'][part.filename],
						mime: part.mime});
				};

				form.parse(req);
			});
}