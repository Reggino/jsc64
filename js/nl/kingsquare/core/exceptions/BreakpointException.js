nl.kingsquare.core.exceptions.BreakpointException = function(message/*:String*/, address/*:uint*/, type/*:uint*/, cyclesConsumed/*:uint*/) {
	//this.prototype.call(this, message);
	this.message = message;
	this.address = address;
	this.type = type;
	this.cyclesConsumed = cyclesConsumed;
}
//nl.kingsquare.core.exceptions.BreakpointException.prototype = new Error;