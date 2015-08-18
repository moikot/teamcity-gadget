////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Scroll bar class
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// The following parts are used:
// content_panel    - The scrollable content container
// scrollbar_panel  - The scrollbar parts container
//      scroll_track     - The scrollbar track
//      scroll_thumb     - The scrollbar thumb (movable part)
////////////////////////////////////////////////////////////////////////////////

function ScrollBar() {
    var self = this;

    ////////////////////////////////////////////////////////////////////////////////
    // Constructor
    ////////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {

        this._trackTop = this._GetOffsetTop(scroll_track);
        this._thumbLength = 0;
        this._trackHeight = 0;
        this._totalHeight = 0;
        this._y = 0;

        scroll_track.attachEvent("onclick", this._OnTrackClick);
        scroll_thumb.attachEvent("onmousedown", this._OnThumbDown);
        scroll_thumb.attachEvent("onmouseup", this._OnThumbUp);
        content_panel.attachEvent("onmousewheel", this._OnScrollBarWheel);

        content_panel.style.left = "0px";
        content_panel.style.top = "0px";
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Event handlers
    ////////////////////////////////////////////////////////////////////////////////

    this._OnTrackClick = function(e) {

        var y = Math.round(e.y - self._trackTop - self._thumbLength / 2);
        var trackAreaLength = self._trackHeight - self._thumbLength;

        var areaY = (y / trackAreaLength) * (self._totalHeight - self._trackHeight);
        self._Scroll(areaY);
    };
    
    this._OnThumbDown = function(e) {
        self._grabPoint = e.clientY - self._GetOffsetTop(scroll_thumb);
        scroll_thumb.attachEvent("onmousemove", self._OnScrollBarDrag);
    };
    
    this._OnThumbUp = function(e) {
        scroll_thumb.detachEvent("onmousemove", self._OnScrollBarDrag);
    };
    
    this._OnScrollBarWheel = function(e) {
        var delta = -e.wheelDelta / 120;
        self._Scroll(-self._y + (delta * 14));
    };

    this._OnScrollBarDrag = function(e) {

        e = e || window.event;
        var v = e.clientY - self._trackTop;

        var y;
        var trackAreaLength = self._trackHeight - self._thumbLength;

        if (v >= trackAreaLength + self._grabPoint)
            y = trackAreaLength;
        else if (v <= self._grabPoint)
            y = 0;
        else
            y = v - self._grabPoint;

        scroll_thumb.style.top = (scroll_track.offsetTop + y) + "px";

        // Calculate current position of scrollable area
        var areaY = (y / trackAreaLength) * (self._totalHeight - self._trackHeight);
        self._SetPosition(-Math.round(areaY));
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Core functions
    ////////////////////////////////////////////////////////////////////////////////

    this._GetOffsetTop = function(object) {
        var offsetTop = 0;
        if (object.offsetParent) {
            while (object.offsetParent) {
                offsetTop += object.offsetTop;
                object = object.offsetParent;
            }
        }
        return offsetTop;
    };

    this._SetPosition = function(y) {

        if (y < this._viewportHeight - this._totalHeight)
            y = this._viewportHeight - this._totalHeight;

        if (y > 0)
            y = 0;

        this._y = y;
        content_panel.style.top = this._y + "px";
    };

    this._SetThumbLength = function(length) {
        scroll_thumb.style.height = length + "px";
        this._thumbLength = length;
    };
    
    this._Scroll = function(y) {
        var scrollAreaLength = this._totalHeight - this._trackHeight;

        if (y > scrollAreaLength)
            y = scrollAreaLength;

        if (y < 0)
            y = 0;

        // Calculate current position of thumb
        var thumbY = 0;

        if (scrollAreaLength != 0)
            thumbY = (y / scrollAreaLength) * (this._trackHeight - this._thumbLength);

        scroll_thumb.style.top = Math.round(thumbY) + "px";
        this._SetPosition(-y);
    };

    ////////////////////////////////////////////////////////////////////////////////
    // Public functions
    ////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////
    // Gets and sets scroll bar height
    ////////////////////////////////////////////////////////////////////////////////

    this.GetHeight = function() {
        return this._trackHeight;
    };
    
    this.SetHeight = function (height) {
        scroll_track.style.height = height + "px";
        this._trackHeight = height;
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Gets and sets scrollable panel height
    ////////////////////////////////////////////////////////////////////////////////

    this.GetTotalHeight = function() {
        return this._totalHeight;
    };
    
    this.SetTotalHeight = function(totalHeight) {
        this._totalHeight = totalHeight;
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Updates scroll bar
    ////////////////////////////////////////////////////////////////////////////////
    
    this.Update = function() {

        // Calculate the size of the thumb
        var thumbLength = 0;            
                
        if (this._totalHeight > 0)
            thumbLength = Math.round((this._trackHeight * this._trackHeight) / this._totalHeight);

        if (thumbLength < 20)
            thumbLength = 20;

        if (thumbLength > this._trackHeight)
            thumbLength = this._trackHeight;

        // If the thumb has the same length as track hide the scroll bar
        if (thumbLength != this._trackHeight)
            scrollbar_panel.style.display = 'block';
        else
            scrollbar_panel.style.display = 'none';

        this._SetThumbLength(thumbLength);
        this._Scroll(-this._y);
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Shows scroll bar with fade-in
    ////////////////////////////////////////////////////////////////////////////////
    
    this.Show = function() {
        if (event.fromElement)
            return;

        clearTimeout(scrollbar_panel.timer);
        self.FadeIn();
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Hides scroll bar with fade-out
    ////////////////////////////////////////////////////////////////////////////////
    
    this.Hide = function() {
        if (event.toElement)
            return;

        clearTimeout(scrollbar_panel.timer);
        self.FadeOut();
        scrollbar_panel.blur();
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Fades scroll bar in
    ////////////////////////////////////////////////////////////////////////////////
    
    this.FadeIn = function() {
        with (scrollbar_panel.filters("alpha")) {
            if ((opacity += 15) < 75) {
                scrollbar_panel.timer = setTimeout(self.FadeIn, 25);
            }
            else {
                opacity = 80;
            }
        }
    }; 
    
    ////////////////////////////////////////////////////////////////////////////////
    // Fades scroll bar out
    ////////////////////////////////////////////////////////////////////////////////
    
    this.FadeOut = function() {
        with (scrollbar_panel.filters("alpha")) {
            if ((opacity -= 15) > 0) {
                scrollbar_panel.timer = setTimeout(self.FadeOut, 25);
            }
            else {
                opacity = 0;
            }
        }
    };
    
    this._Reset();
};