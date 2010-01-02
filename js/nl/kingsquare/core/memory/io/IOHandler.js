nl.kingsquare.core.memory.io.IOHandler = Class.extend({
	init: function(debugFlag)  {
		var hlen, i;
		if (typeof debugFlag == 'undefined') debugFlag = false;
		//this.cname is set by the extending class
		this.cbase = 'IOHandler';
		this.debug = debugFlag;

		/*HUH?
		if(typeof this.nl.kingsquare.core.memory.io.IOHandler.props === null) {
			var d:XMLDocument = new XMLDocument(describeType(arr).toXMLString());
			var n:XMLNode = d.firstChild.firstChild;


			nl.kingsquare.core.memory.io.IOHandler.props = {};
			while(n) {
				if(nl.kingsquare.core.memory.io.IOHandler.props[n.nodeName] == undefined) {
					nl.kingsquare.core.memory.io.IOHandler.props[n.nodeName] = {};
				}
				nl.kingsquare.core.memory.io.IOHandler.props[n.nodeName][n.attributes.name] = {};
				n = n.nextSibling;
			}
		}*/


		// initialize get/set handlers
		this.initHandlers();
		// create memory
		this.arr = nl.kingsquare.as3.flash.utils.getByteArray();
		// determine address mask
		// registers of all c64 i/o chips are duplicated
		// to fill the entire address space for the chip
		// (example: cia1's address space is $dc00-$dcff,
		// but it only has 16 registers, so they are
		// mirrored in $dc10, $dc20, $dc30, ...)
		// (see get/set/callProperty methods)
		this.maskAddress = 0xffff;
		hlen = this.handlers.length - 1;
		while((hlen & (this.maskAddress >> 1)) == hlen) {
			this.maskAddress >>= 1;
		}
		// fill up handler array
		// to ensure we have handlers for all registers
		for(i/*:uint*/ = hlen + 1; i <= this.maskAddress; i++) {
			this.handlers.push(new nl.kingsquare.core.memory.io.Info(this.getDefault, this.setDefault));
		}

		this.arr.length = this.maskAddress + 1;
	},
	setDebug: function(value/*:Boolean*/) {
		this.debug = value;
	},
	getDebug: function()/*:Boolean*/ {
		return this.debug;
	},
	debugMessage: function(message/*:String*/) {
		trace(message);
	},
	/**
	* Initialize handlers table
	* (the table is an array of Info objects)
	* This should be a "virtual" function (is that possible in js?).
	* It should be overwritten by subclasses.
	*/
	initHandlers: function() {
		this.handlers = [];
	},
	getDefault: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[" + this.toString() + "] get " + nl.kingsquare.core.misc.Convert.toHex(index) + ": #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setDefault: function(index/*:int*/, value/*:int*/) {
		if(this.debug) this.debugMessage("[" + this.toString() + "] set " + nl.kingsquare.core.misc.Convert.toHex(index) + ": #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		this.arr[index] = value;
	},

	//simulate flash proxy behaviour, allways call setAddress instead of [address] = value
   setValueByAddress: function(address, value) {
		var index = parseInt(address) & this.maskAddress;
		if(!isNaN(index)) {
			this.handlers[index].setter(index, value);
		} else if(nl.kingsquare.core.memory.io.IOHandler.props.accessor[name] != undefined) {
			this.arr[name.toString()] = value;
		} else {
			throw new IllegalOperationError("Error: Access of undefined property " + name.toString() + " through a reference with static type " + cname);
		}
   },

   getValueByAddress: function(address) {
		var index = parseInt(address) & this.maskAddress;
		if(!isNaN(index)) {
			return this.handlers[index].getter(index);
		} else if(nl.kingsquare.core.memory.io.IOHandler.props.accessor[name] != undefined) {
			return this.arr[name.toString()];
		} else {
			throw new IllegalOperationError("Error: Access of undefined property " + name.toString() + " through a reference with static type " + cname);
		}
   }
});

//seems to do nothing?
nl.kingsquare.core.memory.io.IOHandler.props = {};