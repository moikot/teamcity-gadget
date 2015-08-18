////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// TeamCity Gadget for Windows Vista, Windows 7
///////////////////////////////////////////////////////////////////////////////

var scrollbar = null;
var htmlParser = null;
var htmlBuilder = null;
var serverRequest = null;       
var refreshTimer = null;
var loadAnimation = null;
var sizeController = null;
var clickedConf = null;

///////////////////////////////////////////////////////////////////////////////
// The OnPageLoad method is the entry point of the gadget.
///////////////////////////////////////////////////////////////////////////////

function OnPageLoad() {

    window.detachEvent("onload", OnPageLoad);
    window.attachEvent("onunload", OnPageUnload);

    Tools.InitalizeButtons(scrollbar_panel);
    Tools.InitalizeButtons(buttons_panel);

    scrollbar = new ScrollBar();
    htmlParser = new HtmlParser();
    htmlBuilder = new HtmlBuilder();
    serverRequest = new HttpRequest(OnRequestStateChanged);
    refreshTimer = new Timer(30000, Refresh);
    loadAnimation = new Animation(refresh_button, loading_image, "loading", 6, 100);
    sizeController = new SizeController(grip, OnSizeChanged, HideFlyout);
    
    ReadSettings();
    SetBodySize(sizeController.GetWidth(), sizeController.GetHeight());

    if (typeof (System) != 'undefined') {
        System.Gadget.settingsUI = "settings.html";
        System.Gadget.onSettingsClosed = OnSettingsClosed;
        System.Gadget.visibilityChanged = OnVisibilityChanged;
        System.Gadget.onShowSettings = OnSettingsShow;
    }

    SetButtonsEnabled(false); 
    Refresh();
}

///////////////////////////////////////////////////////////////////////////////
// Event handlers
///////////////////////////////////////////////////////////////////////////////

function OnPageUnload() {
    window.detachEvent("onunload", OnPageUnload);
    
    if (serverRequest != null)
        serverRequest.Cancel();
}

function OnSettingsClosed() {
    ReadSettings();
    Refresh();
}

function OnSettingsShow() {

    var currentProjects = GetSortedProjects();
    if (currentProjects.length == 0)
        return;
    
    var projects = [];
    for (var index = 0; index < currentProjects.length; ++index) {
        projects.push(currentProjects[index].GetName());
    }

    System.Gadget.Settings.write("projects", projects.join(';'));
}

function OnVisibilityChanged() {
    if (System.Gadget.visible) {
        Refresh();
    } else {
        Suspend();
    }
}

function OnSizeChanged() {

    var updateIsNeeded = false;
    if (document.body.style.width != sizeController.GetWidth() + "px")
        updateIsNeeded = true;

    SetBodySize(sizeController.GetWidth(), sizeController.GetHeight());

    if (updateIsNeeded)
        UpdateContent();

    SaveSize();        
}

function OnRequestStateChanged() {

    if (serverRequest.GetState() == RequestState.Uninitialized ||
        serverRequest.GetState() == RequestState.Loading)
        return;

    loadAnimation.Stop();

    if (serverRequest.GetState() == RequestState.Completed) {
        ProcessResponse(serverRequest.GetText());
    } else if (serverRequest.GetState() == RequestState.Error) {
        ClearContent();
        ShowWarning(Msg.ConnectionError(serverRequest.GetStatus()));
    }

    if (System.Gadget.visible) {
    	refreshTimer.Start();
    }
}

///////////////////////////////////////////////////////////////////////////////
// Layout calculation
///////////////////////////////////////////////////////////////////////////////

function SetBodySize(width, height) {

    document.body.style.width = width + "px";
    document.body.style.height = height + "px";

    background.style.width = width + "px";
    background.style.height = height + "px";
    background.src = "url('./images/background/bg_" + width + "x" + height + ".png')";

    htmlBuilder.SetPanelWidth(width - 10);

    buttons_panel.style.top = (height - 19) + "px";
    grip.style.left = (width - 17) + "px";

    content_panel_fixed.style.width = (width - 10) + "px";
    content_panel_fixed.style.height = (height - 26) + "px";

    scrollbar_panel.style.left = (width - 13) + "px";
    scrollbar_panel.style.height = (height - 26) + "px";

    scrollbar.SetHeight(height - 26);   
    scrollbar.Update();
}

