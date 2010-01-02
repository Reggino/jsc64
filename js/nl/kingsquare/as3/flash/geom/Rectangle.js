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

nl.kingsquare.as3.flash.geom.Rectangle = Class.extend({
    init: function(x, y, width, height) {
        if (typeof x == 'undefined') x = 0
        if (typeof y == 'undefined') y = 0
        if (typeof width == 'undefined') width = 0
        if (typeof height == 'undefined') height = 0
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
});