var mongoose = require('mongoose').Mongoose, crypto = require("crypto");



function defineModels(mongoose, fn) {
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;
	
    Comment = new Schema({
			'user_id': ObjectId,
			'user_name' : String, // hmm maybe define obj ref 
			'created_date' : Date,
			'comment' : String
		});
    
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
		'created_date' : Date,
		'comments' : [ Comment ],
		'category' : {type: String, validate: [validatePresenceOf, 'a category i required']}
	});

	Document.virtual('id').get(function() {
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
		  console.log("Values : " +value);
	    return value && value.length;
	  }

	  User = new Schema({
	    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: false } },
	    'hashed_password': String,
	    'salt': String,
	    'openId' : String,
	    'name' : {type: String, index: { unique: true }},
	    'role' : String,
	    'provider' : String
	  });

	  User.virtual('id')
	    .get(function() {
	    	console.log("Get id  returns "+ this._id);
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

	  User.static('findOrCreate',function(options, fn){
		 this.find({openid:options.openId}, function (err,usr){
			 console.log("findOrCreate user: "+usr+" err: "+err);
			 	 if(!usr ||usr == ""){
			 		var user = new User();
			 		 user.openId = options.openId;
			 		return user.save(fn);
			 	 }
			 	 return fn(err,usr);
		 }); 
	  });
	  User.pre('save', function(next) {
		  console.log("pass : "+this.password+" openId : "+this.openId);
	    if (!validatePresenceOf(this.password) && !validatePresenceOf(this.openId)) {
	      next(new Error('Invalid password'));
	    } else {
	      next();
	    }
	  });

	  
		/**
		 * Model: Painting
		 */
		Painting = new Schema({
			'title' : {
				type : String,
				index : true
			},
			'sub_heading' : String,
			'dimensions' : String,
			'text' : String,
			'user_id' : ObjectId,
			'created_date' : {type: Date, default: Date.now},
			'comments' : [ Comment ],
			'price' : String,
			'image' : {type: String, validate: [validatePresenceOf, 'an image is required']},
			'category' : {type: String, validate: [validatePresenceOf, 'a category i required']}
		});

		Painting.virtual('id').get(function() {
			return this._id.toHexString();
		});
		 Painting.virtual('imagepng')
		    .get(function() {
		      return this.image.split('.')[0]+'.png';
		    });
		 Painting.virtual('summary')
		    .get(function() {
		    	if(this.text.length > 1000){
		    		return this.text.substring(0,1000);
		    	}
		      return this.text;
		    });

	mongoose.model('Document', Document);
	mongoose.model('User', User);
	mongoose.model('Comment', Comment);
	mongoose.model('Painting', Painting);

	fn();
}
exports.defineModels = defineModels;
