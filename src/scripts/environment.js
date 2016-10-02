////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Global variables
///////////////////////////////////////////////////////////////////////////////

var g_teamCityServer;
var g_useBasicAuthentication = false;
var g_userName;
var g_userPassword;
var g_sortedProjects = new Array();

///////////////////////////////////////////////////////////////////////////////
// Contains the values of validation status
///////////////////////////////////////////////////////////////////////////////

var ValidationResult = {
    "NotDefined": 0,
    "Valid": 1,
    "Invalid": 2
};

///////////////////////////////////////////////////////////////////////////////
// Represents the state of the HTTP request.
///////////////////////////////////////////////////////////////////////////////

var RequestState = {
    "Uninitialized": 0,
    "Loading": 1,
    "Completed": 3,
    "Aborted": 4,
    "Error": 5
};

///////////////////////////////////////////////////////////////////////////////
// Add indexOf to Array prototype
///////////////////////////////////////////////////////////////////////////////

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt) {
        var len = this.length;
        var from = 0;

        for (; from < len; from++) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    };
}

///////////////////////////////////////////////////////////////////////////////
// Static class with messages
///////////////////////////////////////////////////////////////////////////////

function Msg() {
}

Msg.ServerNotDefined = function() {
    return "TeamCity server URL is not specified.";
};

Msg.ServerUrlInvalid = function() {
    return "Invalid TeamCity server URL";
};

Msg.ConnectionError = function(status) {

    switch (status) {
        case (401):
            return "Unauthorized: Username or password doesn't match.";  
        default:
            return "Server is stopped or communication with the server is not possible due to network failure.";
    }
};

Msg.LoginRequest = function() {
    return "Please log in to TeamCity server using TeamCity Tray Notifier or Basic Authentication.";
};

Msg.NoConfigurations = function(serverUrl) {
    return "No monitored build configurations or there are no build configurations at all. <a href=\"" + serverUrl + Environment.GetMyProfileUrl() + "\">Edit profile</a>";
};
Msg.Maintenance = function() {
    return "Server is maintaining its database at the moment.";
};

Msg.InvalidResponse = function() {
    return "Response from the TeamCity server is not recognized.";
};

///////////////////////////////////////////////////////////////////////////////
// Static class with validation functions
///////////////////////////////////////////////////////////////////////////////

function Validation() {
}

Validation._GetUrlRegexp = function() {
    return /^(https?:)?(\/|\/\/)?([a-z0-9\-._~%!$&'()*+,;=:]+@)?((?:(?:[a-z0-9\-_~%]+){1}(?:\.[a-z0-9\-_~%]+)*)|(?:(?:[a-f0-9]{1,4}){1}(?:\::?[a-f0-9]{1,4})*)){1}(:[0-9]{1,5})?(\/[a-z0-9\-_~%!$&'()*+,;=:@]+)*\/?$/i;
};

Validation.ValidateAddress = function(url) {

    if (url == null || url == "")
        return ValidationResult.NotDefined;

    // Testing the URL format
    var regexp = Validation._GetUrlRegexp();
    if (regexp.test(url))
        return ValidationResult.Valid;

    return ValidationResult.Invalid;
};

Validation.GetServerAndPort = function (url) {

    var regexp = Validation._GetUrlRegexp();
    var result = regexp.exec(url);
    if (result == null)
        return url;

    if (!result[1] || result[1].toLowerCase() == "")
        result[1] = "http:";
    result[0] = result[1];

    if (!result[2] || result[2].toLowerCase() != "//")
        result[2] = "//";
    result[1] = result[2];

    result[2] = "";
    result.length = 6;
    
    return result.join('');
};

Validation.NormalizeAddress = function(url, useAuthentication) {

    var regexp = Validation._GetUrlRegexp();
    var result = regexp.exec(url);
    if (result == null)
        return url;

    if (!result[1] || result[1].toLowerCase() == "")
        result[1] = "http:";
    result[0] = result[1];

    if (!result[2] || result[2].toLowerCase() != "//")
        result[2] = "//";
    result[1] = result[2];

    result[2] = "";
    url = result.join('');

    if (useAuthentication) {
        url += "/httpAuth";
    }

    return url;
};

///////////////////////////////////////////////////////////////////////////////
// HttpRequest class
///////////////////////////////////////////////////////////////////////////////

