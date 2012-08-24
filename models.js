var mongoose = require('mongoose').Mongoose, crypto = require("crypto");

function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

	/**
	 * Model: Document
	 */
	Document = new Schema({
		'title' : {
			type : String,
			index : true
		},
		'data' : String,
		'tags' : [ String ],
		'keywords' : [ String ],
		'user_id' : ObjectId,
		'created_date' : Date
	});

	Document.virtual('id').get(function() {
		console.log("Doc.get" + this._id);
		console.log("Doc.get" + this._id.toHexString());
		return this._id.toHexString();
	});

	Document.pre('save', function(next) {
		//this.keywords = extractKeywords(this.data);
		next();
	});

	
	/**
	    * Model: User
	    */
	  function validatePresenceOf(value) {
	    return value && value.length;
	  }

	  User = new Schema({
	    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
	    'hashed_password': String,
	    'salt': String
	  });

	  User.virtual('id')
	    .get(function() {
	      return this._id.toHexString();
	    });

	  User.virtual('password')
	    .set(function(password) {
	      this._password = password;
	      this.salt = this.makeSalt();
	      this.hashed_password = this.encryptPassword(password);
	    })
	    .get(function() { return this._password; });

	  User.method('authenticate', function(plainText) {
	    return this.encryptPassword(plainText) === this.hashed_password;
	  });
	  
	  User.method('makeSalt', function() {
	    return Math.round((new Date().valueOf() * Math.random())) + '';
	  });

	  User.method('encryptPassword', function(password) {
	    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
	  });

	  User.pre('save', function(next) {
	    if (!validatePresenceOf(this.password)) {
	      next(new Error('Invalid password'));
	    } else {
	      next();
	    }
	  });

	mongoose.model('Document', Document);
	mongoose.model('User', User);

	fn();
}

exports.defineModels = defineModels;