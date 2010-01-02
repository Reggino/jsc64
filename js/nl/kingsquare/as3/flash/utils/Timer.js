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

nl.kingsquare.as3.flash.Timer = nl.kingsquare.as3.flash.events.EventDispatcher.extend({
    init: function(delay, repeatCount) {
        if (typeof repeatCount == 'undefined') repeatCount = 0;
        if (repeatCount === 0) repeatCount = Infinity;
        this.repeatCount = repeatCount;
        this.currentCount = 0;
 		this.delay = delay;
		this.running = false;
    },

	stop: function () {
	   //clearInterval(this.id);
	   this.running = false;
	},

	start: function() {
		var self = this;
	    if (!this.running) {
	        this.running = true;
	    }
	    if (!this.id) {
	 	   this.id = setInterval(function() {
	           self.internalCallback();
	        }, this.interval);
	    }
	},

	internalCallback: function () {
		if (this.running) {
		   this.dispatchEvent('timer');
		   this.currentCount++;
		   if (this.currentCount == this.repeatCount) {
	            this.dispatchEvent('timerComplete');
	            this.reset();
		   }
		}
	},

	reset: function (val) {
        this.stop();
        this.currentCount = 0;
	}
});