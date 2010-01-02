nl.kingsquare.core.memory.io.IOHandlerInfo = function(getter, setter) {
	if (typeof getter == 'undefined') getter = null;
	if (typeof setter == 'undefined') setter = null;
	this.getter = getter;
	this.setter = setter;
}