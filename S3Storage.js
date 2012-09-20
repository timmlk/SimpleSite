var http = require('http'), 
	util = require('util'),
	fs = require('fs'), 
	crypto = require('crypto');

require('./extensions');

var s3_hostname = 's3.amazonaws.com'
var key = process.env.AWSSecretAccessKey;
var keyId = process.env.AWSAccessKeyId;
var bucket = process.env.AWSBucket || '/patsia/';



module.exports.uploadToS3 = function uploadToS3(contentType, contentLength,
		filename) {
	console.log('uploadToS3 : ' + contentType + ', ' + contentLength + ', '
			+ filename);
	var date = new Date();
	date = date.eformat('ddd, dd mmm yyyy HH:MM:ss o');

	var signature = createS3Signature('PUT', null, contentType, date,
			bucket + filename)

	var request = http.request({
		'hostname' : s3_hostname,
		'method' : 'PUT',
		'path' : bucket + filename,
		'headers' : {
			'content-type' : contentType,
			'content-length' : contentLength,
			'Authorization' : 'AWS ' + keyId + ':' + signature,
			'x-amz-date' : date
		}
	});
	request.useChunkedEncodingByDefault = false;
	request.removeHeader('transfer-encoding');

	request.on('response', function(res) {
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
	})
	request.on('error', function(err) {
		console.log('problem with request: ' + err.message);
	});

	return request;
}
/*
 * StringToSign = HTTP-Verb + "\ n" + Content-MD5 + "\ n" + Content-Type + "\ n" +
 * Date + "\ n" + CanonicalizedAmzHeaders + CanonicalizedResource;
 * CanonicalizedResource = [ "/" + Bucket ] + < HTTP-Request-URI, from the
 * protocol name up to the query string > ==== /patsia + [ sub-resource, if
 * present. For example "? acl", "? location", "? logging", or "? torrent"];
 * 
 * 
 */
function createS3Signature(verb, md5, contenttype, date, resource, amzHeaders) {
	var stringToSign = verb + '\n'; //HTTP-Verb + "\ n"
	if (md5) {						//+ Content-MD5 + "\ n"
		stringToSign += md5;
	}
	stringToSign += '\n';
	if (contenttype) {				//+ Content-Type + "\ n"
		stringToSign += contenttype;
	}
	stringToSign += '\n';
	stringToSign += ''; 			//+ Date + "\ n" (no date set as x-amz-date, to avoid possible problems with automatic date header)
	stringToSign += '\n';

	var canonicalizedAmzHeaders = 'x-amz-date:' + date + '\n';
	var canonicalizedResource = resource;
	stringToSign += canonicalizedAmzHeaders; // +CanonicalizedAmzHeaders
	stringToSign += canonicalizedResource; // + CanonicalizedResource
	// Finally hmac sha1 encrypt it 
	var hmac = crypto.createHmac('sha1', key).update(stringToSign).digest(
			'base64');
	return hmac;
}