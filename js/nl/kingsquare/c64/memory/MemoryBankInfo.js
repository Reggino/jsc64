/*
 * Copyright notice
 *
 * (c) 2010 Tim de Koning - Kingsquare Information Services.  All rights reserved.
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

nl.kingsquare.c64.memory.MemoryBankInfo = function(image/*:Object*/, baseAddress/*:uint*/, length/*:uint*/) {
	if (typeof baseAddress == 'undefined') accessRom = 0;
	if (typeof length == 'undefined') length = 0;
	this.image = image;
	this.baseAddress = baseAddress;
	this.length = length;
	this.readAccess = false;
	this.writeAccess = false;
}