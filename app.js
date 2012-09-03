/**
 * Module dependencies.
 */

var // connect = require('connect'),
jade = require('jade'), express = require('express'), http = require('http'), path = require('path'), models = require('./models.js'), mongoose = require('mongoose'), mongoStore = require('connect-mongodb'), db, Document, User, sys = require('util'), routes = require('./routes'), passport = require('passport'), 
//LocalStrategy = require('passport-local').Strategy, GoogleStrategy = require('passport-google').Strategy,FacebookStrategy = require('passport-facebook').Strategy,
passportConfig=require('./setupPassport');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

var app = express();
Date.prototype.format = function(v) {
	if (v && v.toString().length < 2) {
		return '0' + v.toString();
	}
	return v;
}
Date.prototype.textVal = function() {
	return this.getFullYear() + '-' + (this.format(this.getMonth() + 1)) + '-'
			+ this.format(this.getDate());
}

function setMongoUri(altUri){
	//console.log("Configuring mongo db on : "); 
	if(process.env.MONGOLAB_URI){
		app.set('db-uri', process.env.MONGOLAB_URI);
	}else{
		app.set('db-uri', altUri);
	}
	console.log("Configuring mongo db uri on : %s",app.get('db-uri'));
}

app.configure('development', function() {
	console.log("configure dev");
	setMongoUri('mongodb://localhost/webnode-dev');
	app.use(express.errorHandler({
		dumpExceptions : true
	}));
	app.set('view options', {
		pretty : true
	});
});

app.configure('test', function() {
	setMongoUri('mongodb://localhost/webnode-test');
	//app.set('db-uri', 'mongodb://localhost/webnode-test');
	app.set('view options', {
		pretty : true
	});
});

app.configure('production', function() {
	setMongoUri('mongodb://localhost/webnode-production');
	//app.set('db-uri', 'mongodb://localhost/webnode-production');
});

app.configure(function() {
	console.log("configure");
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	// app.use(app.router);
	app.use(express.methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.session({
		store : mongoStore(app.get('db-uri')),
		secret : 'topsecret'
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(express.logger({
		format : '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms'
	}));

});


// define models
models.defineModels(mongoose, function() {
	console.log("define models");
	app.Document = Document = mongoose.model('Document');
	app.User = User = mongoose.model('User');
	app.Comment = Comment = mongoose.model("Comment");
	// app.LoginToken = LoginToken = mongoose.model('LoginToken');
	db = mongoose.connect(app.get('db-uri'));
})
function mongoStoreConnectionArgs() {
	return {
		dbname : db.db.databaseName,
		host : db.db.serverConfig.host,
		port : db.db.serverConfig.port,
		username : db.uri.username,
		password : db.uri.password
	};
}

passportConfig.configPassport(app);//configurePassport();
// setup routes
routes.setupRoutes(app);

/*console.log("Clustering over %s cpus", numCPUs);
if (cluster.isMaster) {
	  // Fork workers.
	  for (var i = 0; i < numCPUs; i++) {
	    cluster.fork();
	  }

	  cluster.on('exit', function(worker, code, signal) {
	    console.log('worker ' + worker.process.pid + ' died');
	  });
	} else {
	  // Workers can share any TCP connection
	  // In this case its a HTTP server
	 */
// 	finally create server
	http.createServer(app).listen(
		app.get('port'),
		function() {
			console.log("Express server listening on port " + app.get('port'));
			console.log('Express server listening on port %d, environment: %s',
					app.get('port'), app.settings.env)
			// console.log('Using connect %s, Express %s, Jade %s',
			// connect.version, express.version, jade.version);
		});
//}