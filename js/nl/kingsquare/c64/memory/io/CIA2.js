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

nl.kingsquare.c64.memory.io.CIA2 = nl.kingsquare.core.memory.io.IOHandler.extend({
	init: function(debugFlag/*:Boolean*/) {
		this.cname = 'CIA2';
		if (typeof debugFlag == 'undefined') debugFlag = false;
		this._super(debugFlag);
		this.arr[2] = 0x3f; // init DRA
	},
	updateTimers: function(cycles/*:uint*/)/*:void*/ {
	},
	getDataPortA: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA2] get PRA: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setDataPortA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		this.vicBaseAddr = (~value & 0x03) << 14;
		if(this.debug) this.debugMessage("[CIA2] set PRA: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " vicbase:" + nl.kingsquare.core.misc.Convert.toHex(this.vicBaseAddr, 4));
	},
	getDataPortB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[CIA2] get PRB: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return (~this.arr[3] & 0xff) | (this.arr[3] & this.arr[index]);
	},
	setDataPortB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.arr[index] = value;
		if(this.debug) this.debugMessage("[CIA2] set PRB: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
	},
	setLoTimerA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.timerLatchA = (this.timerLatchA & 0xff00) | value;
		if(this.debug) this.debugMessage("[CIA2] set TAL: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer A Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.timerLatchA, 4) + ")");
	},
	setHiTimerA: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.timerLatchA = (this.timerLatchA & 0x00ff) | (value * 256);
		if(this.debug) this.debugMessage("[CIA2] set TAH: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer A Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.timerLatchA, 4) + ")");
	},
	setLoTimerB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.timerLatchB = (this.timerLatchB & 0xff00) | value;
		if(this.debug) this.debugMessage("[CIA2] set TBL: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer B Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.timerLatchB, 4) + ")");
	},
	setHiTimerB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.timerLatchB = (this.timerLatchB & 0x00ff) | (value * 256);
		if(this.debug) this.debugMessage("[CIA2] set TBH: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " (Timer B Latch: #$" + nl.kingsquare.core.misc.Convert.toHex(this.timerLatchB, 4) + ")");
	},
	initHandlers: function()/*:void*/ {
		var self = this;
		this.handlers = [
			// the CIA2 chip has 16 registers:
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDataPortA(index); }, function(index, value) { self.setDataPortA(index, value); }), // 00
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDataPortB(index); }, function(index, value) { self.setDataPortB(index, value); }), // 01
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 02
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 03
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setLoTimerA(index, value); }), // 04
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setHiTimerA(index, value); }), // 05
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setLoTimerB(index, value); }), // 06
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setHiTimerB(index, value); }), // 07
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 08
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 09
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 0e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); })  // 0f
		];
	}
});