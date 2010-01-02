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
 */

nl.kingsquare.c64.memory.io.CIA1 = nl.kingsquare.core.memory.io.IOHandler.extend({
	init: function(debugFlag) {
		this.cname = 'CIA1';
		this.irqTriggered/*:Boolean*/ = false;

		// Timer A
		this.taStarted/*:Boolean*/ = false;
		this.taPortBOutput/*:Boolean*/ = false;
		this.taPortBOutputToggle/*:Boolean*/ = false;
		this.taRunMode/*:uint*/ = nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_CONTINUOUS;
		this.taInputMode/*:uint*/ = nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR;
		this.taCounter/*:int*/ = 0;
		this.taLatch/*:int*/ = 0;
		this.taIRQEnabled/*:Boolean*/ = false;
		this.irqTriggered/*:Boolean*/ = false;

		// Timer B
		this.tbStarted/*:Boolean*/ = false;
		this.tbPortBOutput/*:Boolean*/ = false;
		this.tbPortBOutputToggle/*:Boolean*/ = false;
		this.tbRunMode/*:uint*/ = nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_CONTINUOUS;
		this.tbInputMode/*:uint*/ = nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR;
		this.tbCounter/*:int*/ = 0;
		this.tbLatch/*:int*/ = 0;
		this.tbIRQEnabled/*:Boolean*/ = false;
		this.tbIRQTriggered/*:Boolean*/ = false;

		// Time Of Day
		this.todFrequency/*:uint*/ = 60;
		this.todSetAlarmOnWrite/*:Boolean*/ = false;
		this.todTimeSet/*:Number*/ = 0;
		this.todTimeStart/*:Number*/ = 0;
		this.todTimeAlarm/*:Number*/ = 0;
		this.todLatchRead/*:Number*/ = 0;
		this.todLatchWrite/*:Number*/ = 0;
		this.todLatchedRead/*:Boolean*/ = false;
		this.todLatchedWrite/*:Boolean*/ = false;
		this.todIRQEnabled/*:Boolean*/ = false;
		this.todIRQTriggered/*:Boolean*/ = false;

		// Serial Shift
		this.ssIRQEnabled/*:Boolean*/ = false;
		this.ssIRQTriggered/*:Boolean*/ = false;

		// Flag Line
		this.flIRQEnabled/*:Boolean*/ = false;
		this.flIRQTriggered/*:Boolean*/ = false;
		this._super(debugFlag);

		var curDate = new Date();
		this.todTimeStart = this.todTimeSet = curDate.time;
		this.keyboard = new nl.kingsquare.c64.memory.io.Keyboard();
	},
	updateTimerA: function(cycles) {
		if(this.taInputMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR) {
			this.taCounter -= cycles;
			if(this.taCounter <= 0) {
				this.arr[0x0d] |= 0x01;
				if(this.taIRQEnabled) {
					return true;
				}
				this.resetTimerA();
			}
		} else {
			// CNT not supported
		}
		return false;
	},
	resetTimerA: function()/*:void*/ {
		if(this.taIRQEnabled) {
			this.irqTriggered = true;
			this.irqTriggered = true;
			this.arr[0x0d] |= 0x80;
		}
		this.taCounter = this.taLatch;
		if(this.taRunMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT) {
			this.taStarted = false;
			this.arr[0x0e] &= 0x01;
		}
	},
	updateTimerB: function(cycles/*:uint*/, underflow/*:Boolean*/)/*:Boolean*/ {
		switch(this.tbInputMode) {
			case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR:
				this.tbCounter -= cycles;
				if(this.tbCounter <= 0) {
					this.arr[0x0d] |= 0x02;
					if(this.tbIRQEnabled) {
						return true;
					}
					this.resetTimerB();
				}
				break;
			case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA:
				if(underflow) {
					if(--this.tbCounter <= 0) {
						this.arr[0x0d] |= 0x02;
						if(this.tbIRQEnabled) {
							return true;
						}
						this.resetTimerB();
				}
				}
				break;
			case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA_CNT:
				// CNT not supported
				break;
			case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_CNT:
				// CNT not supported
				break;
		}
		return false;
	},
	resetTimerB: function()/*:void*/ {
		if(this.tbIRQEnabled) {
			this.irqTriggered = true;
			this.tbIRQTriggered = true;
			this.arr[0x0d] |= 0x80;
		}
		this.tbCounter = this.tbLatch;
		if(this.tbRunMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT) {
			this.tbStarted = false;
			this.arr[0x0f] &= 0x01;
		}
	},
		/**
		* $DC00 - Data Port A
		*/
	getDataPortA: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 00: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.keyboard.getJoystick2();
	},
	setDataPortA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		if(this.debug) this.debugMessage("[CIA1] set 00: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},
		/**
		* $DC01 - Data Port B
		*/
	getDataPortB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 01: #$" + nl.kingsquare.core.misc.Convert.toHex(this.keyboard.getRows(this.arr[0])));
		return this.keyboard.getRows(this.arr[0]);
	},
	setDataPortB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		if(this.debug) this.debugMessage("[CIA1] set 01: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},
		/**
		* $DC04 - Timer A Low Byte
		*/
	getLoTimerA: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 04: #$" + nl.kingsquare.core.misc.Convert.toHex(this.taCounter & 0x00ff));
		return this.taCounter & 0x00ff;
	},
	setLoTimerA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.taLatch = (this.taLatch & 0xff00) | value;
		if(this.debug) this.debugMessage("[CIA1] set 04: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer A Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.taLatch, 4) + ")");
	},
		/**
		* $DC05 - Timer A High Byte
		*/
	getHiTimerA: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 05: #$" + nl.kingsquare.core.misc.Convert.toHex((this.taCounter & 0xff00) >> 8));
		return (this.taCounter & 0xff00) >> 8;
	},
	setHiTimerA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.taLatch = (this.taLatch & 0x00ff) | (value * 256);
		if(this.debug) this.debugMessage("[CIA1] set 05: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer A Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.taLatch, 4) + ")");
	},
		/**
		* $DC06 - Timer B Low Byte
		*/
	getLoTimerB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 06: #$" + nl.kingsquare.core.misc.Convert.toHex(this.tbCounter & 0x00ff));
		return this.tbCounter & 0x00ff;
	},
	setLoTimerB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.tbLatch = (this.tbLatch & 0xff00) | value;
		if(this.debug) this.debugMessage("[CIA1] set 06: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer B Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.tbLatch, 4) + ")");
	},
		/**
		* $DC07 - Timer B High Byte
		*/
	getHiTimerB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 07: #$" + nl.kingsquare.core.misc.Convert.toHex((this.tbCounter & 0xff00) >> 8));
		return (this.tbCounter & 0xff00) >> 8;
	},
	setHiTimerB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.tbLatch = (this.tbLatch & 0x00ff) | (value * 256);
		if(this.debug) this.debugMessage("[CIA1] set 07: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer B Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.tbLatch, 4) + ")");
	},
		/**
		* $DC08 - Time Of Day, Tenths Of Seconds
		*/
	getTODSeconds10: function(index/*:int*/)/*:int*/ {
		var d;
		if(this.todLatchedRead) {
			this.todLatchedRead = false;
			d = new Date(this.todLatchRead);
		} else {
			d = new Date();
			d = new Date(d.getTime() - this.todTimeStart + this.todTimeSet);
		}
		var value/*:int*/ = nl.kingsquare.core.misc.Convert.toBCD(Math.floor(d.getMilliseconds() / 100));
		if(this.debug) this.debugMessage("[CIA1] get 08: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		return value;
	},
	setTODSeconds10: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.todLatchedWrite) {
		} else {
		}
		if(this.debug) this.debugMessage("[CIA1] set 08: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},

		/**
		* $DC09 - Time Of Day, Seconds
		*/
	getTODSeconds: function(index/*:int*/)/*:int*/ {
		var d/*:Date*/;
		if(this.todLatchedRead) {
			d = new Date(this.todLatchRead);
		} else {
			d = new Date();
			d = new Date(d.getTime() - this.todTimeStart + this.todTimeSet);
		}
		var value/*:int*/ = nl.kingsquare.core.misc.Convert.toBCD(d.getSeconds());
		if(this.debug) this.debugMessage("[CIA1] get 09: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		return value;
	},
	setTODSeconds: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.todLatchedWrite) {
		} else {
		}
		if(this.debug) this.debugMessage("[CIA1] set 09: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},

		/**
		* $DC0A - Time Of Day, Minutes
		*/
	getTODMinutes: function(index/*:int*/)/*:int*/ {
		var d/*:Date*/;
		if(this.todLatchedRead) {
			d = new Date(this.todLatchRead);
		} else {
			d = new Date();
			d = new Date(d.getTime() - this.todTimeStart + this.todTimeSet);
		}
		var value/*:int*/ = nl.kingsquare.core.misc.Convert.toBCD(d.getMinutes());
		if(this.debug) this.debugMessage("[CIA1] get 0A: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		return value;
	},
	setTODMinutes: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.todLatchedWrite) {
		} else {
		}
		if(this.debug) this.debugMessage("[CIA1] set 0A: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},

		/**
		* $DC0B - Time Of Day, Hours
		*/
	getTODHours: function(index/*:int*/)/*:int*/ {
		var d/*:Date*/ = new Date();
		this.todLatchRead = d.getTime() - this.todTimeStart + this.todTimeSet;
		this.todLatchedRead = true;
		d = new Date(this.todLatchRead);
		var value/*:int*/ = nl.kingsquare.core.misc.Convert.toBCD(d.getHours());
		if(this.debug) this.debugMessage("[CIA1] get 0B: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		return value;
	},
	setTODHours: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.todLatchedWrite) {
		} else {
		}
		if(this.debug) this.debugMessage("[CIA1] set 0B: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},

		/**
		* $DC0D - Interrupt Control Register
		*/
	getIRQControlReg: function(index/*:int*/)/*:int*/ {
		var value/*:int*/ = 0;
		if(this.irqTriggered) {
			if(this.irqTriggered) { value |= 0x01; }
			if(this.tbIRQTriggered) { value |= 0x02; }
			if(this.todIRQTriggered) { value |= 0x04; }
			if(this.ssIRQTriggered) { value |= 0x08; }
			if(this.flIRQTriggered) { value |= 0x10; }
			value |= 0x80;
		}
		if(this.debug) {
			this.debugMessage(
				"[CIA1] get 0D: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (" +
				((this.irqTriggered) ? "" : "no irq ") +
				((this.irqTriggered) ? "TA " : "") +
				((this.tbIRQTriggered) ? "TB " : "") +
				((this.todIRQTriggered) ? "TOD " : "") +
				((this.ssIRQTriggered) ? "SS " : "") +
				((this.flIRQTriggered) ? "FL " : "") +
				"triggered)"
			);
		}
		return value;
	},
	setIRQControlReg: function(index/*:int*/, value/*:int*/)/*:void*/ {
		// bit 7 decides if the other flags are cleared (0) or set (1)
		var newBitValue/*:Boolean*/ = ((value & 0x80) != 0);
		// bits 0-4: if set, the corresponding flag is cleared or set (depending on bit 7)
		if((value & 0x01) != 0) { this.taIRQEnabled = newBitValue; }
		if((value & 0x02) != 0) { this.tbIRQEnabled = newBitValue; }
		if((value & 0x04) != 0) { this.todIRQEnabled = newBitValue; }
		if((value & 0x08) != 0) { this.ssIRQEnabled = newBitValue; }
		if((value & 0x10) != 0) { this.flIRQEnabled = newBitValue; }
		if(this.debug) {
			this.debugMessage(
				"[CIA1] set 0D: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (" +
				"TA: " + this.taIRQEnabled + ", " +
				"TB: " + this.tbIRQEnabled + ", " +
				"TOD: " + this.todIRQEnabled + ", " +
				"SS: " + this.ssIRQEnabled + ", " +
				"FL: " + this.flIRQEnabled + ")"
			);
		}
	},

	/**
	* $DC0E - Control Register A
	*/
	getControlA: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 0E: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setControlA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		this.taStarted = (value & 0x01) != 0;
		this.taPortBOutput = (value & 0x02) != 0;
		this.taPortBOutputToggle = (value & 0x04) != 0;
		this.taRunMode = (value & 0x08) != 0 ? nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT : nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_CONTINUOUS;
		this.taInputMode = (value & 0x20) == 0 ? nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR : nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_CNT;
		if((value & 0x10) != 0) {
			this.taCounter = this.taLatch;
		}
		if(this.debug) {
			this.debugMessage(
				"[CIA1] set 0E: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (" +
				(this.tbStarted ? "Timer A runs. " : "Timer A stopped. ") +
				"mode:" + (this.taRunMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT ? "oneshot" : "cont") + ", " +
				"input:" + (this.taInputMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR ? "int" : "ext") + ", " +
				"portb:" + this.taPortBOutput + "/" + (this.taPortBOutputToggle ? "toggle" : "tick") + ", " +
				(((value & 0x10) != 0) ? "counter set to #$" + nl.kingsquare.core.misc.Convert.toHex(this.taLatch, 4) : "counter not set") + ")"
			);
		}
	},
	/**
	* $DC0F - Control Register B
		*/
	getControlB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA1] get 0F: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setControlB: function( index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		this.tbStarted = (value & 0x01) != 0;
		this.tbPortBOutput = (value & 0x02) != 0;
		this.tbPortBOutputToggle = (value & 0x04) != 0;
		this.tbRunMode = (value & 0x08) != 0 ? nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT : nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_CONTINUOUS;
		this.tbInputMode = (value & 0x60) >> 5;
		this.todSetAlarmOnWrite = (value & 0x80) != 0;
		if((value & 0x10) != 0) {
			this.tbCounter = this.tbLatch;
		}
		if(this.debug) {
			var dInputMode/*:String*/ = "";
			switch(this.tbInputMode) {
				case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR: dInputMode = "int"; break;
				case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_CNT: dInputMode = "ext"; break;
				case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA: dInputMode = "timera"; break;
				case nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA_CNT: dInputMode = "timera+ext"; break;
			}
			this.debugMessage(
				"[CIA1] set 0F: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (" +
				(this.tbStarted ? "Timer B runs. " : "Timer B stopped. ") +
				"mode:" + (this.tbRunMode == nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT ? "oneshot" : "cont") + ", " +
				"input:" + dInputMode + ", " +
				"portb:" + this.tbPortBOutput + "/" + (this.tbPortBOutputToggle ? "toggle" : "tick") + ", " +
				"todwrite:" + (this.todSetAlarmOnWrite ? "setalarm" : "setclock") + ", " +
				(((value & 0x10) != 0) ? "counter set to #$" + nl.kingsquare.core.misc.Convert.toHex(this.tbLatch, 4) : "counter not set") + ")"
			);
		}
	},
	initHandlers: function()/*:void*/ {
		var self = this;
		this.handlers = [
			// the CIA1 chip has 16 registers:
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDataPortA(index); }, function(index, value) { self.setDataPortA(index, value); }), // 00
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDataPortB(index); }, function(index, value) { self.setDataPortB(index, value); }), // 01
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 02
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 03
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setLoTimerA(index, value); }), // 04
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setHiTimerA(index, value); }), // 05
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setLoTimerB(index, value); }), // 06
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setHiTimerB(index, value); }), // 07
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getTODSeconds10(index); }, function(index, value) { self.setTODSeconds10(index, value); }), // 08
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getTODSeconds(index); }, function(index, value) { self.setTODSeconds(index, value); }), // 09
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getTODMinutes(index); }, function(index, value) { self.setTODMinutes(index, value); }), // 0a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getTODHours(index); }, function(index, value) { self.setTODHours(index, value); }), // 0b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getIRQControlReg(index); }, function(index, value) { self.setIRQControlReg(index, value); }), // 0d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getControlA(index); }, function(index, value) { self.setControlA(index, value); }), // 0e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getControlB(index); }, function(index, value) { self.setControlB(index, value); })  // 0f
		];
	}
});

nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_ONESHOT = 0;
nl.kingsquare.c64.memory.io.CIA1.TIMER_RUNMODE_CONTINUOUS = 1;
nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_PROCESSOR = 0;
nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_CNT = 1;
nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA = 2;
nl.kingsquare.c64.memory.io.CIA1.TIMER_INPUTMODE_TIMERA_CNT = 3;