function HttpRequest(handler) {
    var self = this;

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {
        this._handler = handler;
        this._clearCache = false;
        this._request = new ActiveXObject("Msxml2.XMLHTTP");
        this._state = RequestState.Uninitialized;
    };
    
    this._SetState = function(state) {
        this._state = state;
        this._handler();
    };
    
    this._OnServerResponse = function() {

        if (self._request.readyState != 4)
            return;

        if (self._request.status == 200) {
            self._SetState(RequestState.Completed);
        } else {
            if (self._request.status == 0) {
                self._SetState(RequestState.Aborted);
            } else {
                self._SetState(RequestState.Error);
            }
        }
    };
    
    this._GetCharSetFromContentType = function(contentType) {

        if (contentType == null)
            return null;

        var regexp = /charset\s*=\s*([a-z0-9\-]+)?/i;
        var result = regexp.exec(contentType);
        if (result == null || result.length < 2)
            return null;

        return result[1];
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.Send = function(url, useAuthentication, userName, userPassword) {

        if (useAuthentication)
            this._request.open("GET", url, true, userName, userPassword);
        else
            this._request.open("GET", url, true);

        if (this._clearCache)
            this._request.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
        
        this._request.onreadystatechange = this._OnServerResponse;
        this._request.send(null);
        this._SetState(RequestState.Loading);
    };
    
    this.Cancel = function() {
        if (this._request.readyState != 4)
            this._request.abort();
    };
    
    this.GetText = function() {

        var contentType = this._request.getResponseHeader("Content-Type");
        
        var charSet = this._GetCharSetFromContentType(contentType);
        if (charSet == null || charSet == "")
            charSet = "ISO-8859-1";

        if (typeof (ActiveXObject) == "undefined" ||
            typeof (System) == "undefined" ||
            typeof (this._request.responseBody) == "undefined")
            return this._request.responseText;

        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 1; // adTypeBinary
        stream.Open();
        stream.Write(this._request.responseBody);
        stream.Position = 0;
        stream.Type = 2; // adTypeText;
        stream.CharSet = charSet;

        return stream.ReadText(stream.Size);
    };
    
    this.GetState = function() {
        return this._state;
    };
    
    this.GetStatus = function() {
        return this._request.status;
    };
    
    this.SetClearCache = function(clearCache) {
        this._clearCache = clearCache;
    };
    
    this._Reset();
}

///////////////////////////////////////////////////////////////////////////////
// RestRequest class
///////////////////////////////////////////////////////////////////////////////

function RestRequest() {
    var self = this;

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._onServerResponse = function () {

        if (self._request.readyState != 4)
            return;

        if (self._request.status == 200) {
            try {
                var text = self._request.responseText;
                var object = !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                    text.replace(/"(\\.|[^"\\])*"/g, ''))) && eval('(' + text + ')');
                self.handler(object);
            } catch (ex) {
                self.handler(null);
            }
        } else {
            self.handler(null);
        }
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.send = function (path) {

        var result = Validation.ValidateAddress(g_teamCityServer);
        if (result != ValidationResult.Valid) {
            return;
        }

        var serverUrl = Validation.NormalizeAddress(g_teamCityServer, g_useBasicAuthentication);
        var url = serverUrl + path;

        this._request = new ActiveXObject("Msxml2.XMLHTTP");
        
        if (g_useBasicAuthentication)
            this._request.open("GET", url, true, g_userName, g_userPassword);
        else
            this._request.open("GET", url, true);

        this._request.setRequestHeader("Accept", "application/json");
        this._request.onreadystatechange = this._onServerResponse;
        this._request.send(null);
    };
}

///////////////////////////////////////////////////////////////////////////////
// Timer class
///////////////////////////////////////////////////////////////////////////////

function Timer(interval, handler) {

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {
        this._handler = handler;
        this._interval = interval;
        this._timer = null;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.Start = function() {
        this._timer = window.setInterval(this._handler, this._interval);
    };
    
    this.Stop = function() {
        if (this._timer != null) {
            window.clearInterval(this._timer);
            this._timer = null;
        }
    };
    
    this.IsOn = function() {
        return (this._timer != null);
    };
    
    this.Restart = function() {
        this.Stop();
        this.Start();
    };
    
    this.SetInterval = function(newInterval) {
        this._interval = newInterval;
    };
    
    this.GetInterval = function() {
        return this._interval;
    };
    this._Reset();
}

///////////////////////////////////////////////////////////////////////////////
// Animation class
///////////////////////////////////////////////////////////////////////////////

function Animation(staticImg, animatedImg, imageName, imagesCount, delay) {
    var self = this;

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {
        this._staticImg = staticImg;
        this._animatedImg = animatedImg;
        this._imageName = imageName;
        this._imagesCount = imagesCount;
        this._delay = delay;
        this._imageIndex = 0;
        this._animating = false;
    };
    
    this._CheckAnimationState = function() {

        if (self._animating || ((self._imageIndex % self._imagesCount) != 0)) {
            self._animatedImg.src = "./images/animation/" + self._imageName + (self._imageIndex++) % 6 + ".gif";
            self._animatedImg.timer = setTimeout(self._CheckAnimationState, self._delay);
        } else {
            self._HideAnimation();
        }
    };
    
    this._HideAnimation = function() {

        this._staticImg.style.display = 'block';
        this._animatedImg.style.display = 'none';

        refresh_button.fireEvent("onmouseup");
    };
    
    this._ShowAnimation = function() {

        this._animatedImg.style.display = 'block';
        this._staticImg.style.display = 'none';

        clearTimeout(this._animatedImg.timer);
        this._CheckAnimationState();
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.Start = function() {
        this._animating = true;
        this._ShowAnimation();
    };
    
    this.Stop = function() {
        this._animating = false;
    };
    
    this.IsAnimating = function() {
        return this._animating;
    };
    
    this._Reset();
}

///////////////////////////////////////////////////////////////////////////////
// Size controller
///////////////////////////////////////////////////////////////////////////////

function SizeController(grip, handler, onMouseDown, onMouseUp) {
    var self = this;

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {

        this._heightArray = [138, 166, 194, 222, 250, 278, 306, 334, 362, 390, 418, 446, 474, 502, 530, 558, 586, 614, 642, 670];
        this._widthArray = [130, 230];

        this._heightIndex = 0;
        this._widthIndex = 0;

        this._grabPointY = 0;
        this._grip = grip;
        this._handler = handler;
        
        this._onMouseDown = onMouseDown;
        this._onMouseUp = onMouseUp;

        this._grip.attachEvent("onmousedown", this._OnGripMouseDown);
        this._grip.attachEvent("onmouseup", this._OnGripMouseUp);

        if (typeof (System) != 'undefined') {
            System.Gadget.onDock = this._OnDockStateChanged;
            System.Gadget.onUndock = this._OnDockStateChanged;
        }
    };
    
    this._OnDockStateChanged = function() {

        if (System.Gadget.docked)
            self._widthIndex = 0;
        else
            self._widthIndex = 1;

        self._handler();
    };
    this._OnGripMouseDown = function(e) {
        if (self._onMouseDown != null)
            self._onMouseDown();
        self._grabPointY = e.clientY;
        self._grip.attachEvent("onmousemove", self._OnGripMouseMove);
    };
    
    this._OnGripMouseUp = function() {
        if (self._onMouseUp != null)
            self._onMouseUp();
        self._grip.detachEvent("onmousemove", self._OnGripMouseMove);
    };
    
    this._OnGripMouseMove = function(e) {

        var diffY = e.clientY - self._grabPointY;

        if (diffY > 0 && self._heightIndex < self._heightArray.length - 1) {
            var distance = self._heightArray[self._heightIndex + 1] - self._heightArray[self._heightIndex];
            if (diffY > distance / 2) {
                self._grabPointY += distance;
                self._Stretch();
            }
        } else if (diffY < 0 && self._heightIndex > 0) {
            var distance = self._heightArray[self._heightIndex] - self._heightArray[self._heightIndex - 1];
            if (-diffY > distance / 2) {
                self._grabPointY -= distance;
                self._Shrink();
            }
        }
    };
    
    this._Shrink = function() {

        if (this._heightIndex == 0)
            return;

        this._heightIndex--;
        this._handler();
    };
    
    this._Stretch = function() {

        if (this._heightIndex == this._heightArray.length - 1)
            return;

        this._heightIndex++;
        this._handler();
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.GetWidth = function() {
        return this._widthArray[this._widthIndex];
    };
    
    this.GetHeight = function() {
        return this._heightArray[this._heightIndex];
    };
    
    this.GetWidthIndex = function() {
        return this._widthIndex;
    };
    
    this.SetWidthIndex = function(index) {
        this._widthIndex = index;
    };
    
    this.GetHeightIndex = function() {
        return this._heightIndex;
    };
    
    this.SetHeightIndex = function(index) {
        this._heightIndex = index;
    };
    
    this._Reset();
}

///////////////////////////////////////////////////////////////////////////////
// Public initializes buttons with event handlers
///////////////////////////////////////////////////////////////////////////////

function Tool() {

    ///////////////////////////////////////////////////////////////////////////////
    // Returns the document element at the specific point
    ///////////////////////////////////////////////////////////////////////////////

    this._ElementFromPoing = function(x, y) {
        return document.elementFromPoint(x, y);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Raises the onmouseout event if mouse leaves the document borders and 
    ///////////////////////////////////////////////////////////////////////////////

    this._RaiseMouseOutIfNeeded = function(x, y) {
        if (x < 0 || y < 0 ||
            x >= document.body.clientWidth ||
            y >= document.body.clientHeight) {
            document.body.fireEvent("onmouseout");
        }
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Swaps the this._button image according to the this._button state
    ///////////////////////////////////////////////////////////////////////////////

    this.SwapImage = function(button) {

        var state = "up";
        var isExtended = button.id.match("_ex$");

        // 1. Minimum button states "_over" & "_up"
        // 2. Extended button states "_down" & "_disabled"
        if (!button.disabled) {
            if (button.over) {
                state = "over";
            } 
            if (button.down && isExtended) {
                state = "down";
            }
        } else if (isExtended) {
            state = "disabled";
        }

        button.src = "./images/" + button.id + "_" + state + ".png";
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Occurs we need to update the image on the button
    ///////////////////////////////////////////////////////////////////////////////

    this.UpdateState = function(button) {

        if (button.disabled) {
            button.over = false;
            button.down = false;
        }

        this.SwapImage(button);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Occurs when the mouse is moved over the this._button. 
    ///////////////////////////////////////////////////////////////////////////////

    this.OnMouseOver = function(button) {
        button.over = true;
        this.SwapImage(button);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Occurs when the mouse pointer leaves the button. 
    ///////////////////////////////////////////////////////////////////////////////

    this.OnMouseOut = function(button) {
        button.over = false;
        this.SwapImage(button);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Occurs when any mouse button is pressed when the pointer is over the button.
    ///////////////////////////////////////////////////////////////////////////////

    this.OnMouseDown = function(button) {
        button.down = true;
        button.setCapture();
        this.SwapImage(button);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Occurs when a mouse button is released when the pointer is over the button.
    ///////////////////////////////////////////////////////////////////////////////

    this.OnMouseUp = function(button, event) {

        button.down = false;
        button.releaseCapture();

        var element = this._ElementFromPoing(event.clientX, event.clientY);
        button.over = (element == button);

        this._RaiseMouseOutIfNeeded();
        this.SwapImage(button);
    };
}

///////////////////////////////////////////////////////////////////////////////
// Static class with helper functions
///////////////////////////////////////////////////////////////////////////////

function Tools() {
}

Tools.MakeSingleLine = function(text) {
    return text.replace(/(\s)/g, "&nbsp;");
};

///////////////////////////////////////////////////////////////////////////////
// Public initializes buttons with event handlers
///////////////////////////////////////////////////////////////////////////////

Tools.InitalizeButtons = function (container) {
   
    var images = container.all.tags("img");
    var tool = new Tool();

    for (var index = 0; index < images.length; index++) {

        var button = images[index];
        if (button.id.match(/(\w+)_image/))
            continue;

        with (button) {
            onmouseover = function () { tool.OnMouseOver(this, event); };
            onmouseout = function () { tool.OnMouseOut(this, event); };
            onmousedown = function () { tool.OnMouseDown(this, event); };
            onmouseup = function () { tool.OnMouseUp(this, event); };
            button.updateState = function () { tool.UpdateState(this, event); };
            updateState();
        }
    }
};

///////////////////////////////////////////////////////////////////////////////
// Static class with environment functions
///////////////////////////////////////////////////////////////////////////////

function Environment() {
}

///////////////////////////////////////////////////////////////////////////////
// Gets the current version of the gadget
///////////////////////////////////////////////////////////////////////////////

Environment.GetVersion = function() {
    return "2.93";
};

///////////////////////////////////////////////////////////////////////////////
// Gets the link to the information about the latest version
///////////////////////////////////////////////////////////////////////////////

Environment.GetVersionUrl = function() {
    return "https://github.com/anisimovsergey/teamcity-gadget/version.dat";
};

///////////////////////////////////////////////////////////////////////////////
// Gets the link to overview page
///////////////////////////////////////////////////////////////////////////////

Environment.OpenOverview = function () {
    OpenBrowser("/overview.html");
};

Environment.OpenMyChanges = function () {

    var request = new RestRequest();
    request.handler = function (version) {
        var myChangesLink = "/myChanges.html";
        if (version != null) {
            // Open changed page starting from version 6.5
            if (version["@versionMajor"] >= 6 && version["@versionMinor"] >= 5) {
                myChangesLink = "/changes.html";
            }
        }
        OpenBrowser(myChangesLink);
    };
    request.send("/app/rest/server");
};

Environment.GetMyProfileUrl = function () {
    return "/profile.html?notificatorType=WindowsTray&tab=userNotifications";
}

Environment.OpenMyProfile = function () {
    OpenBrowser(Environment.GetMyProfileUrl());
};

