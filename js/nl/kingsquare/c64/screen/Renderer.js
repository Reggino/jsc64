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

	Object Properties
		private var cpu:CPU6502;
		private var this.mem:MemoryManager;
//		public var sidRenderer:SIDRenderer;
		private var this.displayBack/*:BitmapData;
		private var this.displayFore/*:BitmapData;
		private var this.displayBorder/*:BitmapData;
		private var this.colors/*:Array
		private var this.raster:int;
		private var this.cycles:int;
		private var this.newRasterLine/*:Boolean;
		private var this.tmpRowColors:nl.kingsquare.as3.flash.utils.ByteArray;
		private var collisionBackground:nl.kingsquare.as3.flash.utils.ByteArray;
		private var collisionSprite:nl.kingsquare.as3.flash.utils.ByteArray;
		private var this.frameTimer:Timer;
		private var this.fpsSum:uint;
		private var this.fpsCount:uint;
		private var _frameRateInfoEventInterval:int;
		private var this._rect/*:Rectangle = new Rectangle();
		public static const CYCLES_PER_STEP:uint = 63;
*/
nl.kingsquare.c64.screen.Renderer = nl.kingsquare.as3.flash.events.EventDispatcher.extend({
	init: function(js64Instance, container)/*:void*/ {
	    var self = this;

	    this._rect = new nl.kingsquare.as3.flash.geom.Rectangle();
		this.cpu = js64Instance._cpu;
		this.mem = js64Instance._mem;

		this.colors = [
			0xff000000, 0xffffffff, 0xffe04040, 0xff60ffff,
			0xffe060e0, 0xff40e040, 0xff4040e0, 0xffffff40,
			0xffe0a040, 0xff9c7448, 0xffffa0a0, 0xff545454,
			0xff888888, 0xffa0ffa0, 0xffa0a0ff, 0xffc0c0c0
		];

		this.cycles = 0;
		this.raster = 0;
		this.newRasterLine = false;

		this.fpsSum = 0;
		this.fpsCount = 0;
		this.frameRateInfoEventInterval = 25;

		this.tmpRowColors = nl.kingsquare.as3.flash.utils.getByteArray();
		this.tmpRowColors.length = 40;

		// background bitmap
	/*
		.displayFore {
			z-index: 2;
		}
		.displayBack {
			z-index: 1;
			}
		.displayBorder {
			z-index: 0;
		}*/

		// border bitmap
		this.displayBack = new nl.kingsquare.as3.flash.display.BitmapData($('<canvas class="displayBack" style="position: absolute; top: 0px; left: 0px;" width="403" height="284" />').appendTo(container)[0].getContext('2d'));
       	this.displayBack.fillRect(new nl.kingsquare.as3.flash.geom.Rectangle(0, 0, 403, 284), 0xFF000000);

		this.displayBorder = new nl.kingsquare.as3.flash.display.BitmapData($('<canvas class="displayBorder"  style="position: absolute; top: 0px; left: 0px;" width="403" height="284" >Your browser cannot display a canvas element, please use a modern browser...</canvas>').appendTo(container)[0].getContext('2d'));

		// foreground bitmap
		this.displayFore = new nl.kingsquare.as3.flash.display.BitmapData($('<canvas class="displayFore" style="position: absolute; top: 0px; left: 0px;" width="403" height="284"  />').appendTo(container)[0].getContext('2d'));

		// setup frame timer
		this.frameTimer = new nl.kingsquare.as3.flash.Timer(1, 0);
        this.frameTimer.addEventListener('timer', function() {
            self.frameLoop();
        });
	},

	start: function ()/*:void*/ {
		if(!this.frameTimer.running) {
            this.frameTimer.start();
		}
	}

	, stop: function (breakpointType) {
		if (typeof breakpointType == 'undefined') breakpointType = 0;
		if(this.frameTimer.running) {
            this.frameTimer.stop();
			this.dispatchEvent("stopInternal", breakpointType);
        }
	}

	, step: function ()/*:void*/
	{
		if(!this.frameTimer.running) {
			if(this.newRasterLine) {
				if(++this.raster == 312) {
					this.raster = 0;
				}
				this.checkRaster();
				this.newRasterLine = false;
			}
			this.executeInstruction(false);
			if(this.cycles >= nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP) {
				this.cycles -= nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP;
				this.drawRaster();
				this.newRasterLine = true;
			}
		}
	},

	frameLoop: function(event/*:TimerEvent*/)/*:void*/ {
		var t/*:int*/ = nl.kingsquare.as3.flash.utils.getTimer();

		//this.displayBack.lock();
		//this.displayFore.lock();
		//this.displayBorder.lock();

		this.dispatchEvent("rasterInternal", 0xffff);

		while(this.raster < 312) {
			// update this.raster (check irq condition, fire if met)
			var cyclesRasterIRQ/*:uint*/ = this.checkRaster();
			if(cyclesRasterIRQ != 0) {
				this.dispatchEvent("rasterInternal", this.raster);
			}

			try {
				// execute 63 this.cycles minimum
				while(this.cycles < nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP) {
					this.executeInstruction();
				}
			} catch(e/*:BreakpointException*/) {
				// CPU has hit a breakpoint:
				// update this.cycles and CIA timers
				trace('Cathed thrown event:');
				for(var i in e) trace(i+': '+e[i]);
				this.cycles += e.cyclesConsumed;
				this.updateTimers(e.cyclesConsumed);
				// if needed, reset this.cycles and draw this.raster
				if(this.cycles >= nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP) {
					this.cycles -= nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP;
					this.drawRaster();
					this.raster++;
				}
				// stop timer
				this.stop(e.type);
				// break out of loop
				break;
			}

			// reset this.cycles
			this.cycles -= nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP;

			// render current this.raster line
			this.drawRaster();

			// uncomment to enable sid
			// Update sid renderer
			// sidRenderer.getMem();

			// uncomment to visualize this.raster irq
			//if(cyclesRasterIRQ > 0) {
				//this.displayBorder.fillRect(new Rectangle(0, this.raster-16, 403, 1), 0xff00ff00);
			//}

			this.raster++;
		}

		//this.displayBorder.unlock();
		//this.displayFore.unlock();
		//this.displayBack.unlock();

		if(this.frameTimer.running) {
			//event.updateAfterEvent();
			this.raster = 0;
		}
	},

	checkRaster: function()/*:uint*/
	{
		var cyclesRasterIRQ/*:uint*/ = 0;
		// update VIC this.raster
		this.mem.vic.setRasterPosition(this.raster);
		// check for this.raster IRQ
		if(this.mem.vic.rstIRQEnabled && this.mem.vic.rstIRQLatch) {
			cyclesRasterIRQ = this.cpu.IRQ();
			this.cycles += cyclesRasterIRQ + 10; // CW: the '+ 10' is a hack
		}
		return cyclesRasterIRQ;
	},

	executeInstruction: function(checkBreakpoints/*:Boolean*/)/*:void*/{
	    if (typeof checkBreakpoints == 'undefined' ) checkBreakpoints = true;
		// execute instruction at pc
		// (throws BreakpointException)

		var cyclesConsumed/*:uint*/ = this.cpu.exec(checkBreakpoints);
		// update this.cycles
		this.cycles += cyclesConsumed;
		// update timers
		this.updateTimers(cyclesConsumed);
	},

	updateTimers: function(cyclesConsumed/*:uint*/)/*:void*/
	{
		var cia1/*/*:CIA1*/ = this.mem.cia1;
		// update CIA1 Timer A
		var underflow/*:Boolean*/ = false;
		if(cia1.taStarted && cia1.updateTimerA(cyclesConsumed)) {
			this.cycles += this.cpu.IRQ();
			cia1.resetTimerA();
			underflow = true;
		}
		// update CIA1 Timer B
		if(cia1.tbStarted && cia1.updateTimerB(cyclesConsumed, underflow)) {
			this.cycles += this.cpu.IRQ();
			cia1.resetTimerB();
		}
	}

	,drawRaster: function()/*:void*/
	{
		if(this.raster > 15 && this.raster < 300)
		{
			var y/*:uint*/ = this.raster - 16;
			var yOffs/*:int*/ = this.mem.vic.verticalRasterScroll - 3;
			if(this.raster > 50 + yOffs && this.raster <= 250 + yOffs) {
				// draw this.raster line
				if(this.mem.vic.displayModeValid) {
					if(this.mem.vic.screenVisible) {
						if(this.mem.vic.bitmapMode) {
							this.drawRasterBitmap(y, this.mem.vic.multiColorMode);
						} else {
							this.drawRasterText(y, this.mem.vic.multiColorMode, this.mem.vic.extBackgroundMode);
						}
						if(this.mem.vic.spritesEnabled) {
							this.drawRasterSprites(y);
						}
					} else {
						//don't use getBorderColor: that doesn't just retrieve this property!
						this.displayFore.fillRect(this.rect(48, y, 320, 1), this.mem.vic.borderColor);
					}
				} else {
					// invalid display mode
					this.displayFore.fillRect(this.rect(48, y, 320, 1), 0xff000000);
				}
			}
			// draw border
			var bTop/*:uint*/ = 50;
			var bBottom/*:uint*/ = 250;
			if(this.mem.vic.screenHeight == 24) {
				// top border extends 4px down
				// bottom border extends 4px up
				bTop = 54;
				bBottom = 246;
			}
			if(this.raster <= bTop || this.raster > bBottom) {
				// draw vertical border
				//don't use getBorderColor: that doesn't just retrieve this property!
				this.displayBorder.fillRect(this.rect(0, y, 403, 1), this.mem.vic.borderColor);
			} else {
				// draw horizontal border
				var bLeft/*:uint*/ = 48;
				var bRight/*:uint*/ = 35;
				if(this.mem.vic.screenWidth == 38) {
					// left border extends 7px right
					// right border extends 9px left
					bLeft = 55;
					bRight = 44;
				}
				// left border
				//don't use getBorderColor: that doesn't just retrieve this property!
				this.displayBorder.fillRect(this.rect(0, y, bLeft, 1), this.mem.vic.borderColor);
				// right border
				//don't use getBorderColor: that doesn't just retrieve this property!
				this.displayBorder.fillRect(this.rect(403 - bRight, y, bRight, 1), this.mem.vic.borderColor);
				// make middle transparent
				this.displayBorder.fillRect(this.rect(bLeft, y, 403 - bLeft - bRight, 1), 0x00000000);
			}
		}
	},

	drawRasterText: function(y/*:uint*/, isMultiColor/*:Boolean*/, isEnhancedColor/*:Boolean*/)/*:void*/
	{
		var backgroundColors/*/*:Array*/ = this.mem.vic.backgroundColors;
		// the relative y position
		var xOffs/*:uint*/ = this.mem.vic.horizontalRasterScroll;
		var yDisp/*:uint*/ = y - 32 - this.mem.vic.verticalRasterScroll;
		var yDispScreenOffset/*:uint*/ = ((yDisp >> 3) * 40);
		// the vic base address (0x0000, 0x4000, 0x8000 or 0xc000)
		var vicBaseAddr/*:uint*/ = this.mem.cia2.vicBaseAddr;
		// the character data base address
		var charDataBaseAddr/*:uint*/ = this.mem.vic.characterMemoryAddr;
		// here we determine the actual address of the character data area
		// the vic reads from character *rom* at $d000 only if:
		// - character data base address is 0x1000 or 0x1800, and
		// - vic banks 0 or 2 are active (vic base address 0x0000 or 0x8000)
		// otherwise it reads from ram at (vic base address) + (character data base address)
		var getCharDataFromRom/*:Boolean*/ = ((charDataBaseAddr == 0x1000 || charDataBaseAddr == 0x1800) && (vicBaseAddr & 0x4000) == 0);
		var charDataAddr/*:uint*/ = charDataBaseAddr + (getCharDataFromRom ? 0xc000 : vicBaseAddr);
		// the screen base address
		var screenAddr/*:uint*/ = this.mem.vic.screenMemoryAddr + vicBaseAddr;
		// draw background
		this.displayBack.fillRect(this.rect(48, y, 320, 1), backgroundColors[0]);
		this.displayFore.fillRect(this.rect(48, y, 320, 1), 0x00000000);
		var x/*:int*/;
		var foregroundColor/*:uint*/;
		var bm/*:BitmapData*/;
		// draw the line
		for(var xDisp/*:int*/ = 0; xDisp < 316; xDisp += 8) {
			var screenOffset/*:uint*/ = yDispScreenOffset + (xDisp >> 3);
			var screenCode/*:uint*/ = this.mem.read(screenAddr + screenOffset);
			var c/*:uint*/ = this.mem.read(0xd800 + screenOffset) & 0x0f;
			var b/*:uint*/ = this.mem.readCharacterData(charDataAddr + (screenCode << 3) + (yDisp & 0x07), getCharDataFromRom);
			if(!isMultiColor || (c < 8)) {
				// monochrome text mode
				var colorIndex/*:int*/;
				if(b == 0xFF) {
					this.displayFore.fillRect(this.rect(xDisp + 48 + xOffs, y, 8, 1), this.colors[c]);
				} else if(b != 0x00) {
					x = xDisp + 48 + xOffs;
					if(isEnhancedColor && screenCode > 63) {
						colorIndex = (screenCode >> 6);
						bm = (colorIndex > 1) ? this.displayFore : this.displayBack;
						bm.fillRect(this.rect(x, y, 8, 1), backgroundColors[colorIndex]);
					}
					foregroundColor = this.colors[c];
					if(b & 0x1) { this.displayFore.setPixel32(x+7, y, foregroundColor); }
					if(b & 0x2) { this.displayFore.setPixel32(x+6, y, foregroundColor); }
					if(b & 0x4) { this.displayFore.setPixel32(x+5, y, foregroundColor); }
					if(b & 0x8) { this.displayFore.setPixel32(x+4, y, foregroundColor); }
					if(b & 0x10) { this.displayFore.setPixel32(x+3, y, foregroundColor); }
					if(b & 0x20) { this.displayFore.setPixel32(x+2, y, foregroundColor); }
					if(b & 0x40) { this.displayFore.setPixel32(x+1, y, foregroundColor); }
					if(b & 0x80) { this.displayFore.setPixel32(x+0, y, foregroundColor); }
				} else if(isEnhancedColor && screenCode > 63) {
					colorIndex = (screenCode >> 6);
					bm = (colorIndex > 1) ? this.displayFore : this.displayBack;
					bm.fillRect(this.rect(xDisp + 48 + xOffs, y, 8, 1), backgroundColors[colorIndex]);
				}
			} else {
				// multicolor text mode
				if(b == 0) { continue; }
				if(b == 0xFF) {
					this.displayFore.fillRect(this.rect(xDisp + 48 + xOffs, y, 8, 1), this.colors[c & 0x07]);
				} else if(b == 0xAA) {
					this.displayFore.fillRect(this.rect(xDisp + 48 + xOffs, y, 8, 1), backgroundColors[2]);
				} else if(b == 0x55) {
					this.displayBack.fillRect(this.rect(xDisp + 48 + xOffs, y, 8, 1), backgroundColors[1]);
				} else {
					x = xDisp + 48 + xOffs;
					c &= 0x07;
					var v/*:uint*/ = b & 0x03;
					if(v != 0) {
						foregroundColor = (v == 3) ? this.colors[c] : backgroundColors[v];
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+7, y, foregroundColor);
						bm.setPixel32(x+6, y, foregroundColor);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						foregroundColor = (v == 3) ? this.colors[c] : backgroundColors[v];
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+5, y, foregroundColor);
						bm.setPixel32(x+4, y, foregroundColor);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						foregroundColor = (v == 3) ? this.colors[c] : backgroundColors[v];
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+3, y, foregroundColor);
						bm.setPixel32(x+2, y, foregroundColor);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						foregroundColor = (v == 3) ? this.colors[c] : backgroundColors[v];
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+1, y, foregroundColor);
						bm.setPixel32(x, y, foregroundColor);
					}
				}
			}
		}
	},

	drawRasterBitmap: function(y/*:uint*/, isMultiColor/*:Boolean*/)/*:void*/
	{
		var bm/*:BitmapData*/;
		var backgroundColors/*:Array*/ = this.mem.vic.backgroundColors;
		// the relative y position
		var yDisp/*:uint*/ = y - 32 - this.mem.vic.verticalRasterScroll;
		var yDispScreenOffset/*:uint*/ = ((yDisp >> 3) * 40);
		// the vic base address (0x0000, 0x4000, 0x8000 or 0xc000)
		var vicBaseAddr/*:uint*/ = this.mem.cia2.vicBaseAddr;
		// the bitmap data base address
		var bitmapDataAddr/*:uint*/ = vicBaseAddr + this.mem.vic.bitmapMemoryAddr;
		// the screen base address
		var screenAddr/*:uint*/ = vicBaseAddr + this.mem.vic.screenMemoryAddr;
		// check bad line condition
		if((yDisp & 0x07) == 0) {
			if(!isMultiColor) {
				// get color data for current row
				this.tmpRowColors.position = 0;
				this.mem.copyRam(this.tmpRowColors, screenAddr + yDispScreenOffset, 40);
				// get background color for first 8x8 cell
				var bgColor/*:uint*/ = this.tmpRowColors[0] & 0x0f;
				var startColumn/*:uint*/ = 0;
				for(var column/*:uint*/ = 1; column < 40; column++) {
					// check if background color of next 8x8 cell is the same
					// as the background color of the previous cell(s)
					if(bgColor != (this.tmpRowColors[column] & 0x0f)) {
						// it's not the same:
						// draw background for previous cell(s)
						// CW: TODO: do we need to distinguish between fore and background here?
						this.displayBack.fillRect(this.rect((startColumn << 3) + 48, y, (column - startColumn) << 3, 8), this.colors[bgColor]);
						// remember current background color and cell index
						bgColor = this.tmpRowColors[column] & 0x0f;
						startColumn = column;
					}
				}
				// draw background for remaining cell(s) of current row
				// CW: TODO: do we need to distinguish between fore and background here?
				this.displayBack.fillRect(this.rect((startColumn << 3) + 48, y, (40 - startColumn) << 3, 8), this.colors[bgColor]);
			} else {
				this.displayBack.fillRect(this.rect(48, y, 320, 8), 0x00000000);
			}
		}
		this.displayFore.fillRect(this.rect(48, y, 320, 1), 0x00000000);
		// draw the line
		for(var xDisp/*:int*/ = 0; xDisp < 316; xDisp += 8) {
			var b/*:uint*/ = this.mem.read(bitmapDataAddr + (yDispScreenOffset << 3) + (yDisp & 0x07) + xDisp);
			if(!isMultiColor) {
				// monochrome bitmap mode
				if(b == 0xFF) {
					this.displayFore.fillRect(this.rect(xDisp + 48, y, 8, 1), this.colors[this.tmpRowColors[xDisp >> 3] >> 4]);
				} else if(b != 0x00) {
					var x/*:int*/ = xDisp + 48;
					var foregroundColor/*:uint*/ = this.colors[this.tmpRowColors[xDisp >> 3] >> 4];
					if(b & 0x1) { this.displayFore.setPixel32(x+7, y, foregroundColor); }
					if(b & 0x2) { this.displayFore.setPixel32(x+6, y, foregroundColor); }
					if(b & 0x4) { this.displayFore.setPixel32(x+5, y, foregroundColor); }
					if(b & 0x8) { this.displayFore.setPixel32(x+4, y, foregroundColor); }
					if(b & 0x10) { this.displayFore.setPixel32(x+3, y, foregroundColor); }
					if(b & 0x20) { this.displayFore.setPixel32(x+2, y, foregroundColor); }
					if(b & 0x40) { this.displayFore.setPixel32(x+1, y, foregroundColor); }
					if(b & 0x80) { this.displayFore.setPixel32(x+0, y, foregroundColor); }
				}
			} else {
				// multicolor bitmap mode
				var screenOffset/*:uint*/ = yDispScreenOffset + (xDisp >> 3);
				var screenCode/*:uint*/ = this.mem.read(screenAddr + screenOffset);
				var foregroundColors/*:Array*/ = [
					0,
					this.colors[screenCode >> 4],
					this.colors[screenCode & 0x0f],
					this.colors[this.mem.read(0xd800 + screenOffset) & 0x0f]
				];
				if(b == 0) { continue; }
				if(b == 0xFF) {
					this.displayFore.fillRect(this.rect(xDisp + 48/* + xOffs*/, y, 8, 1), foregroundColors[3]);
				} else if(b == 0xAA) {
					this.displayFore.fillRect(this.rect(xDisp + 48/* + xOffs*/, y, 8, 1), foregroundColors[2]);
				} else if(b == 0x55) {
					this.displayBack.fillRect(this.rect(xDisp + 48/* + xOffs*/, y, 8, 1), foregroundColors[1]);
				} else {
					x = xDisp + 48/* + xOffs*/;
					var v/*:uint*/ = b & 0x03;
					if(v != 0) {
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+7, y, foregroundColors[v]);
						bm.setPixel32(x+6, y, foregroundColors[v]);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+5, y, foregroundColors[v]);
						bm.setPixel32(x+4, y, foregroundColors[v]);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+3, y, foregroundColors[v]);
						bm.setPixel32(x+2, y, foregroundColors[v]);
					}
					b >>= 2;
					v = b & 0x03;
					if(v != 0) {
						bm = (v == 1) ? this.displayBack : this.displayFore;
						bm.setPixel32(x+1, y, foregroundColors[v]);
						bm.setPixel32(x, y, foregroundColors[v]);
					}
				}
			}
		}
	},

	drawRasterSprites: function(y/*:uint*/)/*:void*/
	{
		//var d:String = "";
		//y -= 16;
		var yDisp/*:uint*/ = y + 32;
		var spritePointers/*:uint*/ = this.mem.vic.screenMemoryAddr + this.mem.cia2.vicBaseAddr + 0x03f8;
		for(var i/*:int*/ = 0; i < 8; i++) {
			var sprite/*:VICSpriteInfo*/ = this.mem.vic.sprites[i];
			// check if sprite is enabled at all
			if(sprite.enabled) {
				// check if sprite is visible in the current this.raster line
				var h/*:uint*/ = (sprite.expandVertical) ? 42 : 21;
				var ySprite/*:uint*/ = sprite.y - 16;
				if(y >= ySprite && y < ySprite + h) {
					var spriteRaster/*:int*/ = y - ySprite;
					if(sprite.expandVertical) { spriteRaster >>= 1; }
					var addr/*:uint*/ = this.mem.cia2.vicBaseAddr + (this.mem.read(spritePointers + i) << 6) + spriteRaster * 3;
					var v/*:uint*/ = this.mem.read(addr) << 16 | this.mem.read(addr+1) << 8 | this.mem.read(addr+2);
					// all transparent?
					if(v != 0) {
						var c/*:uint*/;
						var xCur/*:uint*/;
						var x/*:uint*/ = sprite.x + 24;
						var y1/*:uint*/ = y;
						var bm/*:BitmapData*/ = sprite.foreground ? this.displayFore : this.displayBack;
						if(sprite.multicolor) {
							var spriteColors/*:Array*/ = [
								0,
								this.mem.vic.spriteMulticolor0,
								sprite.color,
								this.mem.vic.spriteMulticolor1
							];
							if(sprite.expandHorizontal) {
								xCur = x + 44;
								while(v != 0) {
									c = v & 3;
									if(c != 0) { bm.fillRect(this.rect(xCur, y1, 4, 1), spriteColors[c]); }
									v >>= 2;
									xCur -= 4;
								}
							} else {
								xCur = x + 22;
								while(v != 0) {
									c = v & 3;
									if(c != 0) {
										bm.setPixel32(xCur, y1, spriteColors[c]);
										bm.setPixel32(xCur+1, y1, spriteColors[c]);
									}
									v >>= 2;
									xCur -= 2;
								}
							}
						} else {
							if(sprite.expandHorizontal) {
								xCur = x + 46;
								while(v != 0) {
									c = v & 1;
									if(c != 0) {
										bm.setPixel32(xCur, y1, sprite.color);
										bm.setPixel32(xCur+1, y1, sprite.color);
									}
									v >>= 1;
									xCur -= 2;
								}
							} else {
								xCur = x + 23;
								while(v != 0) {
									c = v & 1;
									if(c != 0) { bm.setPixel32(xCur, y1, sprite.color); }
									v >>= 1;
									xCur--;
								}
							}
						}
						//if(i == 0) {
						//	trace(this.mem.vic.toStringSprite(i));
						//}
						//d += i + " " + spriteRaster + ", ";
					}
				}
			}
		}
		//if(d != "") {
		//	trace(d);
		//}
	},

	setFrameRateInfoEventInterval: function (val/*:int*/)/*:void*/ {
		if(val < 5) {
			val = 5;
		}
		this._frameRateInfoEventInterval = val;
	},

	getFrameRateInfoEventInterval: function ()/*:int*/ {
		return this._frameRateInfoEventInterval;
	},

	rect: function(x/*/*:Number*/, y/*:Number*/, width/*:Number*/, height/*:Number*/)/*/*:Rectangle*/ {
		this._rect.x = x;
		this._rect.y = y;
		this._rect.width = width;
		this._rect.height = height;
		return this._rect;
	}
});
nl.kingsquare.c64.screen.Renderer.CYCLES_PER_STEP = 63;