////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Contains the code for the settings dialog
///////////////////////////////////////////////////////////////////////////////

var versionRequest;
var tabs = [];
var fakePassword = "@@@@@@@@@@";

// Make sure the "Settings" namespace object exists
if (typeof Settings != 'object') {
    Settings = new Object();
}

///////////////////////////////////////////////////////////////////////////////
// Subscribe for onSettingsClosing event
///////////////////////////////////////////////////////////////////////////////

if (typeof (System) != 'undefined') {
    System.Gadget.onSettingsClosing = OnSettingsClosing;
}

///////////////////////////////////////////////////////////////////////////////
// Initializes the settings dialog
///////////////////////////////////////////////////////////////////////////////

function LoadSettings() {
    ReadSettings();
    ValidateUrl(teamCityServer);

    version.innerText = Environment.GetVersion();
    
    versionRequest = new HttpRequest(OnVersionResponse);
    versionRequest.SetClearCache(true);

    SendVersionRequest();

    tabs[0] = "Connection";
    tabs[1] = "Appearance";

    SelectTab("Connection");
    UpdateAuthentication();

    Tools.InitalizeButtons(AppearanceTab);
    Settings.UpdateAppearanceTab();
}

///////////////////////////////////////////////////////////////////////////////
// Occurs when the user closes the settings dialog
///////////////////////////////////////////////////////////////////////////////

function OnSettingsClosing(event) {
    if (event.closeAction == event.Action.commit)
        WriteSettings();

    // Cancel the version request
    versionRequest.Cancel();
    event.cancel = false;
}

///////////////////////////////////////////////////////////////////////////////
// Occurs when the state of the version request has changed
///////////////////////////////////////////////////////////////////////////////

function OnVersionResponse() {
    switch (versionRequest.GetState()){
        case RequestState.Error:
            ConnectionErrorMessage();
            break;
        case RequestState.Completed:
            UpdateVersion(versionRequest.GetText());
            break;
    }
}

///////////////////////////////////////////////////////////////////////////////
// Reads the settings from the settings storage
///////////////////////////////////////////////////////////////////////////////

function ReadSettings() {
    if (typeof (System) == 'undefined')
        return;
        
    teamCityServer.value = System.Gadget.Settings.read("teamCityServer");
    refreshInterval.value = System.Gadget.Settings.read("refreshInterval");
    useBasicAuthentication.checked = System.Gadget.Settings.read("useBasicAuthentication");
    userName.value = System.Gadget.Settings.read("userName");
    userPassword.value = System.Gadget.Settings.read("userPassword");
    useBuildStateAnimation.checked = System.Gadget.Settings.read("useBuildStateAnimation");
	hideSuccessfulProjects.checked = System.Gadget.Settings.read("hideSuccessfulProjects");
	hideSuccessfulConfigurations.checked = System.Gadget.Settings.read("hideSuccessfulConfigurations");

    var projects = System.Gadget.Settings.read("projects");
    if (projects != "") {
        projects = projects.split(';');
        for (var index = 0; index < projects.length; ++index) {
            projectsList.options.add(new Option(projects[index]));
        }
    } 
}

///////////////////////////////////////////////////////////////////////////////
// Writes the settings into the settings storage
///////////////////////////////////////////////////////////////////////////////

function WriteSettings() {
    if (typeof (System) == 'undefined')
        return;
        
    var normalizedAddress = Validation.NormalizeAddress(teamCityServer.value);
    System.Gadget.Settings.write("teamCityServer", normalizedAddress);
    System.Gadget.Settings.write("refreshInterval", refreshInterval.value);
    System.Gadget.Settings.write("useBasicAuthentication", useBasicAuthentication.checked);
    System.Gadget.Settings.write("userName", userName.value);
    System.Gadget.Settings.write("useBuildStateAnimation", useBuildStateAnimation.checked);
	System.Gadget.Settings.write("hideSuccessfulProjects", hideSuccessfulProjects.checked);
	System.Gadget.Settings.write("hideSuccessfulConfigurations", hideSuccessfulConfigurations.checked);

    if (userPassword.value != fakePassword) {
        System.Gadget.Settings.write("userPassword", userPassword.value);
    }

    var projects = [];
    for (var index = 0; index < projectsList.length; ++index) {
        projects.push(projectsList[index].text);
    }

    System.Gadget.Settings.write("projects", projects.join(';'));
}

///////////////////////////////////////////////////////////////////////////////
// Sends the version validation request
///////////////////////////////////////////////////////////////////////////////

