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
