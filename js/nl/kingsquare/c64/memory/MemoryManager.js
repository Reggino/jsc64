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

nl.kingsquare.c64.memory.MemoryManager = Class.extend({
    debugMemBanks: [
		"RAM", "VIC", "CIA1", "CIA2", "SID", "KERNAL", "BASIC", "CHAR"
	],

	/**
	* Initialize memory manager
	*/
	init: function() {
		// initialize memory bank info table
		this.memoryBankInfo = new Array(8);
		// initialize ram image
		this.ram = new nl.kingsquare.as3.flash.utils.getByteArray('');
		this.ram.length = 0x10000;
		this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM] = new nl.kingsquare.c64.memory.MemoryBankInfo(this.ram);
		// initialize i/o images
		this.vic = new nl.kingsquare.c64.memory.io.VIC(nl.kingsquare.debug);
		this.cia1 = new nl.kingsquare.c64.memory.io.CIA1(nl.kingsquare.debug);
		this.cia2 = new nl.kingsquare.c64.memory.io.CIA2(nl.kingsquare.debug);
		this.sid = new nl.kingsquare.c64.memory.io.SID(nl.kingsquare.debug);
		this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_VIC] = new nl.kingsquare.c64.memory.MemoryBankInfo(this.vic, 0xd000, 0x0400);
		this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA1] = new nl.kingsquare.c64.memory.MemoryBankInfo(this.cia1, 0xdc00, 0x0100);
		this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA2] = new nl.kingsquare.c64.memory.MemoryBankInfo(this.cia2, 0xdd00, 0x0100);
		this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_SID] = new nl.kingsquare.c64.memory.MemoryBankInfo(this.sid, 0xd400, 0x0400);
		// initialize memory maps.
		// the two memory map arrays are used to map each page of the
		// 64k address space (256 pages à 256 bytes) to the appropriate
		// ram, rom (basic, kernal) or i/o (vic, sid, cia1, cia2)
		// memory images, separately for both read and write access.
		this.memoryMapRead = [];
		this.memoryMapWrite = [];
		for(var i= 0; i < 256; i++) {
			// initially set full ram access (read and write)
			this.memoryMapRead.push(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM);
			this.memoryMapWrite.push(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM);
		}
	},

	/**
	* Read a byte from memory
	*/
	read: function(address/*:uint*/) {
		var result = this.memoryBankInfo[this.memoryMapRead[address >> 8]].image.getValueByAddress(address);
		if (typeof result == 'undefined') result = 0;
		return result;
	},

	/**
	* Read a word from memory
	*/
	readWord: function(address/*:uint*/) {
		return this.read(address) + (this.read(address + 1) << 8);
	},

	/**
	* Read a byte from stack
	*/
	readStack: function(sp/*:uint*/) {
		return this.ram[sp + nl.kingsquare.c64.memory.MemoryManager.BASEADDR_STACK];
	},

	/**
	 * Read a byte from character data.
	 *
	 * We need an extra method for the VIC because it sees the character
	 * data ROM as shadows at $1000 and $9000 (VIC banks 0 and 2) only,
	 * but the ROM is physically present at $D000. The VIC reads from RAM
	 * for all other locations.
	 *
	 * Note that this method is only called by the VIC. The 6502 sees
	 * the character data ROM only at it's physical address $D000, and
	 * only if it's explicitly banked in.
	 *
	 * The address calculation is done externally by the VIC to save time
	 * (it only needs to be calculated once at bad lines)
	 */
	readCharacterData: function(address/*:uint*/, accessRom/*:Boolean = true*/) {
		if (typeof accessRom == 'undefined') accessRom = true;
		if(accessRom) {
			return this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CHARACTER].image.getValueByAddress(address);
		} else {
			return this.memoryBankInfo[nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM].image.getValueByAddress(address);
		}
	},

	/**
	* Copy bytes from RAM
	*/
	copyRam: function(ba, address/*:uint*/, len/*:uint*/) {
		ba.writeBytes(this.ram, address, len);
	},

	/**
	* Write a byte to memory
	*/
	write: function(address/*:uint*/, value/*:int*/) {
		if(address == 0x0001) {
			// write processor port (address 0x0001)
			// banks memory images in or out of the address space
			// according to bits 0-2:
			// %x00: ram visible everywhere
			// %x01: ram visible at $a000-$bfff and $e000-$ffff
			// %x10: ram visible at $a000-$bfff, kernal-rom visible at $e000-$ffff
			// %x11: basic-rom visible at $a000-$bfff, kernal-rom visible at $e000-$ffff
			// %0xx: character-rom visible at $d000-$dfff (except for %000, see above)
			// %1xx: i/o visible at $d000-$dfff (except for %000, see above)
			// a write access to a visible rom-area always writes to ram
			var enableKernal/*:Boolean*/ = (value & 2) == 2;
			var enableBasic/*:Boolean*/ = (value & 3) == 3;
			var enableCharacter/*:Boolean*/ = ((value & 4) == 0) && ((value & 3) != 0);
			var enableIO/*:Boolean*/ = (value & 4) == 4 && ((value & 3) != 0);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_KERNAL, enableKernal, false);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_BASIC, enableBasic, false);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CHARACTER, enableCharacter, false);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_VIC, enableIO, enableIO);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA1, enableIO, enableIO);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA2, enableIO, enableIO);
			this.enableMemoryBank(nl.kingsquare.c64.memory.MemoryManager.MEMBANK_SID, enableIO, enableIO);
		}
		var bank= address >> 8;
		var f= this.memoryMapWrite[bank];
		this.memoryBankInfo[f].image.setValueByAddress(address, value);
	},

	/**
	* Write a word to memory
	*/
	writeWord: function(address/*:uint*/, value/*:int*/) {
		var f= this.memoryMapWrite[address >> 8];
		var image = this.memoryBankInfo[f].image;
		image.setValueByAddress(address++, value & 0xff);
		image.setValueByAddress(address, (value & 0xff00) >> 8);
	},

	/**
	* Write a byte to stack
	*/
	writeStack: function(sp/*:uint*/, value/*:int*/) {
		this.ram[sp + nl.kingsquare.c64.memory.MemoryManager.BASEADDR_STACK] = value;
	},

	/**
	* Add ROM or RAM memory banks to the memory manager
	* and initialize the corresponding image
	*/
	setMemoryBank: function(bankid/*:int*/, baseAddress, length, data) {
	    var i, image = nl.kingsquare.as3.flash.utils.getByteArray();
		if (typeof baseAddress == 'undefined') baseAddress = 0;
		if (typeof length == 'undefined') length = 0;
		if (typeof data == 'undefined') data = null;

		// always 64k
		image.length = 0x10000;
		if(length != 0 && data !== null) {
			image.position = baseAddress;
			image.writeBytes(data, 0, length);
			this.memoryBankInfo[bankid] = new nl.kingsquare.c64.memory.MemoryBankInfo(image, baseAddress, length);
		}
	},

	/**
	* Enable/disable read and write access for a ROM or I/O memory bank.
	*/
	enableMemoryBank: function(bankid/*:int*/, enableRead/*:Boolean = true*/, enableWrite/*:Boolean = false*/) {
		if (typeof enableRead == 'undefined') enableRead = true;
		if (typeof enableWrite == 'undefined') enableWrite = false;

		// get memory bank info (image, address range, status)
		var bank = this.memoryBankInfo[bankid];
		// check if memory is already mapped right
		if(bank.readAccess !== enableRead || bank.writeAccess !== enableWrite) {
			// map pages to the bank (visible), or to ram (not visible)
			var valueRead = enableRead ? bankid : nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM;
			var valueWrite = enableWrite ? bankid : nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM;
			var pageStart= bank.baseAddress >> 8;
			var pageEnd= (bank.length >> 8) + pageStart;
			for(var i= pageStart; i < pageEnd; i++) {
				this.memoryMapRead[i] = valueRead;
				this.memoryMapWrite[i] = valueWrite;
			}
			// remember state
			bank.readAccess = enableRead;
			bank.writeAccess = enableWrite;
		}
	},

	/**
	* Dump memory to console
	*/
	dump: function(adr/*:uint*/, len/*:uint*/, bytesPerLine) {
		if (typeof bytesPerLine == 'undefined') bytesPerLine = 8;
		var ret = '';

		for(var i= 0; i < len; i++) {
			if(i % bytesPerLine == 0) {
				if(i > 0) {
					ret += "\n";
				}
				ret += nl.kingsquare.core.misc.Convert.toHex(adr, 4) + ": ";
			}
			ret += nl.kingsquare.core.misc.Convert.toHex(this.read(adr++)) + " ";
		}
		return ret;
	},

	/**
	* Load .PRG file
	*/
	loadPRG: function(url/*:String*/) {
		$.get(url, {}, this.onLoadPRG);
	},

	/**
	 * Load .PRG file is complete.
	 * Copy contents to memory.
	 */
	onLoadPRG: function(data) {
		var ba = nl.kingsquare.as3.flash.utils.ByteArray(data);
		console.log("PRG file loaded");
		// get start address
		ba.endian = Endian.LITTLE_ENDIAN;
		var startAddress = ba.readShort();
		console.log("Start address: $" + startAddress);
		// copy contents
		for(var i= 0x02; i < ba.length; i++) {
			write(startAddress++, ba[i]);
		}
		writeWord(0x002b, 0x0801);
		writeWord(0x002d, startAddress);
		writeWord(0x002f, startAddress);
		writeWord(0x0031, startAddress);
		dispatchEvent(new Event("complete"));
	},

	/**
	* Load .PXX file
	*/
	loadPXX: function(url/*:String*/) {
		$.get(url, {}, this.onLoadPXX);
	},

	/**
	 * Load .PXX file is complete.
	 * Check if file is valid and copy contents to memory.
	 */
	onLoadPXX: function(data) {
		var ba = nl.kingsquare.as3.flash.utils.ByteArray(data);
		// check if valid PRG file
		var intro = [ 0x43, 0x36, 0x34, 0x46, 0x69, 0x6C, 0x65, 0x00 ];
		for(var i= 0; i < intro.length; i++) {
			if(ba[i] != intro[i]) {
				// todo: error, not a PRG file
				return;
			}
		}
		// get filename
		var fileName = '';
		for(i = 8; i < 24; i++) {
			if(ba[i] == 0) {
				break;
			}
			// todo: this is actually PETSCII
			fileName += String.fromCharCode(ba[i]);
		}
		console.log("PXX file '" + fileName + "' loaded");
		// get start address
		ba.endian = Endian.LITTLE_ENDIAN;
		ba.position = 0x1a;
		var startAddress = ba.readShort();
		console.log("Start address: $" + nl.kingsquare.core.misc.Convert.toHex(startAddress, 4));
		// copy contents
		write(1, this.read(1) & 0xf8);
		for(i = 0x1c; i < ba.length; i++) {
			write(startAddress++, ba[i]);
		}
		write(1, this.read(1) | 0x07);
		dispatchEvent(new Event("complete"));
	}
});

nl.kingsquare.c64.memory.MemoryManager.BASEADDR_STACK =  0x0100 ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_RAM = 0 ; // "ram"
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_VIC = 1 ; // "vic" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA1 = 2 ; // "cia1" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CIA2 = 3 ; // "cia2" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_SID = 4 ; // "sid" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_KERNAL = 5 ; // "kernal" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_BASIC = 6 ; // "basic" ;
nl.kingsquare.c64.memory.MemoryManager.MEMBANK_CHARACTER = 7 ; // "character" ;