function SendVersionRequest() {
    ConnectingMessage();
    try {
        versionRequest.Send(Environment.GetVersionUrl());
    } catch (ex) {
        ConnectionErrorMessage();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Shows checking for updates message
///////////////////////////////////////////////////////////////////////////////

function ConnectingMessage() {
    connection.innerText = "Checking for updates...";
}

///////////////////////////////////////////////////////////////////////////////
// Shows connection error message
///////////////////////////////////////////////////////////////////////////////

function ConnectionErrorMessage() {
    connection.innerText = "Unable to check for updates.";
}

///////////////////////////////////////////////////////////////////////////////
// Analysis the response from the sever about the updates
///////////////////////////////////////////////////////////////////////////////

function UpdateVersion(serverVersionStr) {
    
    var currentVersion = parseFloat(Environment.GetVersion());
    var serverVersion = parseFloat(serverVersionStr);

    connection.style.display = "none";
    
    if (serverVersion > currentVersion)
        new_update.style.display = "inline"
    else
        no_update.style.display = "inline"
}

///////////////////////////////////////////////////////////////////////////////
// Performs the server URL validation and displays the results
///////////////////////////////////////////////////////////////////////////////

function ValidateUrl(inputField) {

    var result = Validation.ValidateAddress(inputField.value);
    
    if (result == ValidationResult.Valid) {
        invalid_url.style.display = "none";
    } else {
        invalid_url.style.display = "inline";
        if (result == ValidationResult.NotDefined)
            invalid_url.title = Msg.ServerNotDefined();
        else
            invalid_url.title = Msg.ServerUrlInvalid();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Performs the user name validation and displays the results
///////////////////////////////////////////////////////////////////////////////

function ValidateUserName() {

    if (userName.value != "" || !useBasicAuthentication.checked) {
        invalid_userName.style.display = "none";
    } else {
        invalid_userName.style.display = "inline";
    }
}

///////////////////////////////////////////////////////////////////////////////
// Performs the user password validation and displays the results
///////////////////////////////////////////////////////////////////////////////

function ValidateUserPassword() {

    if (userPassword.value != "" || !useBasicAuthentication.checked) {
        invalid_userPassword.style.display = "none";
    } else {
        invalid_userPassword.style.display = "inline";
    }
}

///////////////////////////////////////////////////////////////////////////////
// Selects the specific tab page
///////////////////////////////////////////////////////////////////////////////

function SelectTab(tabName) {

    var tabsText = "";
    for (var index = 0; index < tabs.length; ++index) {
        if (tabs[index] == tabName) {
            tabsText += "<li><span>" + tabName + "</span></li>";
            eval(tabName + "Tab").style.display = 'block';
        } else {
            tabsText += "<li><a href=\"javascript:SelectTab('" + tabs[index] + "')\">" + tabs[index] + "</a></li>";
            eval(tabs[index] + "Tab").style.display = 'none';
        }
    }

    primary.innerHTML = tabsText;
}

///////////////////////////////////////////////////////////////////////////////
// Update state of the controls on the authentication page
///////////////////////////////////////////////////////////////////////////////

function UpdateAuthentication() {

    userName.disabled = !useBasicAuthentication.checked;
    userPassword.disabled = !useBasicAuthentication.checked;

    if (!useBasicAuthentication.checked) {
        userName.value = "";
        userPassword.value = "";
    } 
    
    if (userPassword.value != "") {
        userPassword.value = fakePassword;
    }

    ValidateUserName();
    ValidateUserPassword();
}


///////////////////////////////////////////////////////////////////////////////
// Moves the selected projects up
///////////////////////////////////////////////////////////////////////////////

Settings.MoveUp = function() {
    for (var index = 0; index < projectsList.length; ++index) {
        if (projectsList[index].selected) {
            if (index == 0) {
                break;
            }
            projectsList.options[index - 1].selected = true;
            projectsList.options[index - 1].selected = false;
            Settings.SwapOptions(projectsList, index - 1, index);
        }
    }
    Settings.UpdateAppearanceTab();
}

///////////////////////////////////////////////////////////////////////////////
// Moves the selected projects down
///////////////////////////////////////////////////////////////////////////////

Settings.MoveDown = function() {
    for (var index = projectsList.length - 1; index >= 0; --index) {
        if (projectsList[index].selected) {
            if (index == projectsList.length - 1) {
                break;
            }
            projectsList.options[index + 1].selected = true;
            projectsList.options[index + 1].selected = false;
            Settings.SwapOptions(projectsList, index + 1, index);
        }
    }
    Settings.UpdateAppearanceTab();
}

///////////////////////////////////////////////////////////////////////////////
// Updates controls on appearance tab
///////////////////////////////////////////////////////////////////////////////

Settings.UpdateAppearanceTab = function () {

    if (projectsList.length == 0) {
        arrow_up_button_ex.disabled = true;
        arrow_down_button_ex.disabled = true;
    } else {

        var itemSelected = false;
        for (var index = 0; index < projectsList.length; ++index) {
            if (projectsList[index].selected) {
                itemSelected = true;
                break;
            }
        }

        arrow_up_button_ex.disabled = !itemSelected || projectsList.options[0].selected;
        arrow_down_button_ex.disabled = !itemSelected || projectsList.options[projectsList.length - 1].selected;
    }
    arrow_up_button_ex.updateState();
    arrow_down_button_ex.updateState();

    // Update "Use build state animation" checkbox
    if (useBuildStateAnimation.checked)
        leaf_image.src = "./images/gray_leaf.png";
    else
        leaf_image.src = "./images/green_leaf.png";
}

///////////////////////////////////////////////////////////////////////////////
// Moves the selected projects down
///////////////////////////////////////////////////////////////////////////////

Settings.SwapOptions = function(element, index1, index2) {
    if (typeof element == 'string') { element = document.getElementById(element); }

    // Make sure the indexes are valid
    if (index1 != index2 &&
        index1 >= 0 && index1 < element.options.length &&
        index2 >= 0 && index2 < element.options.length) {

        // Save the selection state of all of the options because Opera
        // seems to forget them when we click the button
        var optionStates = new Array();
        for (i = 0; i < element.options.length; i++) {
            optionStates[i] = element.options[i].selected;
        }

        // Save the first option into a temporary variable
        var option = element.options[index1];

        // Copy the second option into the first option's place
        element.options[index1] =
            new Option(element.options[index2].text,
                       element.options[index2].value,
                       element.options[index2].defaultSelected,
                       element.options[index2].selected);

        // Copy the first option into the second option's place
        element.options[index2] =
            new Option(option.text,
                       option.value,
                       option.defaultSelected,
                       option.selected);

        // Then select the ones we swapped, if they were selected before the swap
        //element.options[index1].selected = optionStates[index2];
        //element.options[index2].selected = optionStates[index1];
    }
}
