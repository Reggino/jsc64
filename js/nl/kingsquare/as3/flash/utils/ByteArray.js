/*
 * Copyright notice
 *
 * (c) 2009 Tim de Koning - Kingsquare Information Services.  All rights reserved.
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


var Endian = {};
Endian.LITTLE_ENDIAN = 'littleEndian';
Endian.BIG_ENDIAN = 'bigEndian';

/* to prevent porting issues, we'ld rather return an extended array with some extra
'bytelogic' instead of using a  real constructor. This way the '[]'-operators and
length property will remain intact.
*/
nl.kingsquare.as3.flash.utils.getByteArray = function(bytes, endian) {
    var i=0; result = new Array();
    if (typeof bytes == 'undefined') bytes = '';
    if (typeof endian == 'undefined') endian = Endian.BIG_ENDIAN;
    for(i=0; i<bytes.length; i++) {
        result.push(bytes.charCodeAt(i));
    }
    result.endian = endian;
    result.position = 0;
    result.writeBytes = function (data, offset, length) {
        var i;
        if (typeof offset == 'undefined') offset = 0;
        this.position += offset;
        for (i=0; i<length; i++) {
            this[this.position++] = data[i];
        }
    }

    //Reads a signed 16-bit integer from the byte stream
    result.readShort = function() {
    	var x = (this[this.position++]) + (this[this.position++] << 8), max = 65536;
		return ( (x >= (max / 2 ))? x - max : x);
    }

    result.setValueByAddress = function (address, value) {
        this[address] = value;
    }
    result.getValueByAddress = function (address) {
        return this[address];
    }
    return result;
};