////////////////////////////////////////////////////////////////////////////////
//
// THIS CODE IS NOT APPROVED FOR USE IN/ON ANY OTHER UI ELEMENT OR PRODUCT COMPONENT.
// Copyright (c) 2009 Sergey Anisimov. All rights reserved.
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// The builder builds HTML view on the projects with corresponding 
// configurations and builds.
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// HtmlData serves as a container of html builder results
///////////////////////////////////////////////////////////////////////////////

function HtmlData() {

    ///////////////////////////////////////////////////////////////////////////////
    // Constructor
    ///////////////////////////////////////////////////////////////////////////////

    this._Reset = function() {
        this.Html = [];
        this.Height = 0;
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    this.GetHtml = function() {
        return this.Html.join('');
    };
    
    this.Push = function(str) {
        this.Html.push(str);
    };
    
    this._Reset();
};

function HtmlBuilder() {

    ///////////////////////////////////////////////////////////////////////////////
    // Gets project background color which corresponds to the configuration status 
    ///////////////////////////////////////////////////////////////////////////////

    this._GetProjectBackgroundColor = function(configuationStatus) {
        switch (configuationStatus) {
            case ConfigurationStatus.Success:
                return "green";
            case ConfigurationStatus.Error:
                return "red";
            case ConfigurationStatus.Fixing:
            case ConfigurationStatus.Fixed:
                return "orange";
            case ConfigurationStatus.Pending:
            case ConfigurationStatus.Paused:
                return "blue";
            case ConfigurationStatus.Ignored:
            case ConfigurationStatus.Unknown:
                return "gray";
            default: return "gray";
        }
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the path to the image which corresponds to the build status
    ///////////////////////////////////////////////////////////////////////////////

    this._GetBuildStatusImage = function(buildStatus) {

        var imageName;
        switch (buildStatus) {
            case BuildStatus.Success:
                imageName = "success.png";
                break;
            case BuildStatus.Error:
                imageName = "error.png";
                break;
            case BuildStatus.RunningGreen:
                imageName = "running_green.gif";
                break;
            case BuildStatus.RunningRed:
                imageName = "running_red.gif";
                break;
            case BuildStatus.Pending:
                imageName = "pending.png";
                break;
            case BuildStatus.Canceled:
                imageName = "canceled.png";
                break;      
            case BuildStatus.Unknown:
                imageName = "gray.png";
                break;
            default:
                imageName = "gray.png";
        }
        return "./images/states/" + imageName;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the path to the image which corresponds to the personal build status
    ///////////////////////////////////////////////////////////////////////////////

    this._GetPersonalBuildImage = function(buildStatus) {

        var imageName;
        switch (buildStatus) {
            case BuildStatus.Success:
                imageName = "person_green.png";
                break;
            case BuildStatus.Error:
                imageName = "person_red.png";
                break;
            case BuildStatus.RunningGreen:
                imageName = "person_green.png";
                break;
            case BuildStatus.RunningRed:
                imageName = "person_red.png";
                break;
            case BuildStatus.Pending:
                imageName = "person_blue.png";
                break;
            case BuildStatus.Canceled:
                imageName = "person_blue.png";
                break;
            case BuildStatus.Unknown:
                imageName = "person_gray.png";
                break;
            default:
                imageName = "person_gray.png";
        }
        return "./images/states/" + imageName;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the path to the image which corresponds to the configuration status
    ///////////////////////////////////////////////////////////////////////////////

    this._GetConfigurationStatusImage = function(configurationStatus) {

        var imageName;
        switch (configurationStatus) {
            case ConfigurationStatus.Success:
                imageName = "success.png";
                break;
            case ConfigurationStatus.Error:
                imageName = "error.png";
                break;
            case ConfigurationStatus.Fixing:
                imageName = "fixing.png";
                break;
            case ConfigurationStatus.Fixed:
                imageName = "fixed.png";
                break;
            case ConfigurationStatus.Ignored:
                imageName = "ignored.png";
                break;
            case ConfigurationStatus.Paused:
                imageName = "paused.png";
                break;
            case ConfigurationStatus.Pending:
                imageName = "pending.png";
                break;
            case ConfigurationStatus.Unknown:
                imageName = "gray.png";
                break;
            default:
                imageName = "gray.png";
        }
        return "./images/states/" + imageName;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the colorized project background by the specific configuration state
    ///////////////////////////////////////////////////////////////////////////////
    
    this._GetProjectBackground = function(htmlData, configuationStatus, width) {

        var projectBkgColor = this._GetProjectBackgroundColor(configuationStatus);

        htmlData.Push("<img class=\"background_");
        htmlData.Push(projectBkgColor);
        htmlData.Push("\" src=\"./images/dot.png\" width=\"");
        htmlData.Push(width);
        htmlData.Push("\"/>");
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the composite colorized project background by the configuration states
    ///////////////////////////////////////////////////////////////////////////////

    this._GetProjectItemBackground = function(htmlData, project) {

        var configsCount = project.Configurations.length;
        if (configsCount == 0) {
            this._GetProjectBackground(htmlData, ConfigurationStatus.Unknown, this._width);
            return;
        }

        var pixelsPerProject = this._width / configsCount;
        var currentLeft = 0;
        var currentRight = pixelsPerProject;

        for (var index = 0; index < configsCount - 1; ++index) {
            var configurationStatus = project.Configurations[index].GetStatus();
            var width = Math.round(currentRight) - currentLeft;

            this._GetProjectBackground(htmlData, configurationStatus, width);

            currentRight = currentRight + pixelsPerProject;
            currentLeft = currentLeft + width;
        }

        configurationStatus = project.Configurations[configsCount - 1].GetStatus();
        width = this._width - currentLeft;

        this._GetProjectBackground(htmlData, configurationStatus, width);
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the html for collapse/expand image
    ///////////////////////////////////////////////////////////////////////////////

    this._GetProjectItemImage = function(htmlData, project) {

        var projectName = project.GetName();
        
        if (this.IsProjectCollapsed(projectName))
            htmlData.Push('<img class="project_button" title = "Expand" src="./images/expand.png" onclick="Expand(this, \'' + projectName + '\');"/>');
        else
            htmlData.Push('<img class="project_button" title = "Collapse" src="./images/collapse.png" onclick="Collapse(this, \'' + projectName + '\');"/>');
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Combines the build image and the build tooltip
    ///////////////////////////////////////////////////////////////////////////////

    this._CombineBuildHtml = function(htmlData, buildImage) {

        htmlData.Push("<div class=\"config_item_buld_image\"><img src=\"");
        htmlData.Push(buildImage);
        htmlData.Push("\"/></div>");
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the configuration builds
    ///////////////////////////////////////////////////////////////////////////////

    this._GetAnimatedImage = function(imageName) {

        if (this._useBuildStateAnimation)
            return  "./images/states/running_" + imageName + ".gif";
        else
            return  "./images/states/not_running_" + imageName + ".png";
    };

    this._GetRunningBuildImage = function (configuration) {

        var buildStatus = BuildStatus.Unknown;

        for (var i = 0; i < configuration.Builds.length; i++) {
            var build = configuration.Builds[i];
            var status = build.GetStatus();

            // Skip all states except RunningGreen and RunningRed
            if (status != BuildStatus.RunningGreen &&
                status != BuildStatus.RunningRed)
                continue;

            if (buildStatus != status) {
                if (buildStatus == BuildStatus.Unknown)
                    buildStatus = status;
                else
                    return this._GetAnimatedImage("gray");
            }
        }

        if (buildStatus == BuildStatus.Unknown)
            return "";

        switch (buildStatus) {
            case BuildStatus.RunningGreen:
                return this._GetAnimatedImage("green");
            case BuildStatus.RunningRed:
                return this._GetAnimatedImage("red");
            default:
                return "";
        }
    };
    
    this._GetPersonalRunningBuildImage = function(configuration) {

        var buildStatus = BuildStatus.Unknown;

        for (var i = 0; i < configuration.Builds.length; i++) {
            var build = configuration.Builds[i];
            var status = build.GetStatus();

            // Skip all states except RunningGreen and RunningRed
            if (status != BuildStatus.RunningGreen &&
                status != BuildStatus.RunningRed ||
                !build.IsPersonal())
                continue;

            if (buildStatus != status) {
                if (buildStatus == BuildStatus.Unknown)
                    buildStatus = status;
                else
                    return "./images/states/person_gray.png";
            }
        }

        if (buildStatus == BuildStatus.Unknown)
            return "";

        return this._GetPersonalBuildImage(buildStatus);
    };
    
    this._GetRunningBuildHtml = function(htmlData, configuration) {

        var buildImage = this._GetRunningBuildImage(configuration);
        if (buildImage == "")
            return false;

        this._CombineBuildHtml(htmlData, buildImage);
        return true;
    };
    
    this._GetPersonalRunningBuildHtml = function(htmlData, configuration) {

        var buildImage = this._GetPersonalRunningBuildImage(configuration);
        if (buildImage == "")
            return false;

        this._CombineBuildHtml(htmlData, buildImage);
        return true;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the configuration image
    ///////////////////////////////////////////////////////////////////////////////

    this._GetConfigurationImageHtml = function(htmlData, configuration) {

        var status = configuration.GetStatus();

        htmlData.Push("<div class=\"config_item_image\"><img src=\"");
        htmlData.Push(this._GetConfigurationStatusImage(status));
        htmlData.Push("\"/></div>");
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the configuration text
    ///////////////////////////////////////////////////////////////////////////////
    
    this._GetConfigurationTextHtml = function(htmlData, configuration, width) {

        htmlData.Push("<div class=\"config_item_text\"><a ");
        htmlData.Push("style=\"width:" + width + "px\" href=\"");
        htmlData.Push(this._teamCityServer + configuration.GetLink());
        htmlData.Push("\" onmouseover=\"ItemOver(" + width + ")\">");
        htmlData.Push(configuration.GetName());
        htmlData.Push("</a></div>");
    }; 
    
	///////////////////////////////////////////////////////////////////////////////
    // Returns true if the configuration is successful.
    ///////////////////////////////////////////////////////////////////////////////
	
	this._IsConfigurationSuccessful = function(configuration) {
		
		for (var i = 0; i < configuration.Builds.length; i++) {
            var build = configuration.Builds[i];
			if (build.GetStatus() != BuildStatus.Success) {
				return false;
			}
		}

		var status = configuration.GetStatus();		
		return (status == ConfigurationStatus.Success);
	};
	
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the configuration
    ///////////////////////////////////////////////////////////////////////////////

    this._GetConfigurationHtml = function(htmlData, configuration) {

		if (this._hideSuccessfulConfigurations && this._IsConfigurationSuccessful(configuration)) {
			return;
		}
	
	    htmlData.Height += this._imgStatusHeigh;
	    var width = this._width - this._imgStatusWidth;

        htmlData.Push("<div class=\"config_item\">");
        htmlData.Push("<div onclick=\"ShowFlyout('");
        htmlData.Push(configuration.GetLink());
        htmlData.Push("')\">");
        
        this._GetConfigurationImageHtml(htmlData, configuration);

        if (this._GetRunningBuildHtml(htmlData, configuration))
            width -= this._imgStatusWidth;
            
        if (this._GetPersonalRunningBuildHtml(htmlData, configuration))
            width -= this._imgStatusWidth;
           
        htmlData.Push("</div>");
        this._GetConfigurationTextHtml(htmlData, configuration, width);
        htmlData.Push("</div>");
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the project configurations
    ///////////////////////////////////////////////////////////////////////////////

    this._GetConfigurationsHtml = function(htmlData, project) {

        var projectName = project.GetName();
        if (this.IsProjectCollapsed(projectName))
            return;

        for (var index = 0; index < project.Configurations.length; ++index) {
            this._GetConfigurationHtml(htmlData, project.Configurations[index]);
        }
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the project text
    ///////////////////////////////////////////////////////////////////////////////

    this._GetProjectItemText = function(htmlData, project, width) {
        htmlData.Push("<div class=\"project_text\" ");
        htmlData.Push("style=\"width:" + width + "px\" ");
        htmlData.Push("onmouseover=\"ItemOver(" + width + ")\">");
        htmlData.Push(project.GetName() + "</div>");
    }; 
	
    ///////////////////////////////////////////////////////////////////////////////
    // Returns true if the project has all successful configurations.
    ///////////////////////////////////////////////////////////////////////////////
	
	this._IsProjectSuccessful = function(project) {
	
		for (var index = 0; index < project.Configurations.length; ++index) {
			if (!this._IsConfigurationSuccessful(project.Configurations[index])) {
				return false;
			}
        }
		return true;
	};
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the project
    ///////////////////////////////////////////////////////////////////////////////

    this._GetProjectHtml = function(htmlData, project) {

		var isProjectSuccessful = this._IsProjectSuccessful(project);
	
		if (this._hideSuccessfulProjects && isProjectSuccessful) {
			return;
		}
		
		var isHeaderOnly = isProjectSuccessful && this._hideSuccessfulConfigurations;
        htmlData.Height += this._imgStatusHeigh;
		
		if (!isHeaderOnly) {
	        htmlData.Push("<div class=\"project\" ");

			var projectName = project.GetName();
			if (this.IsProjectCollapsed(projectName)) {
				htmlData.Push('ondblclick="Expand(this, \'' + projectName + '\')">');
			} else {
				htmlData.Push('ondblclick="Collapse(this, \'' + projectName + '\')">');
			}

			this._GetProjectItemBackground(htmlData, project);
			this._GetProjectItemImage(htmlData, project);
			this._GetProjectItemText(htmlData, project, this._width - this._imgCollapseWidth);
			htmlData.Push("</div>");
			this._GetConfigurationsHtml(htmlData, project);
		} else {
			htmlData.Push("<div class=\"project\" >");
			this._GetProjectItemBackground(htmlData, project);
			htmlData.Push('<img class="project_button" src="./images/empty.png"/>');
			this._GetProjectItemText(htmlData, project, this._width - this._imgCollapseWidth);
			htmlData.Push("</div>");
		}
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Flyout 
    ///////////////////////////////////////////////////////////////////////////////

    this._GetFlyoutBuildNumberHtml = function(htmlData, buildNumber) {
        htmlData.Push("<td style=\"text-align: center;\">");
        htmlData.Push(Tools.MakeSingleLine(buildNumber));
        htmlData.Push("</td>");
    };
    
    this._GetFlyoutBuildStatusImageHtml = function(htmlData, buildStatus, buildStatusToolTip, isPersonal) {

        htmlData.Push("<td width=\"1%\">");
        htmlData.Push("<img src=\"" + this._GetBuildStatusImage(buildStatus) + "\" ");
        htmlData.Push("title=\"" + buildStatusToolTip + "\"/>");

        if (isPersonal) {
            htmlData.Push("<img src=\"" + this._GetPersonalBuildImage(buildStatus) + "\" ");
            htmlData.Push("title=\"" + buildStatusToolTip + "\"/>");
        }

        htmlData.Push("</td>");
    };
    
    this._GetFlyoutBuildStatusMessageHtml = function(htmlData, buildResults, buildResultsLink) {
        htmlData.Push("<td><a title=\"View build results\" href=\"");
        htmlData.Push(this._teamCityServer + buildResultsLink + "\">");
        htmlData.Push(buildResults + "</a></td>");
    };
    
    this._GetFlyoutBuildChangesHtml = function(htmlData, buildChanges, buildChangesLink) {
        if (buildChanges != null) {
            htmlData.Push("<td><a title=\"Click to see changes\" href=\"");
            htmlData.Push(this._teamCityServer + buildChangesLink + "\">");
            htmlData.Push(Tools.MakeSingleLine(buildChanges) + "</a></td>");
        } else {
            htmlData.Push("<td class=\"grayed\">No changes</td>");
        }
    };
    
    this._GetFlyoutBuildsTableRowHtml = function(htmlData, build) {

        var buildData = build.GetData();
        if (buildData == null)
            throw "Build data is not initialized.";

        htmlData.Push("<tr>");

        this._GetFlyoutBuildNumberHtml(htmlData, buildData.GetBuildNumber());
        this._GetFlyoutBuildStatusImageHtml(htmlData, build.GetStatus(), buildData.GetStatusToolTip(), build.IsPersonal());
        this._GetFlyoutBuildStatusMessageHtml(htmlData, buildData.GetBuildResults(), buildData.GetBuildResultsLink());
        this._GetFlyoutBuildChangesHtml(htmlData, buildData.GetBuildChanges(), buildData.GetBuildChangesLink());
        
        htmlData.Push("</tr>");
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Public functions
    ///////////////////////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////////////////////////////////
    // Resets the class into the initial state
    ///////////////////////////////////////////////////////////////////////////////

    this.Reset = function() {
        this.collapsedElements = [];
        this._width = 0;
        this._imgStatusHeigh = 14;
        this._imgStatusWidth = 14;
        this._imgCollapseHeigh = 14;
        this._imgCollapseWidth = 9;
        this._teamCityServer = "";
        this._useBuildStateAnimation = false;
		this._hideSuccessfulProjects = false;
		this._hideSuccessfulConfigurations = false;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets HTML for the projects list
    ///////////////////////////////////////////////////////////////////////////////

    this.GetHtml = function(projects) {

        var htmlData = new HtmlData();

        for (var index = 0; index < projects.length; ++index) {
            this._GetProjectHtml(htmlData, projects[index]);
        }

        return htmlData;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Sets the build state animation flag
    ///////////////////////////////////////////////////////////////////////////////

    this.SetUseBuildStateAnimation = function (value) {
        this._useBuildStateAnimation = value;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Get the build state animation flag
    ///////////////////////////////////////////////////////////////////////////////

    this.GetUseBuildStateAnimation = function () {
        return this._useBuildStateAnimation;
    }; 
	
	///////////////////////////////////////////////////////////////////////////////
    // Sets the hide hide successful configurations flag
    ///////////////////////////////////////////////////////////////////////////////

    this.SetHideSuccessfulConfigurations = function (value) {
        this._hideSuccessfulConfigurations = value;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the hide hide successful configurations flag
    ///////////////////////////////////////////////////////////////////////////////

    this.GetHideSuccessfulConfigurations = function () {
        return this._hideSuccessfulConfigurations;
    }; 

	///////////////////////////////////////////////////////////////////////////////
    // Sets the hide hide successful projects flag
    ///////////////////////////////////////////////////////////////////////////////

    this.SetHideSuccessfulProjects = function (value) {
        this._hideSuccessfulProjects = value;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Gets the hide hide successful projects flag
    ///////////////////////////////////////////////////////////////////////////////

    this.GetHideSuccessfulProjects = function () {
        return this._hideSuccessfulProjects;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Sets the panel width
    ///////////////////////////////////////////////////////////////////////////////

    this.SetPanelWidth = function(width) {
        this._width = width;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Get the panel width
    ///////////////////////////////////////////////////////////////////////////////

    this.GetPanelWidth = function() {
        return this._width;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Sets the server name
    ///////////////////////////////////////////////////////////////////////////////

    this.SetServerName = function(teamCityServer) {
        this._teamCityServer = teamCityServer;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Get the server name
    ///////////////////////////////////////////////////////////////////////////////

    this.GetServerName = function() {
        return this._teamCityServer;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Sets the project's collapse state
    ///////////////////////////////////////////////////////////////////////////////

    this.SetProjectCollapsed = function(projectName, value) {
        this.collapsedElements[projectName] = value;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Checks the project's collapse state
    ///////////////////////////////////////////////////////////////////////////////
    
    this.IsProjectCollapsed = function(projectName) {
        return this.collapsedElements[projectName] == true;
    }; 
    
    ///////////////////////////////////////////////////////////////////////////////
    // Flyout
    ///////////////////////////////////////////////////////////////////////////////

    this.GetFlyoutConfigurationHtml = function(config) {
        
        var configData = config.GetData();
        if (configData == null)
            throw "Configuration data is not initialized.";

        var htmlData = new HtmlData();
        htmlData.Push("<img class=\"flyoutStateImg\" src=\"");
        htmlData.Push(this._GetConfigurationStatusImage(config.GetStatus()));
        htmlData.Push("\"/>");
        htmlData.Push(configData.GetStatusMessage());

        return htmlData.GetHtml();
    };
    
    this.GetFlyoutBuildsTableHtml = function(config) {

        var htmlData = new HtmlData();

        htmlData.Push("<table id=\"buildsTable\"><tr><th class=\"firstCell\">#</th>");
        htmlData.Push("<th colspan=\"2\">Results</th><th class=\"lastCell\">Changes</th></tr>");

        for (var buildIndex = 0; buildIndex < config.Builds.length; ++buildIndex) {
            var build = config.Builds[buildIndex];
            this._GetFlyoutBuildsTableRowHtml(htmlData, build);
        }

        htmlData.Push("</table>");
        return htmlData.GetHtml();
    };
    
    this.Reset();
}

///////////////////////////////////////////////////////////////////////////////
// Item over event handler 
///////////////////////////////////////////////////////////////////////////////

function ItemOver(width) {

    var element = event.srcElement;
    if (element.probed)
        return;

    element.probed = true;
    
    ruler.innerHTML = element.innerText;
    if (ruler.offsetWidth < width)
        return;

    element.title = event.srcElement.innerText;
}
