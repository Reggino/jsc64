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

/*

	private var cpu:CPU6502;

	/** 64 bit mask indicating what keys are down
	private var keyBits:Array; // of 2 int values

	/**
	 * Map of the key to it's value in the matrix:
	 * http://sta.c64.org/cbm64kbdlay.html

	private var this.keyMatrixLocations:Array; // Array of 2 int values (row, col)
	private var keyMaskColumns:ByteArray;
	private var this.joystickMask:uint;
	private var shiftDown:Boolean;
	private var _enabled:Boolean = false;
	private var this.listenerTarget:DisplayObject;
*/

nl.kingsquare.c64.memory.io.Keyboard = Class.extend({
 	init: function() {
		this._enabled = this.shiftDown = false;
		this.keyMaskColumns = nl.kingsquare.as3.flash.utils.getByteArray('');
		this.keyMaskColumns.length = 8;
		this.joystickMask = 0;
		this.initializeKeyMatrixLocations();
	},

	/**
	 * Initialization
	 *
	 * @param cpu The CPU that an NMI can be triggered on
	 * @param this.listenerTarget The area to listen to for key press/release events
	 */
	initialize: function(cpu/*:CPU6502*/, listenerTarget/*:DisplayObject*/) {
		this.setEnabled(false);
		this.cpu = cpu;
		this.listenerTarget = listenerTarget;
	},
	getEnabled: function()/*:Boolean*/ {
		return this._enabled;
	},
	setEnabled: function(value/*:Boolean*/)/*:void*/{
		var self = this;
		if(this._enabled != value) {
			this._enabled = value;
			if(this.listenerTarget != null) {
				if(this._enabled) {
   					this.listenerTarget.keyup (function(event) {self.keyUp(event); });
   					this.listenerTarget.keydown (function(event) {self.keyDown(event); });
				} else {
					this.listenerTarget.unbind('keydown', function(event) {self.keyDown(event); });
					this.listenerTarget.unbind('keyup', function(event) {self.keyUp(event); });
				}
			}
		}
	},

		/**
		 * Returns a byte value representing the rows in the keyboard
		 * matrix with pressed keys
		 *
		 * @param columns Byte value representing the selected columns
		 */
	getRows: function( columns/*:int*/ )/*:int*/  {
		var rows/*:int*/ = 0x00;

		// Loop over all of the columns and add in the rows that are set in that column
		// if the column is one we need to check
		rows |= ( columns & 0x01 ) == 0 ? this.keyMaskColumns[ 0 ] : 0x00;
		rows |= ( columns & 0x02 ) == 0 ? this.keyMaskColumns[ 1 ] : 0x00;
		rows |= ( columns & 0x04 ) == 0 ? this.keyMaskColumns[ 2 ] : 0x00;
		rows |= ( columns & 0x08 ) == 0 ? this.keyMaskColumns[ 3 ] : 0x00;
		rows |= ( columns & 0x10 ) == 0 ? this.keyMaskColumns[ 4 ] : 0x00;
		rows |= ( columns & 0x20 ) == 0 ? this.keyMaskColumns[ 5 ] : 0x00;
		rows |= ( columns & 0x40 ) == 0 ? this.keyMaskColumns[ 6 ] : 0x00;
		rows |= ( columns & 0x80 ) == 0 ? this.keyMaskColumns[ 7 ] : 0x00;

		rows |= this.joystickMask;

		return ~rows & 0xFF;
	},
	getJoystick2: function() {
		return ~this.joystickMask & 0xFF;
	},
	initializeKeyMatrixLocations: function() {
		this.keyMatrixLocations = new Array();
		// The matrix needs to be flipped here.. the first value is
		// the column and the second is the row.  When they are read
		// as (row,col) it seems to work correctly.
		this.keyMatrixLocations[ 0x41 ] = [ 2, 1 ]; // A
		this.keyMatrixLocations[ 0x42 ] = [ 4, 3 ]; // B
		this.keyMatrixLocations[ 0x43 ] = [ 4, 2 ]; // C
		this.keyMatrixLocations[ 0x44 ] = [ 2, 2 ]; // D
		this.keyMatrixLocations[ 0x45 ] = [ 6, 1 ]; // E
		this.keyMatrixLocations[ 0x46 ] = [ 5, 2 ]; // F
		this.keyMatrixLocations[ 0x47 ] = [ 2, 3 ]; // G
		this.keyMatrixLocations[ 0x48 ] = [ 5, 3 ]; // H
		this.keyMatrixLocations[ 0x49 ] = [ 1, 4 ]; // I
		this.keyMatrixLocations[ 0x4A ] = [ 2, 4 ]; // J
		this.keyMatrixLocations[ 0x4B ] = [ 5, 4 ]; // K
		this.keyMatrixLocations[ 0x4C ] = [ 2, 5 ]; // L
		this.keyMatrixLocations[ 0x4D ] = [ 4, 4 ]; // M
		this.keyMatrixLocations[ 0x4E ] = [ 7, 4 ]; // N
		this.keyMatrixLocations[ 0x4F ] = [ 6, 4 ]; // O
		this.keyMatrixLocations[ 0x50 ] = [ 1, 5 ]; // P
		this.keyMatrixLocations[ 0x51 ] = [ 6, 7 ]; // Q
		this.keyMatrixLocations[ 0x52 ] = [ 1, 2 ]; // R
		this.keyMatrixLocations[ 0x53 ] = [ 5, 1 ]; // S
		this.keyMatrixLocations[ 0x54 ] = [ 6, 2 ]; // T
		this.keyMatrixLocations[ 0x55 ] = [ 6, 3 ]; // U
		this.keyMatrixLocations[ 0x56 ] = [ 7, 3 ]; // V
		this.keyMatrixLocations[ 0x57 ] = [ 1, 1 ]; // W
		this.keyMatrixLocations[ 0x58 ] = [ 7, 2 ]; // X
		this.keyMatrixLocations[ 0x59 ] = [ 1, 3 ]; // Y
		this.keyMatrixLocations[ 0x5A ] = [ 4, 1 ]; // Z

		this.keyMatrixLocations[ 0x30 ] = [ 3, 4 ]; // 0
		this.keyMatrixLocations[ 0x31 ] = [ 0, 7 ]; // 1
		this.keyMatrixLocations[ 0x32 ] = [ 3, 7 ]; // 2
		this.keyMatrixLocations[ 0x33 ] = [ 0, 1 ]; // 3
		this.keyMatrixLocations[ 0x34 ] = [ 3, 1 ]; // 4
		this.keyMatrixLocations[ 0x35 ] = [ 0, 2 ]; // 5
		this.keyMatrixLocations[ 0x36 ] = [ 3, 2 ]; // 6
		this.keyMatrixLocations[ 0x37 ] = [ 0, 3 ]; // 7
		this.keyMatrixLocations[ 0x38 ] = [ 3, 3 ]; // 8
		this.keyMatrixLocations[ 0x39 ] = [ 0, 4 ]; // 9

		this.keyMatrixLocations[ 0xDE ] = [ 5, 5 ]; // : (mapped on '~' key)
		this.keyMatrixLocations[ 0xBA ] = [ 2, 6 ]; // ;
		this.keyMatrixLocations[ 0xBB ] = [ 5, 6 ]; // =
		this.keyMatrixLocations[ 0xBC ] = [ 7, 5 ]; // ,
		this.keyMatrixLocations[ 0xBD ] = [ 3, 5 ]; // -
		this.keyMatrixLocations[ 0xBE ] = [ 4, 5 ]; // .
		this.keyMatrixLocations[ 0xBF ] = [ 7, 6 ]; // /

		//this.keyMatrixLocations[ 0x42 ] = [ 6, 5 ]; // @
		this.keyMatrixLocations[ 0xDD ] = [ 0, 5 ]; // + (mapped on '[')
		//this.keyMatrixLocations[ 0x5C ] = [ 0, 6 ]; // \
		this.keyMatrixLocations[ 0xDC ] = [ 1, 6 ]; // * (mapped on ']')

		this.keyMatrixLocations[ 0x12 ] = [ 5, 7 ]; // ALT
		this.keyMatrixLocations[ 17 ] = [ 2, 7 ]; //flash.ui.Keyboard.CONTROL
		this.keyMatrixLocations[ 36 ] = [ 3, 6 ]; // flash.ui.Keyboard.HOME
		this.keyMatrixLocations[ 13 ] = [ 1, 0 ]; // flash.ui.Keyboard.ENTER
		this.keyMatrixLocations[ 46 ] = [ 0, 0 ]; //flash.ui.Keyboard.DELETE
		this.keyMatrixLocations[ 8 ] = [ 0, 0 ]; // flash.ui.Keyboard.BACKSPACE
		this.keyMatrixLocations[ 27 ] = [ 7, 7 ]; //flash.ui.Keyboard.ESCAPE
		this.keyMatrixLocations[ 32 ] = [ 4, 7 ]; //flash.ui.Keyboard.SPACE
		this.keyMatrixLocations[ 40 ] = [ 7, 0 ]; // flash.ui.Keyboard.DOWN
		this.keyMatrixLocations[ 39 ] = [ 2, 0 ]; //flash.ui.Keyboard.RIGHT
		this.keyMatrixLocations[ 16 ] = [ 7, 1 ]; // left shift  flash.ui.Keyboard.SHIFT
		//this.keyMatrixLocations[ flash.ui.Keyboard.SHIFT ] = [ 4, 6 ]; // right shift

		this.keyMatrixLocations[ 112 ] = [ 4, 0 ]; // flash.ui.Keyboard.F1
		this.keyMatrixLocations[ 114 ] = [ 5, 0 ]; // flash.ui.Keyboard.F3
		this.keyMatrixLocations[ 116 ] = [ 6, 0 ]; // flash.ui.Keyboard.F5
		this.keyMatrixLocations[ 118 ] = [ 3, 0 ]; // flash.ui.Keyboard.F7
	},
	keyDown: function( event/*:KeyboardEvent*/ ) {
		var keyCode/*:int*/ = event.keyCode;

		switch(keyCode) {
			case 33: //flash.ui.Keyboard.PAGE_UP:
				this.cpu.NMI();
				break;
			case 16://flash.ui.Keyboard.SHIFT:
				this.shiftDown = true;
				break;
			case 38:
			case 104: //flash.ui.Keyboard.NUMPAD_8:
				this.joystickMask |= 0x01;
				break;
			case 40:
			case 98: //flash.ui.Keyboard.NUMPAD_2:
				this.joystickMask |= 0x02;
				break;
			case 37:
			case 100: //flash.ui.Keyboard.NUMPAD_4:
				this.joystickMask |= 0x04;
				break;
			case 39:
			case 102: //flash.ui.Keyboard.NUMPAD_6:
				this.joystickMask |= 0x08;
				break;
			case 32: //flash.ui.Keyboard.SPACE:
				this.joystickMask |= 0x10;
				break;
		}

		if ( this.keyMatrixLocations[ keyCode ] != null )
		{
			var keyMatrixItem/*:Array*/ = this.keyMatrixLocations[ keyCode ];

			// Get the row/column location of the key in the matrix
			var row/*:int*/ = keyMatrixItem[ 0 ];
			var column/*:int*/ = keyMatrixItem[ 1 ];

			// Mark the row value as being pressed for the column
			this.keyMaskColumns[ column ] |= 1 << row;
		}
	},
	keyUp: function ( event/*:KeyboardEvent*/ ) {
		var keyCode/*:int*/ = event.keyCode;

		switch(keyCode)
		{
			case 16: //flash.ui.Keyboard.SHIFT:
				this.shiftDown = false;
				break;
			case 104://flash.ui.Keyboard.NUMPAD_8:
				this.joystickMask &= ~0x01;
				break;
			case 98: //flash.ui.Keyboard.NUMPAD_2:
				this.joystickMask &= ~0x02;
				break;
			case 100: //flash.ui.Keyboard.NUMPAD_4:
				this.joystickMask &= ~0x04;
				break;
			case 102:// flash.ui.Keyboard.NUMPAD_6:
				this.joystickMask &= ~0x08;
				break;
			case 32: //flash.ui.Keyboard.SPACE:
				this.joystickMask &= ~0x10;
				break;
		}

		if ( this.keyMatrixLocations[ keyCode ] != null )
		{
			// Get the row/column location of the key in the matrix
			var row/*:int*/ = this.keyMatrixLocations[ keyCode ][ 0 ];
			var column/*:int*/ = this.keyMatrixLocations[ keyCode ][ 1 ];

			// Mark the row value as being pressed for the column
			this.keyMaskColumns[ column ] &= ~( 1 << row );
		}
	}
});
