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

nl.kingsquare.c64.memory.io.SID = nl.kingsquare.core.memory.io.IOHandler.extend({
	init: function SID(debugFlag/*:Boolean*/) {
		this.cname = 'SID';
		if (typeof debugFlag == 'undefined') debugFlag = false;
		this._super(debugFlag);
		this.osc1Frq = 0;
		this.osc1PulseWidth = 0;
		this.osc2Frq = 0;
		this.osc2PulseWidth = 0;
		this.osc3Frq = 0;
		this.osc3PulseWidth = 0;
	},

		// The first 24 registers are write-only if i read right
		// Voice 1
	setFreqControlLow1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 F LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1Frq = (this.osc1Frq & 0xff00) | value;
		this.arr[index] = value;
	},
	setFreqControlHigh1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 F HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1Frq = (this.osc1Frq & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setPulseWaveformLow1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 PW LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1PulseWidth = (this.osc1PulseWidth & 0xff00) | value;
		this.arr[index] = value;
	},
	setPulseWaveformHigh1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 PW HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1PulseWidth = (this.osc1PulseWidth & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setControl1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 C " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1Control = value;
		this.arr[index] = value;
	},
	setAttackDecay1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 AD " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1AttackDecay = value;
		this.arr[index] = value;
	},
	setSustainRelease1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc1 SR " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc1SustainRelease = value;
		this.arr[index] = value;
	},
	// Voice 2

	setFreqControlLow2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 F LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2Frq = (this.osc2Frq & 0xff00) | value;
		this.arr[index] = value;
	},
	setFreqControlHigh2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 F HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2Frq = (this.osc2Frq & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setPulseWaveformLow2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 PW LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2PulseWidth = (this.osc2PulseWidth & 0xff00) | value;
		this.arr[index] = value;
	},
	setPulseWaveformHigh2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 PW HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2PulseWidth = (this.osc2PulseWidth & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setControl2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 C " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2Control = value;
		this.arr[index] = value;
	},
	setAttackDecay2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 AD " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2AttackDecay = value;
		this.arr[index] = value;
	},
	setSustainRelease2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc2 SR " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc2SustainRelease = value;
		this.arr[index] = value;
	},
	// Voice 3
	setFreqControlLow3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 F LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3Frq = (this.osc3Frq & 0xff00) | value;
		this.arr[index] = value;
	},
	setFreqControlHigh3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 F HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3Frq = (this.osc3Frq & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setPulseWaveformLow3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 PW LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3PulseWidth = (this.osc3PulseWidth & 0xff00) | value;
		this.arr[index] = value;
	},
	setPulseWaveformHigh3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 PW HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3PulseWidth = (this.osc3PulseWidth & 0x00ff) | (value << 8);
		this.arr[index] = value;
	},
	setControl3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 C " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3Control = value;
		this.arr[index] = value;
	},
	setAttackDecay3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 AD " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3AttackDecay = value;
		this.arr[index] = value;
	},
	setSustainRelease3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] Osc3 SR " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.osc3SustainRelease = value;
		this.arr[index] = value;
	},

	// etc

	setFreqCutoffLow: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] FC LO " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.arr[index] = value;
	},
	setFreqCutoffHigh: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] FC HI " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.arr[index] = value;
	},
	setResonanceControl: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] RES " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.filtRes = value;
		this.arr[index] = value;
	},
	setVolumeFilterSelect: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(this.debug) this.debugMessage("[SID] MODE / VOL " + nl.kingsquare.core.misc.Convert.toHex(value));
		this.modVol = value;
		this.arr[index] = value;
	},

	// I'm unsure if these must have setters too

	getGamePaddle1: function(index/*:int*/)/*:int*/ {
		return this.arr[index];
	},
	getGamePaddle2: function(index/*:int*/)/*:int*/ {
		return this.arr[index];
	},
	getOscillator3: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[SID] get OSC3 " + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		osc3 = Math.floor(Math.random() * 256);
		this.arr[index] = osc3;
		return this.arr[index];
	},
	getEnvelopeGenerator3: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[SID] get ENV 3 " + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		this.arr[index] = env3;
		return this.arr[index];
	},
	initHandlers: function() {
		var self = this;
		this.handlers = [
			// the SID chip has 32 registers:
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlLow1(index, value); }), // 00
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlHigh1(index, value); }), // 01
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformLow1(index, value); }), // 02
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformHigh1(index, value); }), // 03
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setControl1(index, value); }), // 04
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setAttackDecay1(index, value); }), // 05
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setSustainRelease1(index, value); }), // 06
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlLow2(index, value); }), // 07
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlHigh2(index, value); }), // 08
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformLow2(index, value); }), // 09
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformHigh2(index, value); }), // 0a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setControl2(index, value); }), // 0b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setAttackDecay2(index, value); }), // 0c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setSustainRelease2(index, value); }), // 0d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlLow3(index, value); }), // 0e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqControlHigh3(index, value); }),  // 0f
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformLow3(index, value); }), // 10
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setPulseWaveformHigh3(index, value); }), // 11
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setControl3(index, value); }), // 12
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setAttackDecay3(index, value); }), // 13
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setSustainRelease3(index, value); }), // 14
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqCutoffLow(index, value); }), // 15
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setFreqCutoffHigh(index, value); }), // 16
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setResonanceControl(index, value); }), // 17
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setVolumeFilterSelect(index, value); }), // 18
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getGamePaddle1(index); }, function(index, value) { self.setDefault(index, value); }), // 19
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getGamePaddle2(index); }, function(index, value) { self.setDefault(index, value); }), // 1a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getOscillator3(index); }, function(index, value) { self.setDefault(index, value); }), // 1b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getEnvelopeGenerator3(index); }, function(index, value) { self.setDefault(index, value); }), // 1c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // n/c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // n/c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); })  // n/c
		];
	}
});