///////////////////////////////////////////////////////////////////////////////
// Core functions
///////////////////////////////////////////////////////////////////////////////

function Refresh() {

    refreshTimer.Stop();

    var result = Validation.ValidateAddress(g_teamCityServer);
    if (result != ValidationResult.Valid) {

        if (result == ValidationResult.NotDefined)
            ShowWarning(Msg.ServerNotDefined());
        else
            ShowWarning(Msg.ServerUrlInvalid());

        SetButtonsEnabled(false);
    } else {

        try {
            loadAnimation.Start();
            serverRequest.Send(GetUserStatusUrl(), g_useBasicAuthentication, g_userName, g_userPassword);
        } catch (ex) {
            loadAnimation.Stop();
            SetButtonsEnabled(false);
            ShowWarning(Msg.ConnectionError());
        }
    }
}

function Suspend() {
    refreshTimer.Stop();
    serverRequest.Cancel();
}

function ProcessResponse(responseText) {

    if (responseText.indexOf("<div id=\"loginPage\">") != -1) {
        ShowInformation(Msg.LoginRequest());
        SetButtonsEnabled(false);
        return;
    }

    if (responseText.indexOf("<div class=\"maintenanceMessage\">") != -1) {
        ShowInformation(Msg.Maintenance());
        SetButtonsEnabled(false);
        return;
    }
    
    htmlParser.ProcessHtml(responseText);
    if (htmlParser.GetErrorCode() == 0) {
        SetButtonsEnabled(true);
        UpdateContent(true);
    } else {
        SetButtonsEnabled(false);
        ShowWarning(Msg.InvalidResponse() + htmlParser._errorMessage);
    }
}

function SetContent(html, height) {
    
    content_panel.innerHTML = html;

    if (height != null)
        scrollbar.SetTotalHeight(height);
    else
        scrollbar.SetTotalHeight(content_panel.offsetHeight);
        
    scrollbar.Update();
}

function ClearContent() {
    htmlParser.Reset();
    SetContent('');
}

function UpdateContent(force) {

    var currentProjects = GetSortedProjects();
    if (currentProjects.length == 0) {
        if (force) {
            HideFlyout();
            ShowInformation(Msg.NoConfigurations(g_teamCityServer));
        }
        return;
    }

    // Update server name
    var serverName = Validation.GetServerAndPort(g_teamCityServer);
    htmlBuilder.SetServerName(serverName);

    // Build gadget HTML 
    var htmlData = htmlBuilder.GetHtml(currentProjects);
    SetContent(htmlData.GetHtml(), htmlData.Height);

    if (clickedConf != null)
		UpdateFlyoutContent(clickedConf);
}

function SetButtonsEnabled(enabled) {
    collapse_all.disabled = !enabled;
    expand_all.disabled = !enabled;
    projects.disabled = !enabled;
    my_changes.disabled = !enabled;
    my_settings.disabled = !enabled;
}

function GetSortedProjects() {
    
    currentProjects = htmlParser.GetProjects();

    // Sort project usng g_sortedProjects array
    if (currentProjects.length != 0) {
        currentProjects.sort(function(proj1, proj2) {

            var name1 = proj1.GetName();
            var name2 = proj2.GetName();

            var index1 = g_sortedProjects.indexOf(name1);
            var index2 = g_sortedProjects.indexOf(name2);

            var diff = index1 - index2;
            if (diff == 0)
                return name1.localeCompare(name2);
            else
                return diff;
        });
    }
        
   return currentProjects;     
}

///////////////////////////////////////////////////////////////////////////////
// Settings
///////////////////////////////////////////////////////////////////////////////

function ReadSettingsValue(parameterName, defaultValue) {

    var value = System.Gadget.Settings.read(parameterName);
    if (value.toString() == "") {
        value = defaultValue;
        System.Gadget.Settings.write(parameterName, value);
    }

    return value;
}

