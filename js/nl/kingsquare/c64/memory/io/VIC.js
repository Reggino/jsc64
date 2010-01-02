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

 Object properties
	public var this.colors:Array;

	public var this.characterMemoryAddr:int;
	public var this.bitmapMemoryAddr:int;
	public var this.screenMemoryAddr:int;

	public var this.verticalRasterScroll:int;
	public var this.horizontalRasterScroll:int;
	public var this.screenHeight:int;
	public var this.screenWidth:int;
	public var this.screenVisible:Boolean;
	public var this.rasterTrigger:int;

	/**
	 * Display mode
	 * 000: Standard text mode
	 * 001: Multicolor text mode
	 * 010: Standard bitmap mode
	 * 011: Multicolor bitmap mode
	 * 100: ECM text mode
	 * 101: (invalid)
	 * 110: (invalid)
	 * 111: (invalid)

	public var this.displayMode:uint;
	public var this.displayModeValid:Boolean;

	public var this.bitmapMode:Boolean;
	public var this.multiColorMode:Boolean;
	public var this.extBackgroundMode:Boolean;

	public var borderColor:uint;
	public var this.backgroundColors:Array;

	public var rstIRQEnabled:Boolean;
	public var this.mbcIRQEnabled:Boolean;
	public var this.mmcIRQEnabled:Boolean;
	public var this.lpIRQEnabled:Boolean;

	public var this.rstIRQLatch:Boolean;
	public var this.mbcIRQLatch:Boolean;
	public var this.mmcIRQLatch:Boolean;
	public var this.lpIRQLatch:Boolean;

	public var this.sprites:Array;
	public var this.spritesEnabled:Boolean;
	public var this.spriteMulticolor0:uint;
	public var this.spriteMulticolor1:uint;

	private var this.rasterPositionValue:int;
*/
nl.kingsquare.c64.memory.io.VIC = nl.kingsquare.core.memory.io.IOHandler.extend({
	init: function(debugFlag) {
		this.cname = 'VIC';
		this.screenVisible = this.displayModeValid = this.bitmapMode = this.multiColorMode = this.extBackgroundMode =
		this.rstIRQEnabled = this.mbcIRQEnabled = this.mmcIRQEnabled = this.lpIRQEnabled = this.rstIRQLatch = this.mbcIRQLatch =
		this.mmcIRQLatch = this.lpIRQLatch = this.spritesEnabled = false;

		this.characterMemoryAddr = this.bitmapMemoryAddr = this.screenMemoryAddr = this.verticalRasterScroll = this.horizontalRasterScroll =
		this.screenHeight = this.screenWidth = this.rasterTrigger =  this.displayMode = this.borderColor = this.spriteMulticolor0 =
		this.spriteMulticolor1 = this.rasterPositionValue = 0;



		if (typeof debugFlag == 'undefined') debugFlag = false;
		this._super(debugFlag);
		this.displayModeValid = true;
		this.backgroundColors = [0, 0, 0, 0];
		this.colors = [
				0xff000000, 0xffffffff, 0xffe04040, 0xff60ffff,
				0xffe060e0, 0xff40e040, 0xff4040e0, 0xffffff40,
				0xffe0a040, 0xff9c7448, 0xffffa0a0, 0xff545454,
				0xff888888, 0xffa0ffa0, 0xffa0a0ff, 0xffc0c0c0
			];
		this.sprites = [
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[1]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[2]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[3]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[4]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[5]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[6]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[7]),
				new nl.kingsquare.c64.memory.io.VICSpriteInfo(this.colors[12])
			];
		this.spriteMulticolor0 = this.colors[4];
		this.spriteMulticolor1 = this.colors[0];
	},
	setRasterPosition: function(value/*:int*/) {
		this.rasterPositionValue = value;
		if(this.rstIRQEnabled && value == this.rasterTrigger) {
			this.rstIRQLatch = true;
		}
	},
	// $d000: Sprite #0 x-position
	getSprite0X: function(index/*:int*/) {
		if(this.debug) this.debugMessage("[VIC] get S0X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite0X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[0];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S0X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d001: Sprite #0 y-position
	getSprite0Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S0Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite0Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S0Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d002: Sprite #1 x-position
	getSprite1X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S1X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite1X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[1];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S1X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d003: Sprite #1 y-position
	getSprite1Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S1Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite1Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[1]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S1Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d004: Sprite #2 x-position
	getSprite2X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S2X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite2X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[2];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S2X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d005: Sprite #2 y-position
	getSprite2Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S2Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite2Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[2]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S2Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d006: Sprite #3 x-position
	getSprite3X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S3X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite3X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[3];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S3X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d007: Sprite #3 y-position
	getSprite3Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S3Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite3Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[3]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S3Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d008: Sprite #4 x-position
	getSprite4X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S4X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite4X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[4];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S4X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d009: Sprite #4 y-position
	getSprite4Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S4Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite4Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[4]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S4Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d00a: Sprite #5 x-position
	getSprite5X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S5X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite5X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[5];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S5X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d00b: Sprite #5 y-position
	getSprite5Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S5Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite5Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[5]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S5Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d00c: Sprite #6 x-position
	getSprite6X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S6X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite6X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[6];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S6X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d00d: Sprite #6 y-position
	getSprite6Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S6Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite6Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[6]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S6Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d00e: Sprite #7 x-position
	getSprite7X: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S7X: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite7X: function(index/*:int*/, value/*:int*/)/*:void*/ {
		var sprite = this.sprites[7];
		sprite.x = (sprite.x & 0x0100) | value;
		if(this.debug) { this.debugMessage("[VIC] set S7X: #$" + nl.kingsquare.core.misc.Convert.toHex(sprite.x, 3)); }
		this.arr[index] = value;
	},
	// $d00f: Sprite #7 y-position
	getSprite7Y: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S7Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite7Y: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[7]).y = this.arr[index] = value;
		if(this.debug) { this.debugMessage("[VIC] set S7Y: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index])); }
	},
	// $d010: Sprite 0-7 x-position MSB
	getSpritesXMSB: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SMX: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesXMSB: function(index/*:int*/, value/*:int*/)/*:void*/ {
		if(value & 0x01) { (this.sprites[0]).x |= 0x100; } else { (this.sprites[0]).x &= 0xff; }
		if(value & 0x02) { (this.sprites[1]).x |= 0x100; } else { (this.sprites[1]).x &= 0xff; }
		if(value & 0x04) { (this.sprites[2]).x |= 0x100; } else { (this.sprites[2]).x &= 0xff; }
		if(value & 0x08) { (this.sprites[3]).x |= 0x100; } else { (this.sprites[3]).x &= 0xff; }
		if(value & 0x10) { (this.sprites[4]).x |= 0x100; } else { (this.sprites[4]).x &= 0xff; }
		if(value & 0x20) { (this.sprites[5]).x |= 0x100; } else { (this.sprites[5]).x &= 0xff; }
		if(value & 0x40) { (this.sprites[6]).x |= 0x100; } else { (this.sprites[6]).x &= 0xff; }
		if(value & 0x80) { (this.sprites[7]).x |= 0x100; } else { (this.sprites[7]).x &= 0xff; }
		if(this.debug) { this.debugMessage("[VIC] set SMX: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},

	// $d011: Screen Control Register #1
	getScreenControlRegister1: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SC1: #$" + nl.kingsquare.core.misc.Convert.toHex((this.arr[index] & 0x7f) | ((this.rasterPositionValue & 0x100) >> 1)));
		return (this.arr[index] & 0x7f) | ((this.rasterPositionValue & 0x100) >> 1);
	},
	setScreenControlRegister1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.verticalRasterScroll = value & 0x07;
		this.screenHeight = ((value & 0x08) != 0) ? 25 : 24;
		this.screenVisible = (value & 0x10) != 0;
		this.bitmapMode = (value & 0x20) != 0;
		this.extBackgroundMode = (value & 0x40) != 0;
		this.displayMode = (this.displayMode & 0x01) | ((value & 0x60) >> 4);
		this.displayModeValid = (this.displayMode <= 4);
		this.rasterTrigger = (this.rasterTrigger & 0xff) | ((value & 0x80) << 1)
		if(this.debug) {
			var d = "[VIC] set SC1: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "this.rasterTrigger:" + this.rasterTrigger + ", ";
			d += "vscroll:" + this.verticalRasterScroll + ", ";
			d += "scrheight:" + this.screenHeight + ", ";
			d += "scrvisible:" + this.screenVisible + ", ";
			d += "this.bitmapMode:" + this.bitmapMode + ", ";
			d += "extbgmode:" + this.extBackgroundMode;
			this.debugMessage(d);
		}
		this.arr[index] = value & 0x7f;
	},
	//$d012: Raster (low 8 bits)
	getRaster: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get RST: #$" + nl.kingsquare.core.misc.Convert.toHex(this.rasterPositionValue & 0xff));
		return this.rasterPositionValue & 0xff;
	},
	setRaster: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.rasterTrigger = (this.rasterTrigger & 0x100) | value;
		if(this.debug) {
			var d = "[VIC] set RST: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "this.rasterTrigger:" + this.rasterTrigger;
			this.debugMessage(d);
		}
	},

	// $d013: Lightpen x-position
	// Not supported

	// $d014: Lightpen y-position
	// Not supported

	// $d015: Sprite 0-7 enable flags
	getSpritesEnable: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SEN: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesEnable: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).enabled = ((value & 0x01) != 0);
		(this.sprites[1]).enabled = ((value & 0x02) != 0);
		(this.sprites[2]).enabled = ((value & 0x04) != 0);
		(this.sprites[3]).enabled = ((value & 0x08) != 0);
		(this.sprites[4]).enabled = ((value & 0x10) != 0);
		(this.sprites[5]).enabled = ((value & 0x20) != 0);
		(this.sprites[6]).enabled = ((value & 0x40) != 0);
		(this.sprites[7]).enabled = ((value & 0x80) != 0);
		this.spritesEnabled = (value != 0);
		if(this.debug) { this.debugMessage("[VIC] set SEN: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},
	// $d016: Screen Control Register #2
	getScreenControlRegister2: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SC2: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setScreenControlRegister2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.horizontalRasterScroll = value & 0x07;
		this.screenWidth = ((value & 0x08) != 0) ? 40 : 38;
		this.multiColorMode = (value & 0x10) != 0;
		this.displayMode = (this.displayMode & 0x06) | (this.multiColorMode ? 0x01 : 0x00);
		this.displayModeValid = (this.displayMode <= 4);
		if(this.debug) {
			var d = "[VIC] set SC2: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "hscroll:" + this.horizontalRasterScroll + ", ";
			d += "scrwidth:" + this.screenWidth + ", ";
			d += "this.multiColorMode:" + this.multiColorMode;
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d017: Sprite 0-7 vertical expansion flags
	getSpritesExpandVertical: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SVX: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesExpandVertical: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).expandVertical = ((value & 0x01) != 0);
		(this.sprites[1]).expandVertical = ((value & 0x02) != 0);
		(this.sprites[2]).expandVertical = ((value & 0x04) != 0);
		(this.sprites[3]).expandVertical = ((value & 0x08) != 0);
		(this.sprites[4]).expandVertical = ((value & 0x10) != 0);
		(this.sprites[5]).expandVertical = ((value & 0x20) != 0);
		(this.sprites[6]).expandVertical = ((value & 0x40) != 0);
		(this.sprites[7]).expandVertical = ((value & 0x80) != 0);
		if(this.debug) { this.debugMessage("[VIC] set SVX: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},
	// $d018: Memory Control Register
	getMemoryControlRegister: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get MCR: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setMemoryControlRegister: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.characterMemoryAddr = (value & 0x0e) << 10;
		this.bitmapMemoryAddr = (value & 0x08) << 10;
		this.screenMemoryAddr = (value & 0xf0) << 6;
		if(this.debug) {
			var d = "[VIC] set MCR: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "charmem:$" + nl.kingsquare.core.misc.Convert.toHex(this.characterMemoryAddr,4) + ", ";
			d += "bitmapmem:$" + nl.kingsquare.core.misc.Convert.toHex(this.bitmapMemoryAddr,4) + ", ";
			d += "screenmem:$" + nl.kingsquare.core.misc.Convert.toHex(this.screenMemoryAddr,4) + " ";
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d019: IRQ Status Register
	getIRQStatusRegister: function(index/*:int*/)/*:int*/ {
		var value/*:int*/ = 0x70;
		if(this.rstIRQLatch) { value |= 0x01; }
		if(this.mbcIRQLatch) { value |= 0x02; }
		if(this.mmcIRQLatch) { value |= 0x04; }
		if(this.lpIRQLatch) { value |= 0x08; }
		// set bit 7 if at least one irq is enabled and latched. otherwise clear it.
		if(((value & this.arr[0x0a]) & 0x0f ) != 0) {
			value |= 0x80;
		}
		if(this.debug) this.debugMessage("[VIC] get IQS: #$" + nl.kingsquare.core.misc.Convert.toHex(value));
		return value;
	},
	setIRQStatusRegister: function(index/*:int*/, value/*:int*/)/*:void*/ {
		// if bit is set, reset corresponding latch
		if((value & 0x01) != 0) { this.rstIRQLatch = false; }
		if((value & 0x02) != 0) { this.mbcIRQLatch = false; }
		if((value & 0x04) != 0) { this.mmcIRQLatch = false; }
		if((value & 0x08) != 0) { this.lpIRQLatch = false; }
		if(this.debug) {
			var d/*:String*/ = "[VIC] set IQS: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "rst:" + (this.rstIRQLatch ? 1 : 0) + ", ";
			d += "mbc:" + (this.mbcIRQLatch ? 1 : 0) + ", ";
			d += "mmc:" + (this.mmcIRQLatch ? 1 : 0) + ", ";
			d += "lp:" + (this.lpIRQLatch ? 1 : 0);
			this.debugMessage(d);
		}
	},
	// $d01a: IRQ Mask Register
	getIRQMaskRegister: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get IQM: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index] | 0xf0));
		return this.arr[index] | 0xf0;
	},
	setIRQMaskRegister: function(index/*:int*/, value/*:int*/)/*:void*/ {
		// if bit is set, enable corresponding irq
		this.rstIRQEnabled = ((value & 0x01) != 0);
		this.mbcIRQEnabled = ((value & 0x02) != 0);
		this.mmcIRQEnabled = ((value & 0x04) != 0);
		this.lpIRQEnabled = ((value & 0x08) != 0);
		this.arr[index] = value | 0xf0;
		if(this.debug) {
			var d/*:String*/ = "[VIC] set IQM: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "rst:" + (this.rstIRQEnabled ? 1 : 0) + ", ";
			d += "mbc:" + (this.mbcIRQEnabled ? 1 : 0) + ", ";
			d += "mmc:" + (this.mmcIRQEnabled ? 1 : 0) + ", ";
			d += "lp:" + (this.lpIRQEnabled ? 1 : 0);
			this.debugMessage(d);
		}
	},
	// $d01b: Sprite 0-7 foreground flags
	getSpritesForeground: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SFG: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesForeground: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).foreground = ((value & 0x01) == 0);
		(this.sprites[1]).foreground = ((value & 0x02) == 0);
		(this.sprites[2]).foreground = ((value & 0x04) == 0);
		(this.sprites[3]).foreground = ((value & 0x08) == 0);
		(this.sprites[4]).foreground = ((value & 0x10) == 0);
		(this.sprites[5]).foreground = ((value & 0x20) == 0);
		(this.sprites[6]).foreground = ((value & 0x40) == 0);
		(this.sprites[7]).foreground = ((value & 0x80) == 0);
		if(this.debug) { this.debugMessage("[VIC] set SFG: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},
	// $d01c: Sprite 0-7 multicolor mode flags
	getSpritesMulticolor: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SMC: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesMulticolor: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).multicolor = ((value & 0x01) != 0);
		(this.sprites[1]).multicolor = ((value & 0x02) != 0);
		(this.sprites[2]).multicolor = ((value & 0x04) != 0);
		(this.sprites[3]).multicolor = ((value & 0x08) != 0);
		(this.sprites[4]).multicolor = ((value & 0x10) != 0);
		(this.sprites[5]).multicolor = ((value & 0x20) != 0);
		(this.sprites[6]).multicolor = ((value & 0x40) != 0);
		(this.sprites[7]).multicolor = ((value & 0x80) != 0);
		if(this.debug) { this.debugMessage("[VIC] set SMC: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},
	// $d01d: Sprite 0-7 horizontal expansion flags
	getSpritesExpandHorizontal: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SHX: #%" + nl.kingsquare.core.misc.Convert.toBin(this.arr[index]));
		return this.arr[index];
	},
	setSpritesExpandHorizontal: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.sprites[0].expandHorizontal = ((value & 0x01) != 0);
		this.sprites[1].expandHorizontal = ((value & 0x02) != 0);
		this.sprites[2].expandHorizontal = ((value & 0x04) != 0);
		this.sprites[3].expandHorizontal = ((value & 0x08) != 0);
		this.sprites[4].expandHorizontal = ((value & 0x10) != 0);
		this.sprites[5].expandHorizontal = ((value & 0x20) != 0);
		this.sprites[6].expandHorizontal = ((value & 0x40) != 0);
		this.sprites[7].expandHorizontal = ((value & 0x80) != 0);
		if(this.debug) { this.debugMessage("[VIC] set SHX: #%" + nl.kingsquare.core.misc.Convert.toBin(value)); }
		this.arr[index] = value;
	},

	// $d01e: Sprite to Sprite collision flags
	// TODO

	// $d01f: Sprite to Foreground collision flags
	// TODO

	// $d020: Border Color

	getBorderColor: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get BOC: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setBorderColor: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.borderColor = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set BOC: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "bordercol:" + nl.kingsquare.core.misc.Convert.toHex(this.borderColor, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d021: Background Color
	getBackgroundColor: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get BG0: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setBackgroundColor: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.backgroundColors[0] = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set BG0: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "backgroundcol0:" + nl.kingsquare.core.misc.Convert.toHex(this.backgroundColors[0], 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d022: Extended Background Color #1
	getBackgroundColor1: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get BG1: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	}
	,
	setBackgroundColor1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.backgroundColors[1] = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set BG1: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "backgroundcol1:" + nl.kingsquare.core.misc.Convert.toHex(this.backgroundColors[1], 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},

	// $d023: Extended Background Color #2
	getBackgroundColor2: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get BG2: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setBackgroundColor2: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.backgroundColors[2] = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set BG2: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "backgroundcol2:" + nl.kingsquare.core.misc.Convert.toHex(this.backgroundColors[2], 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},

	// $d024: Extended Background Color #3
	getBackgroundColor3: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get BG3: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setBackgroundColor3: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.backgroundColors[3] = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set BG3: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "backgroundcol3:" + nl.kingsquare.core.misc.Convert.toHex(this.backgroundColors[3], 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d025: Sprite Multicolor #0
	getSpriteMulticolor0: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SM0: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSpriteMulticolor0: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.spriteMulticolor0 = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set SM0: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "this.spriteMulticolor0:" + nl.kingsquare.core.misc.Convert.toHex(this.spriteMulticolor0, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d026: Sprite Multicolor #1
	getSpriteMulticolor1: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get SM1: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	}
	,
	setSpriteMulticolor1: function(index/*:int*/, value/*:int*/)/*:void*/ {
		this.spriteMulticolor1 = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set SM1: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "this.spriteMulticolor0:" + nl.kingsquare.core.misc.Convert.toHex(this.spriteMulticolor1, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d027: Sprite #0 color
	getSprite0Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S0C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite0Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[0]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S0C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[0]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d028: Sprite #1 color
	getSprite1Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S1C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite1Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[1]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S1C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[1]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d029: Sprite #2 color
	getSprite2Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S2C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite2Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[2]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S2C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[2]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d02a: Sprite #3 color
	getSprite3Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S3C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite3Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[3]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S3C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[3]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d02b: Sprite #4 color
	getSprite4Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S4C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite4Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[4]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S4C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[4]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d02c: Sprite #5 color
	getSprite5Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S5C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite5Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[5]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S5C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[5]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d02d: Sprite #6 color
	getSprite6Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S6C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite6Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[6]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S6C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[6]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	// $d02e: Sprite #7 color
	getSprite7Color: function(index/*:int*/)/*:int*/ {
		if(this.debug) this.debugMessage("[VIC] get S7C: #$" + nl.kingsquare.core.misc.Convert.toHex(this.arr[index]));
		return this.arr[index];
	},
	setSprite7Color: function(index/*:int*/, value/*:int*/)/*:void*/ {
		(this.sprites[7]).color = this.colors[value & 0x0f];
		if(this.debug) {
			var d/*:String*/ = "[VIC] set S7C: #$" + nl.kingsquare.core.misc.Convert.toHex(value) + " ";
			d += "color:" + nl.kingsquare.core.misc.Convert.toHex((this.sprites[7]).color, 8);
			this.debugMessage(d);
		}
		this.arr[index] = value;
	},
	initHandlers: function()/*:void*/ {
	    var self = this;
		this.handlers = [
			// the VIC chip has 64 registers:
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite0X(index); }, function(index, value) {self.setSprite0X(index)}), // 00
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite0Y(index); }, function(index, value) { self.setSprite0Y(index, value); }), // 01
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite1X(index); }, function(index, value) { self.setSprite1X(index, value); }), // 02
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite1Y(index); }, function(index, value) { self.setSprite1Y(index, value); }), // 03
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite2X(index); }, function(index, value) { self.setSprite2X(index, value); }), // 04
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite2Y(index); }, function(index, value) { self.setSprite2Y(index, value); }), // 05
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite3X(index); }, function(index, value) { self.setSprite3X(index, value); }), // 06
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite3Y(index); }, function(index, value) { self.setSprite3Y(index, value); }), // 07
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite4X(index); }, function(index, value) { self.setSprite4X(index, value); }), // 08
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite4Y(index); }, function(index, value) { self.setSprite4Y(index, value); }), // 09
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite5X(index); }, function(index, value) { self.setSprite5X(index, value); }), // 0a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite5Y(index); }, function(index, value) { self.setSprite5Y(index, value); }), // 0b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite6X(index); }, function(index, value) { self.setSprite6X(index, value); }), // 0c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite6Y(index); }, function(index, value) { self.setSprite6Y(index, value); }), // 0d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite7X(index); }, function(index, value) { self.setSprite7X(index, value); }), // 0e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite7Y(index); }, function(index, value) { self.setSprite7Y(index, value); }), // 0f
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesXMSB(index); }, function(index, value) { self.setSpritesXMSB(index, value); }), // 10
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getScreenControlRegister1(index); }, function(index, value) { self.setScreenControlRegister1(index, value); }), // 11
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getRaster(index); }, function(index, value) { self.setRaster(index, value); }), // 12
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 13
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 14
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesEnable(index); }, function(index, value) { self.setSpritesEnable(index, value); }), // 15
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getScreenControlRegister2(index); }, function(index, value) { self.setScreenControlRegister2(index, value); }), // 16
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesExpandVertical(index); }, function(index, value) { self.setSpritesExpandVertical(index, value); }), // 17
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getMemoryControlRegister(index); }, function(index, value) { self.setMemoryControlRegister(index, value); }), // 18
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getIRQStatusRegister(index); }, function(index, value) { self.setIRQStatusRegister(index, value); }), // 19
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getIRQMaskRegister(index); }, function(index, value) { self.setIRQMaskRegister(index, value); }), // 1a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesForeground(index); }, function(index, value) { self.setSpritesForeground(index, value); }), // 1b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesMulticolor(index); }, function(index, value) { self.setSpritesMulticolor(index, value); }), // 1c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpritesExpandHorizontal(index); }, function(index, value) { self.setSpritesExpandHorizontal(index, value); }), // 1d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 1e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 1f
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getBorderColor(index); }, function(index, value) { self.setBorderColor(index, value); }), // 20
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getBackgroundColor(index); }, function(index, value) { self.setBackgroundColor(index, value); }), // 21
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getBackgroundColor1(index); }, function(index, value) { self.setBackgroundColor1(index, value); }), // 22
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getBackgroundColor2(index); }, function(index, value) { self.setBackgroundColor2(index, value); }), // 23
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getBackgroundColor3(index); }, function(index, value) { self.setBackgroundColor3(index, value); }), // 24
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpriteMulticolor0(index); }, function(index, value) { self.setSpriteMulticolor0(index, value); }), // 25
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSpriteMulticolor1(index); }, function(index, value) { self.setSpriteMulticolor1(index, value); }), // 26
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite0Color(index); }, function(index, value) { self.setSprite0Color(index, value); }), // 27
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite1Color(index); }, function(index, value) { self.setSprite1Color(index, value); }), // 28
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite2Color(index); }, function(index, value) { self.setSprite2Color(index, value); }), // 29
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite3Color(index); }, function(index, value) { self.setSprite3Color(index, value); }), // 2a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite4Color(index); }, function(index, value) { self.setSprite4Color(index, value); }), // 2b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite5Color(index); }, function(index, value) { self.setSprite5Color(index, value); }), // 2c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite6Color(index); }, function(index, value) { self.setSprite6Color(index, value); }), // 2d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getSprite7Color(index); }, function(index, value) { self.setSprite7Color(index, value); }), // 2e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 2f
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 30
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 31
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 32
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 33
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 34
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 35
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 36
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 37
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 38
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 39
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 3a
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 3b
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 3c
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 3d
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); }), // 3e
			new nl.kingsquare.core.memory.io.IOHandlerInfo(function(index) { return self.getDefault(index); }, function(index, value) { self.setDefault(index, value); })  // 3f
		];
	},
	toString: function()/*:String*/ {
		var d/*:String*/ = "";
		d += "Display mode: ";
		switch(this.displayMode) {
			case 0: d += "Standard Text"; break;
			case 1: d += "Multicolor Text"; break;
			case 2: d += "Standard Bitmap"; break;
			case 3: d += "Multicolor Bitmap"; break;
			case 4: d += "ECM Text"; break;
			default: d += "invalid"; break;
		}
		d += " (%" + nl.kingsquare.core.misc.Convert.toBin(this.displayMode, 3) + ")\n";
		d += "Screen memory: $" + nl.kingsquare.core.misc.Convert.toHex(this.screenMemoryAddr, 4) + "\n";
		d += "Bitmap memory: $" + nl.kingsquare.core.misc.Convert.toHex(this.bitmapMemoryAddr, 4) + "\n";
		d += "Characterdata memory: $" + nl.kingsquare.core.misc.Convert.toHex(this.characterMemoryAddr, 4) + "\n";
		d += "Screen: " + (this.screenVisible ? "visible": "invisible") + " (" + this.screenWidth + "/" + this.screenHeight + ")\n";
		for(var i/*:uint*/ = 0; i < 8; i++) {
			d += toStringSprite(i);
		}
		return d;
	},
	toStringSprite: function(index/*:uint*/, displayDisabled/*:Boolean = true*/)/*:String*/ {
		if (typeof displayDisabled == 'undefined') displayDisabled = true;

		var d/*:String*/ = "";
		var sprite = this.sprites[index];
		d += "Sprite " + index + ": " + (sprite.enabled ? "enabled" : "disabled") + ", ";
		d += sprite.x + "/" + sprite.y + " (" + (sprite.foreground ? "foreground" : "background") + ", ";
		d += (sprite.multicolor ? "multicolor" : "monochrome") + ", ";
		d += (sprite.expandHorizontal ? "200%" : "100%") + "/";
		d += (sprite.expandVertical ? "200%" : "100%") + ")\n";
		return d;
	}
});