
describe("Html parser", function() {

    var _parser;
    var _xmlDoc;

    beforeEach(function() {
        _parser = new HtmlParser();
        _xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    });

    describe("Get configuration status", function() {

        it("Success", function () {
            var status = GetConfigurationStatus("<img src=\"success.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Success);
        });

        it("Unknown", function () {
            var status = GetConfigurationStatus("<img src=\"buildGray.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Unknown);
        });

        it("Error", function () {
            var status = GetConfigurationStatus("<img src=\"error.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Error);
        });

        it("Fixing", function () {
            var status = GetConfigurationStatus("<img src=\"errorWithResp.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Fixing);
        });

        it("Fixed", function () {
            var status = GetConfigurationStatus("<img src=\"fixed.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Fixed);
        });

        it("Ignored", function () {
            var status = GetConfigurationStatus("<img src=\"ignored.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Ignored);
        });

        it("Paused (Archived)", function () {
            var status = GetConfigurationStatus("<img src=\"archived.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Paused);
        });

        it("Paused", function () {
            var status = GetConfigurationStatus("<img src=\"paused.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Paused);
        });

        it("Pending", function () {
            var status = GetConfigurationStatus("<img src=\"pending.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Pending);
        });

        it("Unknown", function () {
            var status = GetConfigurationStatus("<img src=\"random123.gif\"/>");
            expect(status).toBe(ConfigurationStatus.Unknown);
        });

        it("Success", function () {
            var status = GetConfigurationStatus("<img />");
            expect(status).toBe(ConfigurationStatus.Unknown);
        });
    });

    describe("Get build status", function() {

        it("Success (success_small.gif)", function () {
            CheckBuildStatus("prefix/success_small.gif", BuildStatus.Success, false);
        });

        it("Success (buildSuccess.gif)", function () {
            CheckBuildStatus("prefix/buildSuccess.gif", BuildStatus.Success, false);
        });

        it("Success (personalSuccess.gif)", function () {
            CheckBuildStatus("prefix/personalSuccess.gif", BuildStatus.Success, true);
        });

        it("Error (error_small.gif)", function () {
            CheckBuildStatus("prefix/error_small.gif", BuildStatus.Error, false);
        });

        it("Error (buildFailed.gif)", function () {
            CheckBuildStatus("prefix/buildFailed.gif", BuildStatus.Error, false);
        });

        it("Error (personalCrashed.gif)", function () {
            CheckBuildStatus("prefix/personalCrashed.gif", BuildStatus.Error, true);
        });

        it("Canceled (canceled.gif)", function () {
            CheckBuildStatus("prefix/canceled.gif", BuildStatus.Canceled, false);
        });

        it("Canceled (personalCanceled.gif)", function () {
            CheckBuildStatus("prefix/personalCanceled.gif", BuildStatus.Canceled, true);
        });

        it("Pending (pending.gif)", function () {
            CheckBuildStatus("prefix/pending.gif", BuildStatus.Pending, false);
        });

        it("Pending (personalPending.gif)", function () {
            CheckBuildStatus("prefix/personalPending.gif", BuildStatus.Pending, true);
        });

        it("Running green (running_green_transparent.gif)", function () {
            CheckBuildStatus("prefix/running_green_transparent.gif", BuildStatus.RunningGreen, false);
        });

        it("Running green (personalRunning_green.gif)", function () {
            CheckBuildStatus("prefix/personalRunning_green.gif", BuildStatus.RunningGreen, true);
        });

        it("Running red (running_red_transparent.gif)", function () {
            CheckBuildStatus("prefix/running_red_transparent.gif", BuildStatus.RunningRed, false);
        });

        it("Running red (personalRunning_red.gif)", function () {
            CheckBuildStatus("prefix/personalRunning_red.gif", BuildStatus.RunningRed, true);
        });
    });

    describe("Escape / Unescape functions", function() {

        it("Running red (personalRunning_red.gif)", function () {
            expect(_parser._Escape("*&*")).toBe("*%26*");
        });

        it("Running red (personalRunning_red.gif)", function () {
            expect(_parser._UnEscape("*%26*")).toBe("*&*");
        });
    });

    describe("Parsing projects and configurations", function() {

        it("Parsing builds", function () {

            _parser._ParseBuild = function(buildRow) { return new Build() };

            _xmlDoc.loadXML("<div> \
                <div id=\"Configuration\"/> \
                <table> \
                <tr /> \
                <tr /> \
                </table> \
                </div>");

            var builds = _parser._ParseBuilds(_xmlDoc.selectSingleNode(".//div[@id = \"Configuration\"]"));
            expect(builds.length).toBe(2);
        });

        it("Parsing project", function () {

            _xmlDoc.loadXML("<project>Manhattan</project>");
            var project = _parser._ParseProject(_xmlDoc.documentElement);

            expect(project.GetName()).toBe("Manhattan");
        });

        it("Parsing list of projects and configurations", function () {

            _parser._ParseProject = function() { return new Project(); };
            _parser._ParseConfiguration = function() { return new Configuration() };

            LoadFromResource("projects_and_configurations.xml");
            var projects = _parser._ParseXml(_xmlDoc);

            expect(projects.length).toBe(2);
            expect(projects[0].Configurations.length).toBe(2);
            expect(projects[1].Configurations.length).toBe(2);
        });

        it("Parsing configuration", function () {

            _parser._UnEscape = function(text) { return "_UnEscape" + text; };
            _parser._UnEscapeMessage = function(text) { return "_UnEscapeMessage" + text; };
            _parser._GetConfigurationStatus = function() { return "_GetConfigurationStatus"; };

            _parser._ParseBuilds = function() {
                var builds = [];
                builds.push(new Build());
                return builds;
            };

            LoadFromResource("parse_configuration.xml");
            var config = _parser._ParseConfiguration(_xmlDoc.documentElement, null);

            expect(config.GetName()).toBe("_UnEscapeRelease");
            expect(config.GetLink()).toBe("_UnEscapea href");
            expect(config.GetStatus()).toBe("_GetConfigurationStatus");
            expect(config.Builds.length).toBe(1);
        });
    });

    describe("Extracting status of configurations and builds", function() {

        beforeEach(function() {
            var fixture = '<span id="ruler" style="visibility:hidden; white-space:nowrap"></span>';

            document.body.insertAdjacentHTML(
                'afterbegin',
                fixture);
        });

        it("GetStatusElement embedded returns StatusElement", function () {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Embeded\"]");
            var element = _parser._GetStatusElement(currentNode);

            expect(element).not.toEqual(null);
        });

        it("GetStatusElement linked returns StatusElement", function () {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Linked\"]");
            var element = _parser._GetStatusElement(currentNode);

            expect(element).not.toEqual(null);
        });

        it("GetStatusElement linked and embedded returns the same internally", function () {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Embeded\"]");
            var elementEmbd = _parser._GetStatusElement(currentNode);

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Linked\"]");
            var elementLink = _parser._GetStatusElement(currentNode);

            expect(elementEmbd.childNodes.length).toBe(elementLink.childNodes.length);

            for (i = 0; i < elementEmbd.childNodes.length; i++)
                expect(elementEmbd.childNodes[i].xml).toBe(elementLink.childNodes[i].xml);
        });

        it("ExtractStatusToolTip_OnComplexText_RemovesExtraTags", function () {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Embeded\"]");
            var element = _parser._GetStatusElement(currentNode);
            var message = _parser._ExtractStatusToolTip(element);

            expect(message).toBe("ToolTipText. BuildAgent Server");
        });

        it("test_ExtractStatusToolTip_OnComplexTextWidthPersonal_ExtractsAllData", function() {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"EmbededPersonal\"]");
            var element = _parser._GetStatusElement(currentNode);
            var message = _parser._ExtractStatusToolTip(element);

            expect(message).toBe("ToolTipText. Personal. BuildAgent Server");
        });

        it("test_ExtractStatusMessage_OnComplexText_RetainsExtraTags_V6_5", function() {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"EmbededV65\"]");
            var element = _parser._GetStatusElement(currentNode);
            var message = _parser._ExtractStatusMessage(element);

            expect(message).toBe("Paused by <strong>Sergey Anisimov</strong>&nbsp;<span class=\"date\" title=\"10 hours ago\">10 hours ago</span><br/>Comment: TestMessage ");
        });

        it("test_ExtractStatusMessage_OnComplexText_RetainsExtraTags", function() {

            LoadFromResource("tooltip_text.xml");

            var currentNode = _xmlDoc.selectSingleNode(".//div[@id = \"Linked\"]");
            var element = _parser._GetStatusElement(currentNode);
            var message = _parser._ExtractStatusMessage(element);

            expect(message).toBe("ToolTipText<br/>BuildAgent<a href=\"link\" title=\"title\">Server</a>");
        });

        it("test_GetStatusElement_WithoutMouseover_ReturnsNull", function() {

            _xmlDoc.loadXML("<test/>");
            var element = _parser._GetStatusElement(_xmlDoc.documentElement);

            expect(element).toEqual(null);
        });
    });

    describe("Extracting additional data for the flyout", function() {

        it("test_ExtractConfigurationData_NodeWithConfigurationStatusTooltip_ExtractsStatusToolTip", function() {

            var config = ParseConfiguration("extract_build_data.xml");
            var configData = _parser._ExtractConfigurationData(config.GetDataElement());

            expect(configData.GetStatusMessage()).toBe("ConfigurationStatusTooltip");
        });

        it("test_ExtractBuildData_NodeWithBuildNumber_ExtractsBuildNumber", function() {

            var config = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(config.GetDataElement());

            expect(buildData.GetBuildNumber()).toBe("# 777");
        });

        it("test_ExtractBuildData_NodeWithBuidStatusTooltip_ExtractsStatusToolTip", function() {

            var build = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(build.GetDataElement());

            expect(buildData.GetStatusToolTip()).toBe("BuidStatusTooltip");
        });

        it("test_ExtractBuildData_NodeWithBuidResults_ExtractsBuildResults", function() {

            var build = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(build.GetDataElement());

            expect(buildData.GetBuildResults()).toBe("BuidResults");
        });

        it("test_ExtractBuildData_NodeWithBuidResultsLink_ExtractsBuildResultsLink", function() {

            var build = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(build.GetDataElement());

            expect(buildData.GetBuildResultsLink()).toBe("BuidResultsLink");
        });

        it("test_ExtractBuildData_NodeWithBuidChanges_ExtractsBuildChanges", function() {

            var build = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(build.GetDataElement());

            expect(buildData.GetBuildChanges()).toBe("BuildChanges");
        });

        it("test_ExtractBuildData_NodeWithBuidChangesLink_ExtractsBuildChangesLink", function() {

            var build = ParseConfiguration("extract_build_data.xml");
            var buildData = _parser._ExtractBuildData(build.GetDataElement());

            expect(buildData.GetBuildChangesLink()).toBe("BuildChangesLink");
        });

        it("test_ParseDataElement_ForConfigWithDataElement_ExtractsConfigurationData", function() {

            var configuration = new Configuration(null, null, null, null, "DataElement");
            var configDataElement;

            _parser._ExtractConfigurationData = function(dataElement) {
                configDataElement = dataElement;
                return "Data";
            };

            _parser.ParseDataElement(configuration);

            expect(configDataElement).toBe("DataElement");
            expect(configuration.GetData()).toBe("Data");
        });

        it("test_ParseDataElement_ForAllBuilds_ExtractsBuildData", function() {

            var configuration = new Configuration();
            var configDataElement = "";

            configuration.Builds.push(new Build(null, null, "DataElement"));
            configuration.Builds.push(new Build(null, null, "DataElement"));

            _parser._ExtractConfigurationData = function(dataElement) {
                return null;
            };

            _parser._ExtractBuildData = function(dataElement) {
                configDataElement = configDataElement + dataElement;
                return "Data";
            };

            _parser.ParseDataElement(configuration);

            expect(configDataElement).toBe("DataElementDataElement");
            expect(configuration.Builds[0].GetData()).toBe("Data");
            expect(configuration.Builds[1].GetData()).toBe("Data");
        });
    });

    describe("Success and errors parsing", function() {

        it("test_Initail_State_Of_Pareser", function() {
            expect(_parser.GetProjects()).not.toEqual(null);
            expect(_parser.GetErrorCode()).toBe(0);
        });

        it("test_Correct_Xml_Parsing", function() {
            _parser.ProcessHtml("<Doc/>");
            expect(_parser.GetErrorCode()).toBe(0);
        });

        it("test_Incorrect_Xml_Parsing", function() {
            _parser.ProcessHtml("<Doc>");
            expect(_parser.GetErrorCode()).not.toBe(0);
        });

        it("test_Reset_Xml_Status", function() {
            _parser.ProcessHtml("<Doc>");
            expect(_parser.GetErrorCode()).not.toBe(0);

            _parser.ProcessHtml("<Doc/>");
            expect(_parser.GetErrorCode()).toBe(0);
        });
    });

    function LoadFromResource(resource) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'base/tests/data/' + resource, false);
        xhr.send();
        _xmlDoc.loadXML(xhr.responseText);
    }

    function ParseConfiguration(resource) {
        LoadFromResource(resource)
        return _parser._ParseConfiguration(_xmlDoc.documentElement);
    }

    function GetConfigurationStatus(nodeText) {
        _xmlDoc.loadXML(nodeText);
        var image_node = _xmlDoc.documentElement;
        return _parser._GetConfigurationStatus(image_node);
    }

    function CheckBuildStatus(imageName, statusRequired, isPersonalRequired) {

        var status = _parser._GetBuildStatus(imageName);
        var isPersonal = _parser._IsBuildPersonal(imageName);

        expect(status).toBe(statusRequired);
        expect(isPersonal).toBe(isPersonalRequired);
    }

});

