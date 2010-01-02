/*
 * Copyright notice
 *
 * v0.1 (c) 2010 Tim de Koning - Kingsquare Information Services.  All rights reserved.
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

//CONFIG
var JSC64_BASEPATH = 'js/';

//this should be minified and combined with jquery.jsc64.js one day, for now, lets make it debugable...
var nl = {}, i = 0, dependancies = ['com/nagoon97/BinFileReader.js', 'org/ejohn/Class.js',
		'nl/kingsquare/as3/globalFunctions.js',	'nl/kingsquare/as3/flash/events/EventDispatcher.js',
		'nl/kingsquare/as3/flash/utils.js', 'nl/kingsquare/as3/flash/utils/ByteArray.js', 'nl/kingsquare/as3/flash/utils/Timer.js',
		'nl/kingsquare/as3/flash/geom/Rectangle.js',	'nl/kingsquare/as3/flash/display/BitmapData.js',	'nl/kingsquare/c64/memory/MemoryBankInfo.js',
		'nl/kingsquare/c64/memory/io/VICSpriteInfo.js', 'nl/kingsquare/core/memory/io/IOHandlerInfo.js', 'nl/kingsquare/core/memory/io/IOHandler.js',
		'nl/kingsquare/core/misc/Convert.js', 'nl/kingsquare/core/exceptions/BreakpointException.js', 'nl/kingsquare/c64/memory/io/VIC.js',
		'nl/kingsquare/c64/memory/io/Keyboard.js', 'nl/kingsquare/c64/memory/io/CIA1.js', 'nl/kingsquare/c64/memory/io/CIA2.js',
		'nl/kingsquare/c64/memory/io/SID.js', 'nl/kingsquare/c64/memory/MemoryManager.js', 'nl/kingsquare/c64/screen/Renderer.js',
		'nl/kingsquare/core/cpu/CPU6502.js', 'nl/kingsquare/core/cpu/CPUOpcodeInfo.js'];

nl.kingsquare = {};
nl.kingsquare.debug = false;
nl.kingsquare.c64 = {};
nl.kingsquare.c64.memory = {};
nl.kingsquare.c64.memory.io = {};
nl.kingsquare.c64.screen = {};
nl.kingsquare.core = {};
nl.kingsquare.core.cpu = {};
nl.kingsquare.core.memory = {};
nl.kingsquare.core.memory.io = {};
nl.kingsquare.core.misc = {};
nl.kingsquare.core.exceptions = {};
nl.kingsquare.as3 = {};
nl.kingsquare.as3.flash = {};
nl.kingsquare.as3.flash.utils = {}
nl.kingsquare.as3.flash.events = {}
nl.kingsquare.as3.flash.geom = {}
nl.kingsquare.as3.flash.display = {}

for (var i in dependancies) {
	document.write('<script src="'+ JSC64_BASEPATH+dependancies[i]+'" type="text/javascript"></script>');
};