function ReadSettings() {

    // Check for the standalone mode
    if (typeof (System) == 'undefined')
        return;

    var refreshInterval = ReadSettingsValue("refreshInterval", refreshTimer.GetInterval());
    if (refreshInterval != refreshTimer.GetInterval()) {
        refreshTimer.SetInterval(refreshInterval);
        if (refreshTimer.IsOn()) {
            refreshTimer.Restart();
        }
    }

    var heightIndex = ReadSettingsValue("heightIndex", sizeController.GetHeightIndex());
    sizeController.SetHeightIndex(heightIndex);
    
    var teamCityServer = ReadSettingsValue("teamCityServer", g_teamCityServer);
    var useBasicAuthentication = ReadSettingsValue("useBasicAuthentication", g_useBasicAuthentication);
    var userName = ReadSettingsValue("userName", g_userName);
    var userPassword = ReadSettingsValue("userPassword", g_userPassword);
    var useBuildStateAnimation = ReadSettingsValue("useBuildStateAnimation", htmlBuilder.GetUseBuildStateAnimation());
	var hideSuccessfulConfigurations = ReadSettingsValue("hideSuccessfulConfigurations", htmlBuilder.GetHideSuccessfulConfigurations());
	var hideSuccessfulProjects = ReadSettingsValue("hideSuccessfulProjects", htmlBuilder.GetHideSuccessfulProjects());
    
    if (teamCityServer != g_teamCityServer ||
        useBasicAuthentication != g_useBasicAuthentication ||
        userName != g_userName || userPassword != g_userPassword ||
        useBuildStateAnimation != htmlBuilder.GetUseBuildStateAnimation() ||
		hideSuccessfulConfigurations != htmlBuilder.GetHideSuccessfulConfigurations() ||
		hideSuccessfulProjects != htmlBuilder.GetHideSuccessfulProjects()) {

        g_teamCityServer = teamCityServer;
        g_useBasicAuthentication = useBasicAuthentication;
        g_userName = userName;
        g_userPassword = userPassword;
        htmlBuilder.SetUseBuildStateAnimation(useBuildStateAnimation);
		htmlBuilder.SetHideSuccessfulConfigurations(hideSuccessfulConfigurations);
		htmlBuilder.SetHideSuccessfulProjects(hideSuccessfulProjects);

        ClearContent();
    }

    var collapsedProjects = ReadSettingsValue("collapsedProjects", "");
    if (collapsedProjects != "") {
        collapsedProjects = collapsedProjects.split(';');
        for (var index = 0; index < collapsedProjects.length; ++index) {
            htmlBuilder.SetProjectCollapsed(collapsedProjects[index], true);
        }
    }

    var projects = ReadSettingsValue("projects", "");
    if (projects != "" && g_sortedProjects.join(';') != projects) {
        projects = projects.split(';');
        g_sortedProjects.length = 0;
        for (var index = 0; index < projects.length; ++index) {
            g_sortedProjects.push(projects[index]);
        }
    } 
}

function SaveSize() {
    // Check for the standalone mode
    if (typeof (System) == 'undefined')
        return;

    // Save the height index
    System.Gadget.Settings.write("heightIndex", sizeController.GetHeightIndex());
}

function SaveCollapsedProjects() {

    // Check for the standalone mode
    if (typeof (System) == 'undefined')
        return;

    // Save the collapsed projects list
    var collapsedProjects = [];
    var projects = htmlParser.GetProjects();

    for (var index = 0; index < projects.length; ++index) {
    
        var projectName = projects[index].GetName();
        if (htmlBuilder.IsProjectCollapsed(projectName))
            collapsedProjects.push(projectName);
    }
    
    System.Gadget.Settings.write("collapsedProjects", collapsedProjects.join(';'));
}

///////////////////////////////////////////////////////////////////////////////
// Expanding/Collapsing projects
///////////////////////////////////////////////////////////////////////////////

function Collapse(obj, projectName) {
    htmlBuilder.SetProjectCollapsed(projectName, true);
    UpdateContent();
    SaveCollapsedProjects();
}

function CollapseAll() {

    var projects = htmlParser.GetProjects();
    for (var index = 0; index < projects.length; ++index)
        htmlBuilder.SetProjectCollapsed(projects[index].GetName(), true);

    UpdateContent();
    SaveCollapsedProjects();
}

