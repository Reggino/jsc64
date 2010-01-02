/*
 * Copyright notice
 *
 * (c) 2009 Tim de Koning - Kingsquare Information Services.  All rights reserved.
 *
 * Original version fc64 by Darron Schall and Claus Wahlers
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *//*
	Object Properties
		 6502 accumulator (8 bits)
		private var this.a:int;
		/** 6502 register this.x (8 bits)
		private var this.x:int;
		/** 6502 register this.y (8 bits)
		private var this.y:int;
		/** 6502 processor status register (8 bits)
		private var this.p:int;
		/** 6502 stack index pointer (8 bits)
		private var this.sp:int;
		/** 6502 program counter (16 bits)
		public var this.pc:uint;

		/** this.memory manager
		private var this.memory:IMemoryManager;

		/** Opcode info array
		private var this.opcodes:Array;

		/** Two complement hash table
		private var this.znTable:Array;

		/** Number of consumed cycles per instruction
		private var this.cyclesConsumed:uint;

		/** Should undocumented instructions be processed?
		private var this.useUndocumentedOpcodes:Boolean;

		/** Breakpoint lookup table
		private var this.breakpointTable:ByteArray;
*/

nl.kingsquare.core.cpu.CPU6502 = nl.kingsquare.as3.flash.events.EventDispatcher.extend({
	init: function(mm/* :IMemoryManager */)  {
		this.a = this.cyclesConsumed = this.p = this.pc = this.sp = this.x = this.y = 0;

		this.breakpointTable = new nl.kingsquare.as3.flash.utils.getByteArray('');
		this.breakpointTable.length = 0x10000;
		this.memory = mm;
		this.useUndocumentedOpcodes = true;
		this.opcodes = this.getOpcodeTable();
		this.znTable = this.getTwoComplementTable();

		this.executedOpCodes = [];

		this.reset();
	},

	/**
	* Execute instruction at this.pc
	*
	* @return The number of cycles consumed
	* @throws core.exceptions.BreakpointException
	*/
	exec: function(checkBreakpoints/* :boolean */)/* :uint */ {
		// read opcode
		var opcode/* :int */ = this.memory.read(this.pc++);
		if (typeof checkBreakpoints == 'undefined') checkBreakpoints = nl.kingsquare.debug;

		switch (opcode) {
			case 0x85: // opSTA, this.byZeroPage
				this.cyclesConsumed = 3;
				this.memory.write(this.memory.read(this.pc++), this.a);
				break;
			case 0x8d:	// opSTA, this.byAbsolute
				this.cyclesConsumed = 4;
				var word = this.memory.readWord(this.pc);
				this.memory.write(word, this.a);
				this.pc += 2
				break;
			case 0x91: // opSTA, this.byIndirectY
				this.cyclesConsumed = 6;
				this.memory.write(this.byIndirectY(), this.a);
				break;
			case 0xA5: // opLDA, this.byZeroPage
				this.cyclesConsumed = 3;
				this.a = this.memory.read(this.memory.read(this.pc++));
				this.setStatusFlags(this.a);
				break;
			case 0xD0: // opBNE, this.byZeroPage
				this.cyclesConsumed = 2;
				this.branch(0x02, false);
				break;
			case 0xF0: // opBEQ, this.byZeroPage
				this.cyclesConsumed = 2;
				this.branch(0x02, true);
				break;
			default:
				var opcodeInfo/* :CPUOpcodeInfo */ = this.opcodes[opcode];
				var opcodeHandler/* /* :Function */ = opcodeInfo.handler;
				this.cyclesConsumed = opcodeInfo.cycles;
				opcodeHandler(opcodeInfo.addr);
				break;
		}
		// check for breakpoint
		if(checkBreakpoints && this.breakpointTable[this.pc] > 0) {
			throw(new nl.kingsquare.core.exceptions.BreakpointException('break', this.pc, this.breakpointTable[this.pc], this.cyclesConsumed));
		}
		return this.cyclesConsumed;
	},

	/**
	* Perform this.a non maskable interrupt
	*
	* @return The number of cycles consumed
	*/
	NMI: function()/* :int */ {
		this.pushWord(this.pc);
		this.push(this.p & 0xEF); // clear brk
		this.pc = this.memory.readWord(0xFFFA);
		return 7;
	},

	/**
	* Perform an IRQ/BRK interrupt
	*
	* @return The number of cycles consumed
	*/
	IRQ: function()/* :int */ {
		if ((this.p & 0x04) == 0x00) {
			this.pushWord(this.pc);
			this.push(this.p & 0xEF); // clear brk
			this.pc = this.memory.readWord(0xFFFE);
			this.p |= 0x04;
			return 7;
		}
		return 0;
	}

	/**
	* Reset the internal CPU registers
	*/
	,reset: function()/* :void */ {
		var pcOld/* :uint */ = this.pc;
		this.a = 0x00;
		this.x = 0x00;
		this.y = 0x00;
		this.p = 0x04;
		this.sp = 0xFF;
		// bank rom/ram/io
		this.memory.write(0x0000, 0x2f);
		this.memory.write(0x0001, 0x37);
		// read the reset vector for this.pc address
		this.pc = this.memory.readWord(0xFFFC);
		// fire event
		this.dispatchEvent("cpuResetInternal", pcOld, this.pc);
	}

	/**
	* Get values of processor's registers
	*/
	,getRegisters: function()/* :CPURegisters */ {
		return new CPURegisters(this.a, this.x, this.y, this.p, this.sp, this.pc);
	}


	/**
	* Set Breakpoint
	*/
	,setBreakpoint: function(address/* :uint */, type/* :uint */)/* :void */ {
		if (typeof type == 'undefined') type = 1;
		this.breakpointTable[address] = type;
	}

	/**
	* Clear Breakpoint
	*/
	,clearBreakpoint: function(address/* :uint */)/* :void */ {
		this.breakpointTable[address] = 0;
	}

	/**
	* Get Breakpoint
	*/
	,getBreakpoint: function(address/* :uint */)/* :boolean */ {
		return this.breakpointTable[address] > 0;
	}


	,setUseUndocumentedOpcodes: function(value/* :boolean */)/* :void */ {
		this.useUndocumentedOpcodes = value;
	}

	,getUseUndocumentedOpcodes: function()/* :boolean */ {
		return this.useUndocumentedOpcodes;
	}


	// ==========================================================
	//    O this.p C O D E   H this.a N D L E R S
	// ==========================================================

	,opBRK: function(addr/* :Function */)/* :void */ {
		this.pushWord(this.pc + 1);
		this.push(this.p | 0x10);
		this.pc = this.memory.readWord(0xFFFE);
		this.p |= 0x04;
		this.p |= 0x10;
		// [CW] todo: dispatch "break" event here
	}

	,opHLT: function(addr/* :Function */)/* :void */ {
		this.pc--;
	}

	,opNOP: function(addr/* :Function */)/* :void */ {
	}

	,opBCC: function(addr/* :Function */)/* :void */ {
		this.branch(0x01, false);
	}

	,opBCS: function(addr/* :Function */)/* :void */ {
		this.branch(0x01, true);
	}

	,opBNE: function(addr/* :Function */)/* :void */ {
		this.branch(0x02, false);
	}

	,opBEQ: function(addr/* :Function */)/* :void */ {
		this.branch(0x02, true);
	}

	,opBVC: function(addr/* :Function */)/* :void */ {
		this.branch(0x40, false);
	}

	,opBVS: function(addr/* :Function */)/* :void */ {
		this.branch(0x40, true);
	}

	,opBPL: function(addr/* :Function */)/* :void */ {
		this.branch(0x80, false);
	}

	,opBMI: function(addr/* :Function */)/* :void */ {
		this.branch(0x80, true);
	}

	,opSEC: function(addr/* :Function */)/* :void */ {
		this.p |= 0x01;
	}

	,opSEI: function(addr/* :Function */)/* :void */ {
		this.p |= 0x04;
	}

	,opSED: function(addr/* :Function */)/* :void */ {
		this.p |= 0x08;
	}

	,opCLC: function(addr/* :Function */)/* :void */ {
		this.p &= 0xFE;
	}

	,opCLV: function(addr/* :Function */)/* :void */ {
		this.p &= 0xBF;
	}

	,opCLD: function(addr/* :Function */)/* :void */ {
		this.p &= 0xF7;
	}

	,opCLI: function(addr/* :Function */)/* :void */ {
		this.p &= 0xFB;
	}

	,opJSR: function(addr/* :Function */)/* :void */ {
		this.pushWord(this.pc + 1);
		this.pc = addr();
	}

	,opJMP: function(addr/* :Function */)/* :void */ {
		this.pc = addr();
	}

	,opRTS: function(addr/* :Function */)/* :void */ {
		this.pc = this.popWord() + 1;
	}

	,opRTI: function(addr/* :Function */)/* :void */ {
		this.p = this.pop();
		this.pc = this.popWord();
	}

	,opAND: function(addr/* :Function */)/* :void */ {
		this.a &= this.memory.read(addr());
		this.setStatusFlags(this.a);
	}

	,opORA: function(addr/* :Function */)/* :void */ {
		this.a |= this.memory.read(addr());
		this.setStatusFlags(this.a);
	}

	,opBIT: function(addr/* :Function */)/* :void */ {
		var i/* :int */ = this.memory.read(addr());
		this.p &= 0x3D;
		this.p |= i & 0xc0;
		this.p |= (this.a & i) != 0 ? 0 : 0x02;
	}

	,opADC: function(addr/* :Function */)/* :void */ {
		this.operateAdd(this.memory.read(addr()));
	}

	,opSBC: function(addr/* :Function */)/* :void */ {
		this.operateSub(this.memory.read(addr()));
	}

	,opROL: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.rol(this.memory.read(address)));
	}

	,opROL_A: function(addr/* :Function */)/* :void */ {
		this.a = this.rol(this.a);
	}

	,opROR: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.ror(this.memory.read(address)));
	}

	,opROR_A: function(addr/* :Function */)/* :void */ {
		this.a = this.ror(this.a);
	}

	,opASL: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.asl(this.memory.read(address)));
	}

	,opASL_A: function(addr/* :Function */)/* :void */ {
		this.a = this.asl(this.a);
	}

	,opLSR: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.lsr(this.memory.read(address)));
	}

	,opLSR_A: function(addr/* :Function */)/* :void */ {
		this.a = this.lsr(this.a);
	}

	,opPLA: function(addr/* :Function */)/* :void */ {
		this.a = this.pop();
		this.setStatusFlags(this.a);
	}

	,opPLP: function(addr/* :Function */)/* :void */ {
		this.p = this.pop();
	}

	,opPHA: function(addr/* :Function */)/* :void */ {
		this.push(this.a);
	}

	,opPHP: function(addr/* :Function */)/* :void */ {
		this.push(this.p | 0x10); // set brk
	}

	,opEOR: function(addr/* :Function */)/* :void */ {
		this.a ^= this.memory.read(addr());
		this.setStatusFlags(this.a);
	}

	,opTAX: function(addr/* :Function */)/* :void */ {
		this.x = this.a;
		this.setStatusFlags(this.x);
	}

	,opTAY: function(addr/* :Function */)/* :void */ {
		this.y = this.a;
		this.setStatusFlags(this.y);
	}

	,opTXA: function(addr/* :Function */)/* :void */ {
		this.a = this.x;
		this.setStatusFlags(this.a);
	}

	,opTYA: function(addr/* :Function */)/* :void */ {
		this.a = this.y;
		this.setStatusFlags(this.a);
	}

	,opTSX: function(addr/* :Function */)/* :void */ {
		this.x = this.sp & 0xFF;
		this.setStatusFlags(this.x);
	}

	,opTXS: function(addr/* :Function */)/* :void */ {
		this.sp = this.x & 0xFF;
	}

	,opLDA: function(addr/* :Function */)/* :void */ {
		var address = addr();
		var newValue = this.memory.read(address);
		this.a = newValue;
		this.setStatusFlags(this.a);
	}

	,opLDX: function(addr/* :Function */)/* :void */ {
		this.x = this.memory.read(addr());
		this.setStatusFlags(this.x);
	}

	,opLDY: function(addr/* :Function */)/* :void */ {
		this.y = this.memory.read(addr());
		this.setStatusFlags(this.y);
	}

	,opSTA: function(addr/* :Function */)/* :void */ {
		this.memory.write(addr(), this.a);
	}

	,opSTX: function(addr/* :Function */)/* :void */ {
		this.memory.write(addr(), this.x);
	}

	,opSTY: function(addr/* :Function */)/* :void */ {
		this.memory.write(addr(), this.y);
	}

	,opCMP: function(addr/* :Function */)/* :void */ {
		var ad/* :uint */ = addr();
		this.operateCmp(this.a, this.memory.read(ad));
	}

	,opCPX: function(addr/* :Function */)/* :void */ {
		this.operateCmp(this.x, this.memory.read(addr()));
	}

	,opCPY: function(addr/* :Function */)/* :void */ {
		this.operateCmp(this.y, this.memory.read(addr()));
	}

	,opDEC: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.decrement(this.memory.read(address)));
	}

	,opDEX: function(addr/* :Function */)/* :void */ {
		this.x--;
		this.x &= 0xFF;
		this.setStatusFlags(this.x);
	}

	,opDEY: function(addr/* :Function */)/* :void */ {
		this.y--;
		this.y &= 0xFF;
		this.setStatusFlags(this.y);
	}

	,opINC: function(addr/* :Function */)/* :void */ {
		var address/* :int */ = addr();
		this.memory.write(address, this.increment(this.memory.read(address)));
	}

	,opINX: function(addr/* :Function */)/* :void */ {
		this.x++;
		this.x &= 0xFF;
		this.setStatusFlags(this.x);
	}

	,opINY: function(addr/* :Function */)/* :void */ {
		this.y++;
		this.y &= 0xFF;
		this.setStatusFlags(this.y);
	}


	// ============================================================
	//    O this.p C O D E   H this.a N D L E R S  ( U N O F F I C I this.a L )
	// ============================================================

	,opASO: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = this.asl(this.memory.read(address));
			this.memory.write(address, value);
			this.a |= value;
			this.x = this.a;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opSKB: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.pc++;
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opSKW: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.pc += 2;
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opANC: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.a &= this.memory.read(this.pc++);
			this.setStatusFlags(this.a);
			this.p |= (this.p & 0x80) >> 7;
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opRLA: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = this.rol(this.memory.read(address));
			this.memory.write(address, value);
			this.a &= value;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opLSE: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = this.lsr(this.memory.read(address));
			this.memory.write(address, value);
			this.a ^= value;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opALR: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.a &= this.memory.read(this.pc++);
			this.setStatusFlags(this.a); // [CW] needed? unsure..
			this.a = this.lsr(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opRRA: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = this.ror(this.memory.read(address));
			this.memory.write(address, value);
			this.operateAdd(value); // [CW] was: this.operateAdd(address). bug?
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opARR: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.a &= this.memory.read(this.pc++);
			this.setStatusFlags(this.a); // [CW] needed? unsure..
			this.a = this.ror(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opAXS: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.memory.write(addr(), this.a & this.x);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opAXA: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = ((address & 0xFF00) >> 8) + 1;
			this.memory.write(address, this.a & this.x & value);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opTAS: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.sp = this.x & this.a;
			var address/* :int */ = addr();
			var value/* :int */ = ((address & 0xFF00) >> 8) + 1;
			this.memory.write(address, value & this.sp);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opXAA: function(addr/* :Function */)/* :void */ {
		// [CW] warning: this opcode seems have odd behaviour
		if (this.useUndocumentedOpcodes) {
			this.a = this.x;
			this.a &= this.memory.read(this.pc++);
			this.setStatusFlags(this.a); // [CW] was: this.setStatusFlags(s). bug?
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opXAS: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = ((address & 0xFF00) >> 8) + 1;
			this.memory.write(address, value & this.x);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opSAY: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = ((address & 0xFF00) >> 8) + 1;
			this.memory.write(address, value & this.y);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opLAX: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.a = this.memory.read(addr());
			this.x = this.a;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opLAS: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.a = (this.memory.read(addr()) & this.sp);
			this.x = this.a;
			this.sp = this.a;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opOAL: function(addr/* :Function */)/* :void */ {
		// [CW] warning: this opcode seems have odd behaviour
		if (this.useUndocumentedOpcodes) {
			this.a |= 0xEE;
			this.a &= this.memory.read(addr());
			this.x = this.a;
			this.setStatusFlags(this.a);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opDCM: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = (this.memory.read(address) - 1) & 0xFF;
			this.memory.write(address, value);
			this.operateCmp(this.a, value);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opSAX: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			this.x = (this.a & this.x) - this.memory.read(addr());
			this.p |= this.x < 0 ? 0 : 1;
			this.x &= 0xFF;
			this.setStatusFlags(this.x);
		} else {
			this.usedUndocumentedOpcode();
		}
	}

	,opINS: function(addr/* :Function */)/* :void */ {
		if (this.useUndocumentedOpcodes) {
			var address/* :int */ = addr();
			var value/* :int */ = this.increment(this.memory.read(address));
			this.memory.write(address, value);
			this.operateSub(value);
		} else {
			this.usedUndocumentedOpcode();
		}
	},


	// ==========================================================
	//    this.a D D R E S S I N G   M O D E   M E T H O D S
	// ==========================================================

	/**
	* Get value by immediate mode addressing - #$00
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byImmediate: function()/* :int */ {
		return this.pc++;
	},

	/**
	* Get value by zero page mode addressing - $aa
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byZeroPage: function()/* :int */ {
		return this.memory.read(this.pc++);
	},

	/**
	* Get value by zero page this.x mode addressing - $aa,this.x
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byZeroPageX: function()/* :int */ {
		return this.memory.read(this.pc++) + this.x & 0xFF;
	},

	/**
	* Get value by zero page this.y mode addressing - $aa,this.y
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byZeroPageY: function()/* :int */ {
		return this.memory.read(this.pc++) + this.y & 0xFF;
	},

	/**
	* Get value by absolute mode addressing - $aaaa
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byAbsolute: function()/* :int */ {
		var address/* :int */ = this.memory.readWord(this.pc);
		this.pc += 2;
		return address;
	},

	/**
	* Get value by absolute this.x mode addressing - $aaaa,this.x
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byAbsoluteX: function()/* :int */ {
		var i/* :int */ = this.memory.readWord(this.pc);
		var j/* :int */ = i + this.x;
		// CW: no cycle is added on bound cross for the this.opcodes
		// ASL, DEC and INC (they all have 7 cycles fixed)
		if(/*this.cyclesConsumed != 7 &&*/ ((j ^ i) & 0x100) != 0) {
			this.cyclesConsumed++;
		}
		this.pc += 2;
		return j;
	},

	/**
	* Get value by absolute this.y mode addressing - $aaaa,this.y
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byAbsoluteY: function()/* :int */ {
		var i/* :int */ = this.memory.readWord(this.pc);
		var j/* :int */ = i + this.y;
		if(((j ^ i) & 0x100) != 0) {
			this.cyclesConsumed++;
		}
		this.pc += 2;
		return j;
	},

	/**
	* Get value by indirect mode addressing - ($aaaa)
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byIndirect: function()/* :int */ {
		var i/* :int */ = this.memory.readWord(this.pc);
		this.pc += 2;
		if ((i & 0x00FF) == 0xFF) {
			return (this.memory.read(i & 0xFF00) << 8) | this.memory.read(i);
		} else {
			return this.memory.readWord(i);
		}
	},

	/**
	* Get value by indirect this.x mode addressing - ($aa,this.x)
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byIndirectX: function()/* :int */ {
		return this.memory.readWord((this.memory.read(this.pc++) + this.x) & 0xFF);
	},

	/**
	* Read value by indirect this.y mode addressing - ($aa),this.y
	*
	* @return The value by the specified addressing mode in relation to the current px
	*/
	byIndirectY: function()/* :int */ {
		var i/* :int */ = this.memory.readWord(this.memory.read(this.pc++));
		var j/* :int */ = i + this.y;
		if(((j ^ i) & 0x100) != 0) {
			this.cyclesConsumed++;
		}
		return j;
	},


	// ==========================================================
	//    U T I L I T Y    M E T H O D S
	// ==========================================================

	/**
	* Set the zero and negative status flags
	*/
	setStatusFlags: function(value/* :uint */)/* :void */ {
		this.p &= 0x7D;
		this.p |= this.znTable[value];
	}

	/**
	* Perform arithmetic shift left
	*/
	,asl: function(i/* :int */)/* :int */ {
		this.p &= 0x7C;
		this.p |= i >> 7;
		i <<= 1;
		i &= 0xFF;
		this.p |= this.znTable[i];
		return i;
	}

	/**
	* Perform logical shift right
	*/
	,lsr: function(i/* :int */)/* :int */ {
		this.p &= 0x7C;
		this.p |= i & 0x01;
		i >>= 1;
		this.p |= this.znTable[i];
		return i;
	}

	/**
	* Perform rotate left
	*/
	,rol: function(i/* :int */)/* :int */ {
		i <<= 1;
		i |= this.p & 0x01;
		this.p &= 0x7C;
		this.p |= i >> 8;
		i &= 0xFF;
		this.p |= this.znTable[i];
		return i;
	}

	/**
	* Perform rotate right
	*/
	,ror: function(i/* :int */)/* :int */ {
		var j/* :int */ = this.p & 0x01;
		this.p &= 0x7C;
		this.p |= i & 0x01;
		i >>= 1;
		i |= j << 7;
		this.p |= this.znTable[i];
		return i;
	},

	/**
	* Perform increment
	*/
	increment: function(i/* :int */)/* :int */ {
		i = ++i & 0xFF;
		this.setStatusFlags(i);
		return i;
	},

	/**
	* Perform decrement
	*/
	decrement: function(i/* :int */)/* :int */ {
		i = --i & 0xFF;
		this.setStatusFlags(i);
		return i;
	}

	/**
	* Perform add with carry
	*/
	,operateAdd: function(i/* :int */)/* :void */ {
		// store carry
		var k/* :int */ = this.p & 0x01;
		// store result
		var j/* :int */ = this.a + i + k;
		// turn off czn
		this.p &= 0x3c;
		// set overflow
		this.p |= (~(this.a ^ i) & (this.a ^ i) & 0x80) == 0 ? 0 : 0x40;
		// set carry
		this.p |= j <= 255 ? 0 : 0x01;
		this.a = (j & 0xFF);
		// set zn in this.p
		this.p |= this.znTable[this.a];
	}

	/**
	* Perform subtract with carry
	*/
	,operateSub: function(i/* :int */)/* :void */ {
		// store carry
		var k/* :int */ = ~this.p & 0x01;
		// store result
		var j/* :int */ = this.a - i - k;
		// turn off czn
		this.p &= 0x3C;
		// set overflow
		this.p |= (~(this.a ^ i) & (this.a ^ i) & 0x80) == 0 ? 0 : 0x40;
		// set carry
		this.p |= j < 0 ? 0 : 0x01;
		this.a =(j & 0xFF);
		// set zn in this.p
		this.p |= this.znTable[this.a];
	}

	/**
	* Perform compare function
	*/
	,operateCmp: function(i/* :int */, j/* :int */)/* :void */ {
		var k/* :int */ = i - j;
		this.p &= 0x7C;
		this.p |= k < 0 ? 0 : 0x01;
		this.p |= this.znTable[k & 0xFF];
	}

	/**
	* Handle branch
	*/
	,branch: function(flagNum/* :int */, flagVal/* :boolean */)/* :void */ {
		var offset/* :int */ = this.memory.read(this.pc++);
		if ( ((this.p & flagNum) != 0) == flagVal ) {
			if(offset & 0x80) {
				offset = -(~offset & 0xff) - 1;
			}
			if(((this.pc ^ (this.pc + offset)) & 0x100) != 0) {
				this.cyclesConsumed++;
			}
			this.pc += offset;
			this.cyclesConsumed += 1;
		}
	},

	/**
	* Consume (skip) an undocumented opcode
	* [CW] we should either _really_ skip it or halt the processor
	*/
	usedUndocumentedOpcode: function()/* :void */ {
	}


	// ==========================================================
	//    S T this.a C K   this.a C C E S S   M E T H O D S
	// ==========================================================

	/**
	* Push this.a byte onto the stack
	*/
	,push: function(value/* :int */)/* :void */ {
		this.memory.writeStack(this.sp, value);
		this.sp--;
		this.sp &= 0xFF;
	}

	/**
	* Push this.a word onto the stack
	*/
	,pushWord: function(value/* :int */)/* :void */ {
		this.push((value >> 8) & 0xFF);
		this.push(value & 0xFF);
	}

	/**
	* Pop this.a byte from stack
	*/
	,pop: function()/* :int */ {
		this.sp++;
		this.sp &= 0xFF;
		return this.memory.readStack(this.sp);
	}

	/**
	* Pop this.a word from stack
	*/
	,popWord: function()/* :int */ {
		return this.pop() + this.pop() * 256;
	}


	// ==========================================================
	//    D I S this.a S S E M B L E R
	// ==========================================================

	,disassemble: function(address/* :int */, instructionCount/* :int */, dumpAdr/* :boolean */, dumpHex/* :boolean */)/* :String */ {
		var ret/* :String */ = "";

		if (typeof instructionCount == 'undefined') instructionCount = 1;
		if (typeof dumpAdr == 'undefined') dumpAdr = true;
		if (typeof dumpHex == 'undefined') dumpHex = true;

		for(var i/* :int */ = 1; i <= instructionCount; i++) {
			var d/* :String */ = "";
			var argument/* :int */ = 0;
			var opcode/* :int */ = this.memory.read(address);
			var opcodeInfo/* :CPUOpcodeInfo */ = this.opcodes[opcode];
			if(i > 1) {
				d += "\n";
			}
			if(dumpAdr) {
				d += nl.kingsquare.core.misc.Convert.toHex(address, 4) + ":  ";
			}
			address++;
			if(dumpHex) {
				var lo/* :int */;
				var hex/* :String */ = "";
				d += nl.kingsquare.core.misc.Convert.toHex(opcode, 2) + " ";
				switch(opcodeInfo.len) {
					case 1:
						hex = "       ";
						break;
					case 2:
						lo = this.memory.read(address++);
						argument = lo;
						hex = nl.kingsquare.core.misc.Convert.toHex(lo, 2) + "     ";
						break;
					case 3:
						lo = this.memory.read(address++);
						var hi/* :int */ = this.memory.read(address++);
						argument = lo + hi * 256;
						hex = nl.kingsquare.core.misc.Convert.toHex(lo, 2) + " " + nl.kingsquare.core.misc.Convert.toHex(hi, 2) + "  ";
						break;
				}
				d += hex;
			}
			var mnemo/* :String */ = opcodeInfo.mnemo;
			if(opcodeInfo.len == 2) {
				mnemo = mnemo.split("aa").join(nl.kingsquare.core.misc.Convert.toHex(argument, 2));
			} else if(opcodeInfo.len == 3) {
				mnemo = mnemo.split("aaaa").join(nl.kingsquare.core.misc.Convert.toHex(argument, 4));
			}
			d += mnemo;
			ret += d.toUpperCase();
		}
		return ret;
	}


	// ==========================================================
	//    C L this.a S S   I N I T I this.a L I Z this.a T I O N
	// ==========================================================

	,getOpcodeTable: function()/* :Array */ {
		var self = this;
		return [
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 1, function(address) { return self.opBRK(address); },    null,        "brk"),         // 00
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opORA(address); }, function() { return self.byIndirectX(); }, "ora ($aa,x)"), // 01
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 02
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opASO(address); }, function() { return self.byIndirectX(); }, "aso ($aa,x)"), // 03
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 04
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opORA(address); }, function() { return self.byZeroPage(); },  "ora $aa"),     // 05
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opASL(address); }, function() { return self.byZeroPage(); },  "asl $aa"),     // 06
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opASO(address); }, function() { return self.byZeroPage(); },  "aso $aa"),     // 07
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 1, function(address) { return self.opPHP(address); },    null,        "php"),         // 08
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opORA(address); }, function() { return self.byImmediate(); }, "ora #$aa"),    // 09
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opASL_A(address); },  null,        "asl a"),       // 0a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opANC(address); }, function() { return self.byImmediate(); }, "anc #$aa"),    // 0b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // 0c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opORA(address); }, function() { return self.byAbsolute(); },  "ora $aaaa"),   // 0d
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opASL(address); }, function() { return self.byAbsolute(); },  "asl $aaaa"),   // 0e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opASO(address); }, function() { return self.byAbsolute(); },  "aso $aaaa"),   // 0f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBPL(address); }, function() { return self.byZeroPage(); },  "bpl $aa"),     // 10
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opORA(address); }, function() { return self.byIndirectY(); }, "ora ($aa),y"), // 11
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 12
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opASO(address); }, function() { return self.byIndirectY(); }, "aso ($aa),y"), // 13
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 14
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opORA(address); }, function() { return self.byZeroPageX(); }, "ora $aa,x"),   // 15
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opASL(address); }, function() { return self.byZeroPageX(); }, "asl $aa,x"),   // 16
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opASO(address); }, function() { return self.byZeroPageX(); }, "aso $aa,x"),   // 17
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opCLC(address); },    null,        "clc"),         // 18
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opORA(address); }, function() { return self.byAbsoluteY(); }, "ora $aaaa,y"), // 19
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // 1a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opASO(address); }, function() { return self.byAbsoluteY(); }, "aso $aaaa,y"), // 1b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // 1c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opORA(address); }, function() { return self.byAbsoluteX(); }, "ora $aaaa,x"), // 1d was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opASL(address); }, function() { return self.byAbsoluteX(); }, "asl $aaaa,x"), // 1e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opASO(address); }, function() { return self.byAbsoluteX(); }, "aso $aaaa,x"), // 1f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opJSR(address); }, function() { return self.byAbsolute(); },  "jsr $aaaa"),   // 20
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opAND(address); }, function() { return self.byIndirectX(); }, "and ($aa,x)"), // 21
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 22
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opRLA(address); }, function() { return self.byIndirectX(); }, "rla ($aa,x)"), // 23
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opBIT(address); }, function() { return self.byZeroPage(); },  "bit $aa"),     // 24
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opAND(address); }, function() { return self.byZeroPage(); },  "and $aa"),     // 25
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opROL(address); }, function() { return self.byZeroPage(); },  "rol $aa"),     // 26
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opRLA(address); }, function() { return self.byZeroPage(); },  "rla $aa"),     // 27
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opPLP(address); },    null,        "plp"),         // 28
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opAND(address); }, function() { return self.byImmediate(); }, "and #$aa"),    // 29
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opROL_A(address); },  null,        "rol a"),       // 2a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opANC(address); }, function() { return self.byImmediate(); }, "anc #$aa"),    // 2b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opBIT(address); }, function() { return self.byAbsolute(); },  "bit $aaaa"),   // 2c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opAND(address); }, function() { return self.byAbsolute(); },  "and $aaaa"),   // 2d
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opROL(address); }, function() { return self.byAbsolute(); },  "rol $aaaa"),   // 2e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opRLA(address); }, function() { return self.byAbsolute(); },  "rla $aaaa"),   // 2f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBMI(address); }, function() { return self.byZeroPage(); },  "bmi $aa"),     // 30
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opAND(address); }, function() { return self.byIndirectY(); }, "and ($aa),y"), // 31
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 32
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opRLA(address); }, function() { return self.byIndirectY(); }, "rla ($aa),y"), // 33
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 34
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opAND(address); }, function() { return self.byZeroPageX(); }, "and $aa,x"),   // 35
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opROL(address); }, function() { return self.byZeroPageX(); }, "rol $aa,x"),   // 36
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opRLA(address); }, function() { return self.byZeroPageX(); }, "rla $aa,x"),   // 37
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSEC(address); },    null,        "sec"),         // 38
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opAND(address); }, function() { return self.byAbsoluteY(); }, "and $aaaa,y"), // 39
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // 3a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opRLA(address); }, function() { return self.byAbsoluteY(); }, "rla $aaaa,y"), // 3b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // 3c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opAND(address); }, function() { return self.byAbsoluteX(); }, "and $aaaa,x"), // 3d was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opROL(address); }, function() { return self.byAbsoluteX(); }, "rol $aaaa,x"), // 3e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opRLA(address); }, function() { return self.byAbsoluteX(); }, "rla $aaaa,x"), // 3f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 1, function(address) { return self.opRTI(address); },    null,        "rti"),         // 40 was 4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opEOR(address); }, function() { return self.byIndirectX(); }, "eor ($aa,x)"), // 41
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 42
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opLSE(address); }, function() { return self.byIndirectX(); }, "lse ($aa,x)"), // 43
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 44
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opEOR(address); }, function() { return self.byZeroPage(); },  "eor $aa"),     // 45
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opLSR(address); }, function() { return self.byZeroPage(); },  "lsr $aa"),     // 46
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opLSE(address); }, function() { return self.byZeroPage(); },  "lse $aa"),     // 47
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 1, function(address) { return self.opPHA(address); },    null,        "pha"),         // 48
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opEOR(address); }, function() { return self.byImmediate(); }, "eor #$aa"),    // 49
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opLSR_A(address); },  null,        "lsr a"),       // 4a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opALR(address); }, function() { return self.byImmediate(); }, "alr #$aa"),    // 4b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 3, function(address) { return self.opJMP(address); }, function() { return self.byAbsolute(); },  "jmp $aaaa"),   // 4c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opEOR(address); }, function() { return self.byAbsolute(); },  "eor $aaaa"),   // 4d was 6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opLSR(address); }, function() { return self.byAbsolute(); },  "lsr $aaaa"),   // 4e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opLSE(address); }, function() { return self.byAbsolute(); },  "lse $aaaa"),   // 4f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBVC(address); }, function() { return self.byZeroPage(); },  "bvc $aa"),     // 50
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opEOR(address); }, function() { return self.byIndirectY(); }, "eor ($aa),y"), // 51
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 52
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opLSE(address); }, function() { return self.byIndirectY(); }, "lse ($aa),y"), // 53
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 54
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opEOR(address); }, function() { return self.byZeroPageX(); }, "eor $aa,x"),   // 55
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opLSR(address); }, function() { return self.byZeroPageX(); }, "lsr $aa,x"),   // 56
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opLSE(address); }, function() { return self.byZeroPageX(); }, "lse $aa,x"),   // 57
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opCLI(address); },    null,        "cli"),         // 58
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opEOR(address); }, function() { return self.byAbsoluteY(); }, "eor $aaaa,y"), // 59
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // 5a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opLSE(address); }, function() { return self.byAbsoluteY(); }, "lse $aaaa,y"), // 5b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // 5c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opEOR(address); }, function() { return self.byAbsoluteX(); }, "eor $aaaa,x"), // 5d was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opLSR(address); }, function() { return self.byAbsoluteX(); }, "lsr $aaaa,x"), // 5e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opLSE(address); }, function() { return self.byAbsoluteX(); }, "lse $aaaa,x"), // 5f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 1, function(address) { return self.opRTS(address); },    null,        "rts"),         // 60 was 4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opADC(address); }, function() { return self.byIndirectX(); }, "adc ($aa,x)"), // 61
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 62
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opRRA(address); }, function() { return self.byIndirectX(); }, "rra ($aa,x)"), // 63
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 64
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opADC(address); }, function() { return self.byZeroPage(); },  "adc $aa"),     // 65
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opROR(address); }, function() { return self.byZeroPage(); },  "ror $aa"),     // 66
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opRRA(address); }, function() { return self.byZeroPage(); },  "rra $aa"),     // 67
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opPLA(address); },    null,        "pla"),         // 68
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opADC(address); }, function() { return self.byImmediate(); }, "adc #$aa"),    // 69
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opROR_A(address); },  null,        "ror a"),       // 6a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opARR(address); }, function() { return self.byImmediate(); }, "arr #$aa"),    // 6b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opJMP(address); }, function() { return self.byIndirect(); },  "jmp ($aaaa)"), // 6c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opADC(address); }, function() { return self.byAbsolute(); },  "adc $aaaa"),   // 6d
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opROR(address); }, function() { return self.byAbsolute(); },  "ror $aaaa"),   // 6e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opRRA(address); }, function() { return self.byAbsolute(); },  "rra $aaaa"),   // 6f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opBVS(address); }, function() { return self.byZeroPage(); },  "bvs $aa"),     // 70
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opADC(address); }, function() { return self.byIndirectY(); }, "adc ($aa),y"), // 71
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 72
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opRRA(address); }, function() { return self.byIndirectY(); }, "rra ($aa),y"), // 73
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 74
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opADC(address); }, function() { return self.byZeroPageX(); }, "adc $aa,x"),   // 75
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opROR(address); }, function() { return self.byZeroPageX(); }, "ror $aa,x"),   // 76
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opRRA(address); }, function() { return self.byZeroPageX(); }, "rra $aa,x"),   // 77
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSEI(address); },    null,        "sei"),         // 78
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opADC(address); }, function() { return self.byAbsoluteY(); }, "adc $aaaa,y"), // 79
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // 7a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opRRA(address); }, function() { return self.byAbsoluteY(); }, "rra $aaaa,y"), // 7b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // 7c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opADC(address); }, function() { return self.byAbsoluteX(); }, "adc $aaaa,x"), // 7d was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opROR(address); }, function() { return self.byAbsoluteX(); }, "ror $aaaa,x"), // 7e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opRRA(address); }, function() { return self.byAbsoluteX(); }, "rra $aaaa,x"), // 7f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 80
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opSTA(address); }, function() { return self.byIndirectX(); }, "sta ($aa,x)"), // 81
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 82
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opAXS(address); }, function() { return self.byIndirectX(); }, "axs ($aa,x)"), // 83
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opSTY(address); }, function() { return self.byZeroPage(); },  "sty $aa"),     // 84
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opSTA(address); }, function() { return self.byZeroPage(); },  "sta $aa"),     // 85
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opSTX(address); }, function() { return self.byZeroPage(); },  "stx $aa"),     // 86
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opAXS(address); }, function() { return self.byZeroPage(); },  "axs $aa"),     // 87
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opDEY(address); },    null,        "dey"),         // 88
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // 89
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTXA(address); },    null,        "txa"),         // 8a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opXAA(address); }, function() { return self.byImmediate(); }, "xaa #$aa"),    // 8b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSTY(address); }, function() { return self.byAbsolute(); },  "sty $aaaa"),   // 8c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSTA(address); }, function() { return self.byAbsolute(); },  "sta $aaaa"),   // 8d
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSTX(address); }, function() { return self.byAbsolute(); },  "stx $aaaa"),   // 8e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opAXS(address); }, function() { return self.byAbsolute(); },  "axs $aaaa"),   // 8f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBCC(address); }, function() { return self.byZeroPage(); },  "bcc $aa"),     // 90
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opSTA(address); }, function() { return self.byIndirectY(); }, "sta ($aa),y"), // 91
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // 92
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opAXA(address); }, function() { return self.byIndirectY(); }, "axa ($aa),y"), // 93
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opSTY(address); }, function() { return self.byZeroPageX(); }, "sty $aa,x"),   // 94
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opSTA(address); }, function() { return self.byZeroPageX(); }, "sta $aa,x"),   // 95
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opSTX(address); }, function() { return self.byZeroPageY(); }, "stx $aa,y"),   // 96
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opAXS(address); }, function() { return self.byZeroPageY(); }, "axs $aa,y"),   // 97
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTYA(address); },    null,        "tya"),         // 98
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opSTA(address); }, function() { return self.byAbsoluteY(); }, "sta $aaaa,y"), // 99
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTXS(address); },    null,        "txs"),         // 9a
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opTAS(address); }, function() { return self.byAbsoluteY(); }, "tas $aaaa,y"), // 9b
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opSAY(address); }, function() { return self.byAbsoluteX(); }, "say $aaaa,x"), // 9c
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opSTA(address); }, function() { return self.byAbsoluteX(); }, "sta $aaaa,x"), // 9d
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opXAS(address); }, function() { return self.byAbsoluteY(); }, "xas $aaaa,y"), // 9e
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 3, function(address) { return self.opAXA(address); }, function() { return self.byAbsoluteY(); }, "axa $aaaa,y"), // 9f
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opLDY(address); }, function() { return self.byImmediate(); }, "ldy #$aa"),    // a0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opLDA(address); }, function() { return self.byIndirectX(); }, "lda ($aa,x)"), // a1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opLDX(address); }, function() { return self.byImmediate(); }, "ldx #$aa"),    // a2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opLAX(address); }, function() { return self.byIndirectX(); }, "lax ($aa,x)"), // a3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opLDY(address); }, function() { return self.byZeroPage(); },  "ldy $aa"),     // a4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opLDA(address); }, function() { return self.byZeroPage(); },  "lda $aa"),     // a5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opLDX(address); }, function() { return self.byZeroPage(); },  "ldx $aa"),     // a6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opLAX(address); }, function() { return self.byZeroPage(); },  "lax $aa"),     // a7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTAY(address); },    null,        "tay"),         // a8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opLDA(address); }, function() { return self.byImmediate(); }, "lda #$aa"),    // a9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTAX(address); },    null,        "tax"),         // aa
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opOAL(address); }, function() { return self.byImmediate(); }, "oal #$aa"),    // ab
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDY(address); }, function() { return self.byAbsolute(); },  "ldy $aaaa"),   // ac
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDA(address); }, function() { return self.byAbsolute(); },  "lda $aaaa"),   // ad
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDX(address); }, function() { return self.byAbsolute(); },  "ldx $aaaa"),   // ae
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLAX(address); }, function() { return self.byAbsolute(); },  "lax $aaaa"),   // af
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBCS(address); }, function() { return self.byZeroPage(); },  "bcs $aa"),     // b0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opLDA(address); }, function() { return self.byIndirectY(); }, "lda ($aa),y"), // b1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // b2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opLAX(address); }, function() { return self.byIndirectY(); }, "lax ($aa),y"), // b3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opLDY(address); }, function() { return self.byZeroPageX(); }, "ldy $aa,x"),   // b4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opLDA(address); }, function() { return self.byZeroPageX(); }, "lda $aa,x"),   // b5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opLDX(address); }, function() { return self.byZeroPageY(); }, "ldx $aa,y"),   // b6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opLAX(address); }, function() { return self.byZeroPageY(); }, "lax $aa,y"),   // b7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opCLV(address); },    null,        "clv"),         // b8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDA(address); }, function() { return self.byAbsoluteY(); }, "lda $aaaa,y"), // b9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opTSX(address); },    null,        "tsx"),         // ba
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLAS(address); }, function() { return self.byIndirectY(); }, "las $aaaa,y"), // bb
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDY(address); }, function() { return self.byAbsoluteX(); }, "ldy $aaaa,x"), // bc
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDA(address); }, function() { return self.byAbsoluteX(); }, "lda $aaaa,x"), // bd
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLDX(address); }, function() { return self.byAbsoluteY(); }, "ldx $aaaa,y"), // be
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opLAX(address); }, function() { return self.byAbsoluteY(); }, "lax $aaaa,y"), // bf
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opCPY(address); }, function() { return self.byImmediate(); }, "cpy #$aa"),    // c0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opCMP(address); }, function() { return self.byIndirectX(); }, "cmp ($aa,x)"), // c1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // c2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opDCM(address); }, function() { return self.byIndirectX(); }, "dcm ($aa,x)"), // c3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opCPY(address); }, function() { return self.byZeroPage(); },  "cpy $aa"),     // c4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opCMP(address); }, function() { return self.byZeroPage(); },  "cmp $aa"),     // c5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opDEC(address); }, function() { return self.byZeroPage(); },  "dec $aa"),     // c6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opDCM(address); }, function() { return self.byZeroPage(); },  "dcm $aa"),     // c7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opINY(address); },    null,        "iny"),         // c8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opCMP(address); }, function() { return self.byImmediate(); }, "cmp #$aa"),    // c9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opDEX(address); },    null,        "dex"),         // ca
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opSAX(address); }, function() { return self.byImmediate(); }, "sax #$aa"),    // cb
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opCPY(address); }, function() { return self.byAbsolute(); },  "cpy $aaaa"),   // cc
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opCMP(address); }, function() { return self.byAbsolute(); },  "cmp $aaaa"),   // cd
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opDEC(address); }, function() { return self.byAbsolute(); },  "dec $aaaa"),   // ce
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opDCM(address); }, function() { return self.byAbsolute(); },  "dcm $aaaa"),   // cf
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBNE(address); }, function() { return self.byZeroPage(); },  "bne $aa"),     // d0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opCMP(address); }, function() { return self.byIndirectY(); }, "cmp ($aa),y"), // d1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // d2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opDCM(address); }, function() { return self.byIndirectY(); }, "dcm ($aa),y"), // d3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // d4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opCMP(address); }, function() { return self.byZeroPageX(); }, "cmp $aa,x"),   // d5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opDEC(address); }, function() { return self.byZeroPageX(); }, "dec $aa,x"),   // d6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opDCM(address); }, function() { return self.byZeroPageX(); }, "dcm $aa,x"),   // d7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opCLD(address); },    null,        "cld"),         // d8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opCMP(address); }, function() { return self.byAbsoluteY(); }, "cmp $aaaa,y"), // d9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // da
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opDCM(address); }, function() { return self.byAbsoluteY(); }, "dcm $aaaa,y"), // db
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // dc
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opCMP(address); }, function() { return self.byAbsoluteX(); }, "cmp $aaaa,x"), // dd was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opDEC(address); }, function() { return self.byAbsoluteX(); }, "dec $aaaa,x"), // de
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opDCM(address); }, function() { return self.byAbsoluteX(); }, "dcm $aaaa,x"), // df
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opCPX(address); }, function() { return self.byImmediate(); }, "cpx #$aa"),    // e0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opSBC(address); }, function() { return self.byIndirectX(); }, "sbc ($aa,x)"), // e1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // e2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opINS(address); }, function() { return self.byIndirectX(); }, "ins ($aa,x)"), // e3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opCPX(address); }, function() { return self.byZeroPage(); },  "cpx $aa"),     // e4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(3, 2, function(address) { return self.opSBC(address); }, function() { return self.byZeroPage(); },  "sbc $aa"),     // e5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opINC(address); }, function() { return self.byZeroPage(); },  "inc $aa"),     // e6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opINS(address); }, function() { return self.byZeroPage(); },  "ins $aa"),     // e7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opINX(address); },    null,        "inx"),         // e8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opSBC(address); }, function() { return self.byImmediate(); }, "sbc #$aa"),    // e9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // ea
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opSBC(address); }, function() { return self.byImmediate(); }, "sbc #$aa"),    // eb
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opCPX(address); }, function() { return self.byAbsolute(); },  "cpx $aaaa"),   // ec
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSBC(address); }, function() { return self.byAbsolute(); },  "sbc $aaaa"),   // ed
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opINC(address); }, function() { return self.byAbsolute(); },  "inc $aaaa"),   // ee
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 3, function(address) { return self.opINS(address); }, function() { return self.byAbsolute(); },  "ins $aaaa"),   // ef
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 2, function(address) { return self.opBEQ(address); }, function() { return self.byZeroPage(); },  "beq $aa"),     // f0
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 2, function(address) { return self.opSBC(address); }, function() { return self.byIndirectY(); }, "sbc ($aa),y"), // f1
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opHLT(address); },    null,        "hlt"),         // f2
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(8, 2, function(address) { return self.opINS(address); }, function() { return self.byIndirectY(); }, "ins ($aa),y"), // f3
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 1, function(address) { return self.opSKB(address); },    null,        "skb"),         // f4
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 2, function(address) { return self.opSBC(address); }, function() { return self.byZeroPageX(); }, "sbc $aa,x"),   // f5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opINC(address); }, function() { return self.byZeroPageX(); }, "inc $aa,x"),   // f6
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(6, 2, function(address) { return self.opINS(address); }, function() { return self.byZeroPageX(); }, "ins $aa,x"),   // f7
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opSED(address); },    null,        "sed"),         // f8
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSBC(address); }, function() { return self.byAbsoluteY(); }, "sbc $aaaa,y"), // f9
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(2, 1, function(address) { return self.opNOP(address); },    null,        "nop"),         // fa
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opINS(address); }, function() { return self.byAbsoluteY(); }, "ins $aaaa,y"), // fb
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(5, 1, function(address) { return self.opSKW(address); },    null,        "skw"),         // fc
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(4, 3, function(address) { return self.opSBC(address); }, function() { return self.byAbsoluteX(); }, "sbc $aaaa,x"), // fd was 5
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opINC(address); }, function() { return self.byAbsoluteX(); }, "inc $aaaa,x"), // fe
			new nl.kingsquare.core.cpu.CPUOpcodeInfo(7, 3, function(address) { return self.opINS(address); }, function() { return self.byAbsoluteX(); }, "ins $aaaa,x")  // ff
		];
	}

	,getTwoComplementTable: function() {
		return [
			002, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 000, 000,
			000, 000, 000, 000, 000, 000, 000, 000, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128, 128, 128, 128, 128,
			128, 128, 128, 128, 128, 128
		];
	}
});