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

//based on http://pietschsoft.com/post/2008/11/04/JavaScript-Mixing-OOP-and-Event-Driven-Programming.aspx
nl.kingsquare.as3.flash.events.EventDispatcher = Class.extend({
    _eventList: {},
    _getEvent: function(eventName, create){
        // Check if Array of Event Handlers has been created
        if (!this._eventList[eventName]){

            // Check if the calling method wants to create the Array
            // if not created. This reduces unneeded memory usage.
            if (!create) {
                return null;
            }

        // Create the Array of Event Handlers
            this._eventList[eventName] = []; // new Array
        }

        // return the Array of Event Handlers already added
        return this._eventList[eventName];
    },
    addEventListener: function(eventName, handler) {
        // Get the Array of Event Handlers
        var evt = this._getEvent(eventName, true);

        // Add the new Event Handler to the Array
        evt.push(handler);
    },
    detachEvent: function(eventName, handler) {
        // Get the Array of Event Handlers
        var evt = this._getEvent(eventName);

        if (!evt) { return; }

        // Helper Method - an Array.indexOf equivalent
        var getArrayIndex = function(array, item){
            for (var i = 0; i < array.length; i++) {
                if (array[i] && array[i] === item) {
                    return i;
                }
            }
            return -1;
        };

        // Get the Array index of the Event Handler
        var index = getArrayIndex(evt, handler);

        if (index > -1) {
            // Remove Event Handler from Array
            evt.splice(index, 1);
        }
    },
    dispatchEvent: function(eventName, eventArgs) {
        // Get a function that will call all the Event Handlers internally
        var handler = this._getEventHandler(eventName);
        if (handler) {
            // call the handler function
            // Pass in "sender" and "eventArgs" parameters
            handler(this, eventArgs);
        }
    },
    _getEventHandler: function(eventName) {
        // Get Event Handler Array for this Event
        var evt = this._getEvent(eventName, false);
        if (!evt || evt.length === 0) { return null; }

        // Create the Handler method that will use currying to
        // call all the Events Handlers internally
        var h = function(sender, args) {
            for (var i = 0; i < evt.length; i++) {
                evt[i](sender, args);
            }
        };

        // Return this new Handler method
        return h;
    }
});