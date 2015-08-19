////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// The parser parses the TeamCiy server response and extracts information 
// about Projects, Configurations and Builds. Supported versions:    
// 4.5.5 
// 5.0.1
///////////////////////////////////////////////////////////////////////////////

function HtmlParser() {

    ///////////////////////////////////////////////////////////////////////////////
    // Helper functions
    ///////////////////////////////////////////////////////////////////////////////

    this._Escape = function(text) {
        return text.replace(/&/g, "%26");
    };
    
    this._UnEscape = function(text) {
        return text.replace(/%26/g, "&");
    };
    
    this._LoadHtml = function(html) {
        var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.resolveExternals = false;
        xmlDoc.validateOnParse = false;
        xmlDoc.async = "false";

        // Replacing all <br> with <br/> 
        html = html.replace(/<br>/gi, "<br/>");
	// Removing the multi-line comments
	html = html.replace(/\/\*([\s\S]*?)\*\//g, "");
	// Removing all metas
	html = html.replace(/<meta.*>/gi, "");

        var xmlReady = this._Escape(html);
        xmlDoc.loadXML(xmlReady);

        return xmlDoc;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts build status from the image name
    ///////////////////////////////////////////////////////////////////////////////

    this._GetBuildStatus = function(imageName) {

        imageName = imageName.toLowerCase();

        if (imageName.indexOf("running_red") != -1 ||
            imageName.indexOf("running-red") != -1 ||
	        imageName.indexOf("runningfailing") != -1 ||
            imageName.indexOf("running-failing") != -1)
            return BuildStatus.RunningRed;

        if (imageName.indexOf("running") != -1)
            return BuildStatus.RunningGreen;

        if (imageName.indexOf("success") != -1)
            return BuildStatus.Success;

        if (imageName.indexOf("error") != -1 || 
	        imageName.indexOf("failed") != -1 ||
   	        imageName.indexOf("crashed") != -1 ||
   	        imageName.indexOf("redsign") != -1)
            return BuildStatus.Error;

	    if (imageName.indexOf("finished") != -1)
            return BuildStatus.Success;		

        if (imageName.indexOf("canceled") != -1)
            return BuildStatus.Canceled;

        if (imageName.indexOf("pending") != -1)
            return BuildStatus.Pending;

        return BuildStatus.Unknown;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts build type from the image name
    ///////////////////////////////////////////////////////////////////////////////

    this._IsBuildPersonal = function(imageName) {

        var imageName = imageName.toLowerCase();
        return (imageName.indexOf("personal") != -1);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts configuration status from the image name
    ///////////////////////////////////////////////////////////////////////////////

    this._GetConfigurationStatus = function(configImage) {

        var srcAttr = configImage.getAttribute("src");
        if (srcAttr == null)
            return ConfigurationStatus.Unknown;

        var imageName = srcAttr.toLowerCase();

        if (imageName.indexOf("success") != -1)
            return ConfigurationStatus.Success;

        if (imageName.indexOf("errorwithresp") != -1 ||
            imageName.indexOf("investigate") != -1)
            return ConfigurationStatus.Fixing;

        if (imageName.indexOf("error") != -1)
            return ConfigurationStatus.Error;

        if (imageName.indexOf("fixed") != -1)
            return ConfigurationStatus.Fixed;

        if (imageName.indexOf("paused") != -1 ||
            imageName.indexOf("archived") != -1)
            return ConfigurationStatus.Paused;

        if (imageName.indexOf("ignored") != -1)
            return ConfigurationStatus.Ignored;

        if (imageName.indexOf("pending") != -1)
            return ConfigurationStatus.Pending;

        return ConfigurationStatus.Unknown;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts configuration data from the build node
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractConfigurationStatusMessage = function(configurationElement) {

        if (configurationElement == null)
            throw "configurationElement is null";

        var configImage = configurationElement.selectSingleNode(".//img");
        if (configImage == null)
            return null;

        var statusElement = this._GetStatusElement(configImage);
        if (statusElement == null)
            return null;

        return this._ExtractStatusMessage(statusElement);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts build data from the build node
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractBuidNumber = function(buildElement) {

        if (buildElement == null)
            throw "buildElement is null";

        var buildNumberNode = buildElement.selectSingleNode(".//td[@class = \"buildNumber\"]");
        if (buildNumberNode == null)
            return null;

        return this._UnEscape(buildNumberNode.text);
    };
    
    this._ExtractBuidStatusToolTip = function(buildElement) {

        if (buildElement == null)
            throw "buildElement is null";

        var buildImage = buildElement.selectSingleNode(".//td[not(@class)]/img");
        if (buildImage == null)
            return null;

        var statusElement = this._GetStatusElement(buildImage);
        if (statusElement == null)
            return null;

        return this._ExtractStatusToolTip(statusElement);
    };
    
    this._ExtractLinkText = function(buildElement, xPath) {

        if (buildElement == null)
            throw "buildElement is null";

        var buildLink = buildElement.selectSingleNode(xPath);
        if (buildLink == null)
            return null;

        return this._UnEscape(buildLink.text);
    };
    
    this._ExtractLinkHref = function(buildElement, xPath) {

        if (buildElement == null)
            throw "buildElement is null";

        var buildLink = buildElement.selectSingleNode(xPath);
        if (buildLink == null)
            return null;

        var href = buildLink.attributes.getNamedItem("href");
        if (href == null)
            return null;

        return this._UnEscape(href.text);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts additional data of the configuration
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractConfigurationData = function(configurationElement) {

        if (configurationElement == null)
            throw "configurationElement is null";

        var statusMessage = this._ExtractConfigurationStatusMessage(configurationElement);
        return new ConfigurationData(statusMessage);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts additional data of the build
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractBuildData = function(buildElement) {

        if (buildElement == null)
            throw "buildElement is null";

        var buildNumber = this._ExtractBuidNumber(buildElement);
        var statusToolTip = this._ExtractBuidStatusToolTip(buildElement);
        var buildResults = this._ExtractLinkText(buildElement, ".//td[not(@class)]/a");
        var buildResultsLink = this._ExtractLinkHref(buildElement, ".//td[not(@class)]/a");
        var buildChanges = this._ExtractLinkText(buildElement, ".//td[@class = \"changesColumn\"]/a");
        var buildChangesLink = this._ExtractLinkHref(buildElement, ".//td[@class = \"changesColumn\"]/a");

        return new BuildData(buildNumber, statusToolTip, buildResults, buildResultsLink, buildChanges, buildChangesLink);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts status tool tip from status element (removes all <br/> tags)
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractStatusToolTip = function(statusElement) {

        if (statusElement == null)
            throw "statusElement is null";

        if (statusElement.childNodes.length < 4)
            return statusElement.text;

        var toolTip = new Array();
        var childNodes = statusElement.childNodes;
    
        for (var i = 0; i < childNodes.length - 1; i++) {
            if (statusElement.childNodes[i].xml == "<br/>")
                toolTip.push(". ");
            toolTip.push(statusElement.childNodes[i].text);
        }
        
        toolTip.push(" ");
        toolTip.push(statusElement.childNodes[childNodes.length - 1].text);

        return toolTip.join('');
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts status message from status element (retains all <br/> tags)
    ///////////////////////////////////////////////////////////////////////////////

    this._ExtractStatusMessage = function(statusElement) {

        var buffer = [];

        for (i = 0; i < statusElement.childNodes.length; i++)
            buffer.push(this._UnEscape(statusElement.childNodes[i].xml));

        return buffer.join('');
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Retrieves tooltip from onmouseover event handler
    ///////////////////////////////////////////////////////////////////////////////

    this._GetStatusElement = function(configImage) {

        var toolTipTextNode = configImage.attributes.getNamedItem("onmouseover");
        if (toolTipTextNode == null)
            return null;

        // V 6.5
        var toolTipText = toolTipTextNode.text;
        if (toolTipText.indexOf("BS.Tooltip.showMessage(") == 0) {
            toolTipText = toolTipText.replace("BS.Tooltip.showMessage(", "HtmlParser.ToolTipParser(");
            
            ruler.innerText = "";
            try {
                ruler.innerHTML = eval(toolTipText);
            } catch (err) {
                var toolTipDoc = this._LoadHtml("<doc></doc>");
                return toolTipDoc.documentElement;
            }

            var toolTipDoc = this._LoadHtml("<doc>" + ruler.innerText + "</doc>");
            return toolTipDoc.documentElement;
        }

        toolTipText = toolTipTextNode.text.split('"');
        if (toolTipText.length < 3)
            return null;

        toolTipText = toolTipText[1];
        if (toolTipText.indexOf("dataHover_") == 0)
            return configImage.selectSingleNode("../div[@id = \"" + toolTipText + "\"]");

        // Artificially create XML element
        ruler.innerText = "";
        try {
            ruler.innerHTML = eval("unescape(\"" + toolTipText + "\");");
        } catch (err) {
            var toolTipDoc = this._LoadHtml("<doc></doc>");
            return toolTipDoc.documentElement;
        }

        var toolTipDoc = this._LoadHtml("<doc>" + ruler.innerText + "</doc>");
        return toolTipDoc.documentElement;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Parses a build table row and creates a build
    ///////////////////////////////////////////////////////////////////////////////

    this._ParseBuild = function(buildRow) {

        var buildImage = buildRow.selectSingleNode(".//td[not(@class)]/img");
        if (buildImage != null) {
            var srcAttr = buildImage.getAttribute("src");
        } else {
            buildImage = buildRow.selectSingleNode(".//td/span[@id]");
            if (buildImage == null)
                return null;

            srcAttr = buildImage.getAttribute("class");
        }

        if (srcAttr == null)
            return null;

        var buildStatus = this._GetBuildStatus(srcAttr);
        var isPersonal = this._IsBuildPersonal(srcAttr);

        return new Build(buildStatus, isPersonal, buildRow);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Parses the table of builds and creates a builds array
    ///////////////////////////////////////////////////////////////////////////////

    this._ParseBuilds = function(buildNode) {

        var builds = [];

        var buildsTable = buildNode.nextSibling;
        if (buildsTable == null || buildsTable.nodeName != "table")
            return builds;

        var buildsRows = buildsTable.selectNodes(".//tr");
        for (var i = 0; i < buildsRows.length; i++) {

            var buildRow = buildsRows[i];

            var build = this._ParseBuild(buildRow);
            if (build == null)
                continue;

            builds.push(build);
        }

        return builds;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Parses a project node and creates a project
    ///////////////////////////////////////////////////////////////////////////////

    this._ParseProject = function(projectNode) {

        var projectName = projectNode.text;
        return new Project(projectName);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Parses a configuration node and creates a configuration
    ///////////////////////////////////////////////////////////////////////////////

    this._ParseConfiguration = function(configNode, project) {

        var configImage = configNode.selectSingleNode(".//img");
        var configLink = configNode.selectSingleNode(".//a");

        if (configImage == null || configLink == null)
            return null;

        var linkAttr = configLink.attributes.getNamedItem("href");
        if (linkAttr == null)
            return null;

        var name = this._UnEscape(configLink.text);
        var status = this._GetConfigurationStatus(configImage);
        var link = this._UnEscape(linkAttr.text);

        var configuration = new Configuration(name, status, link, project, configNode);
        configuration.Builds = this._ParseBuilds(configNode);

        return configuration;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Parses a TeamCiy server response and extracts information.
    ///////////////////////////////////////////////////////////////////////////////

    this._ParseXml = function(xmlDoc) {

        var projects = [];
        var currentProject = null;

        var projectNodes = xmlDoc.selectNodes("//div[@class = \"projectHeader\" or @class = \"buildConfigurationName\"]");
        for (var i = 0; i < projectNodes.length; i++) {
            var node = projectNodes[i];

            if (node.attributes.getNamedItem("class").value == "projectHeader") {
                if (currentProject != null)
                    projects.push(currentProject);

                currentProject = this._ParseProject(node);
            } else {
                if (currentProject == null)
                    continue;

                var configuration = this._ParseConfiguration(node, currentProject);
                if (configuration != null)
                    currentProject.Configurations.push(configuration);
            }
        }

        if (currentProject != null)
            projects.push(currentProject);

        return projects;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////
    // Resets the class into the initial state
    ///////////////////////////////////////////////////////////////////////////////

    this.Reset = function() {
        this._errorCode = 0;
        this._projects = [];
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Loads and parses TeamCity server response
    ///////////////////////////////////////////////////////////////////////////////
    
    this.ProcessHtml = function(html) {
        this.Reset();

        var xmlDoc = this._LoadHtml(html);
        if (xmlDoc.parseError.errorCode != 0) {
            this._errorCode = -1;
	    this._errorMessage = "Line:" + xmlDoc.parseError.line + " Error:" + xmlDoc.parseError.reason;
            return;
        }

        this._projects = this._ParseXml(xmlDoc);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the current error code
    ///////////////////////////////////////////////////////////////////////////////

    this.GetErrorCode = function() {
        return this._errorCode;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the projects array
    ///////////////////////////////////////////////////////////////////////////////

    this.GetProjects = function() {
        return this._projects;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Extracts additional data of the configuration and builds
    ///////////////////////////////////////////////////////////////////////////////

    this.ParseDataElement = function(configuration) {

        var configData = this._ExtractConfigurationData(configuration.GetDataElement());
        configuration.SetData(configData);

        for (var buildIndex = 0; buildIndex < configuration.Builds.length; ++buildIndex) {
            var build = configuration.Builds[buildIndex];

            var buildData = this._ExtractBuildData(build.GetDataElement());
            build.SetData(buildData);
        }
    };
    
    this.Reset();
}

HtmlParser.ToolTipParser = function(a, b, message) {
    message = message.replace(/%26/g, "&");
    message = message.replace(/&lt;br&gt;/gi, " ");
    return message;
};