function Expand(obj, projectName) {
    htmlBuilder.SetProjectCollapsed(projectName, false);
    UpdateContent();
    SaveCollapsedProjects();
}

function ExpandAll() {

    var projects = htmlParser.GetProjects();
    for (var index = 0; index < projects.length; ++index)
        htmlBuilder.SetProjectCollapsed(projects[index].GetName(), false);

    UpdateContent();
    SaveCollapsedProjects();
}

///////////////////////////////////////////////////////////////////////////////
// Flyout
///////////////////////////////////////////////////////////////////////////////

function ShowFlyout(configurationLink) {

    if (!System.Gadget.Flyout.show) {
        System.Gadget.Flyout.file = "flyout_details.html";
        System.Gadget.Flyout.show = true;
        clickedConf = configurationLink;

        System.Gadget.Flyout.onShow = function() {
            UpdateFlyoutContent(clickedConf);
        };
        System.Gadget.Flyout.onHide = function() {
            clickedConf = null;
        };
    } else {
        if (clickedConf != configurationLink) {
            clickedConf = configurationLink;
            UpdateFlyoutContent(configurationLink);
        } else {
            System.Gadget.Flyout.show = false;
        }
    }
}

function HideFlyout() {
    System.Gadget.Flyout.show = false;
}

function UpdateFlyoutContent(configurationLink) {

    try {
        if (!System.Gadget.Flyout.show)
            return;
            
        var configuration = GetConfigurationByLink(configurationLink);
        if (configuration == null)
            return;

        var flyoutDocument = System.Gadget.Flyout.document;
        UpdateFlyoutDocument(flyoutDocument, configuration);
    }
    catch (e) {
        //catch slow flyout - no div object will be available.
    }
}

function GetConfigurationByLink(configurationLink) {

    var projects = htmlParser.GetProjects();
    
    for (var projIndex = 0; projIndex < projects.length; ++projIndex) {
        var project = projects[projIndex];
        
        for (var confIndex = 0; confIndex < project.Configurations.length; ++confIndex) {
        
            var conf = project.Configurations[confIndex];        
            if (conf.GetLink() == configurationLink)
                return conf;
        }
    }
    return null;
}

function UpdateFlyoutDocument(document, config) {

    var project = config.GetProject();
    if (project != null) {
        document.getElementById("flyoutProjectLink").innerHTML = project.GetName();
        document.getElementById("flyoutProjectLink").setAttribute("title", project.GetName());
    }

    document.getElementById("flyoutConfigLink").innerHTML = config.GetName();
    document.getElementById("flyoutConfigLink").href = htmlBuilder.GetServerName() + config.GetLink();
    document.getElementById("flyoutConfigLink").setAttribute("title", config.GetName());

    // Initialize additional data for flyout
    if (config.GetData() == null)
        htmlParser.ParseDataElement(config);

    document.getElementById("flyoutConfigState").innerHTML = htmlBuilder.GetFlyoutConfigurationHtml(config);
    document.getElementById("flyoutBuildStates").innerHTML = htmlBuilder.GetFlyoutBuildsTableHtml(config);
}

///////////////////////////////////////////////////////////////////////////////
// Utilities
///////////////////////////////////////////////////////////////////////////////

function GetUserStatusUrl() {
    var serverUrl = Validation.NormalizeAddress(g_teamCityServer, g_useBasicAuthentication);
    return serverUrl + "/win32/userStatus.html";
}

function OpenBrowser(pageName) {
    // Check for the standalone mode
    if (typeof (System) == 'undefined')
        return;

    var result = Validation.ValidateAddress(g_teamCityServer);
    if (result != ValidationResult.Valid)
        return;

    System.Shell.execute(g_teamCityServer + pageName);
}

function ShowWarning(message) {

    var html = new Array();

    html.push("<div class=\"warning\">");
    html.push(message);
    html.push("</div>");

    SetContent(html.join(''));
}

function ShowInformation(message) {
    var html = new Array();

    html.push("<div class=\"information\">");
    html.push(message);
    html.push("</div>");

    SetContent(html.join(''));
}

function CloseOnEscape() {
    switch (event.keyCode) {
        case 27:
            HideFlyout();
            break;
    }
}

