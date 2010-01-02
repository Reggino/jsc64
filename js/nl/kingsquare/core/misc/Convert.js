nl.kingsquare.core.misc.Convert = Class.extend({});
nl.kingsquare.core.misc.Convert.toHex = function(value/*:uint*/, len/*:uint*/)/*:String*/ {
			var hex/*:String*/ = value.toString(16);
			if (typeof len == 'undefined') len = 2;
			if(hex.length < len) {
				var zeros/*:String*/ = "0000000";
				hex = zeros.substr(0, len - hex.length) + hex;
			}
			return hex.toUpperCase();
}

nl.kingsquare.core.misc.Convert.toBin = function(value/*:uint*/, len/*:uint*/)/*:String*/ {
	var bin/*:String*/ = value.toString(2);
	if (typeof len == 'undefined') len = 8;
	if(bin.length < len) {
		var zeros/*:String*/ = "000000000000000";
		bin = zeros.substr(0, len - bin.length) + bin;
	}
	return bin;
}

nl.kingsquare.core.misc.Convert.toBCD = function (value/*:uint*/)/*:int*/ {
	if(value < 10) {
		return value;
	} else {
		var s/*:String*/ = value.toString();
		var i/*:int*/ = s.length - 1;
		return(((s.charCodeAt(i-1) - 48) << 4) | (s.charCodeAt(i) - 48));
	}
}