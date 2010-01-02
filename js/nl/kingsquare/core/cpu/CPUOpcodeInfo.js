nl.kingsquare.core.cpu.CPUOpcodeInfo = Class.extend({
	init: function(cycles /* :uint */ , len/* :uint */, handler/* :Function */, addr/* :Function */, mnemo/* :String */)  {
		this.cycles = cycles;
		this.len = len;
		this.handler = handler;
		this.addr = addr;
		this.mnemo = mnemo;
	}
});