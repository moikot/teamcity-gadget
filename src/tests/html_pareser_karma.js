
describe("Html parser", function() {

    var _parser;
    var _xmlDoc;

    beforeEach(function() {
        _parser = new HtmlParser();
        _xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    });

    describe("Get_Configuration_Status", function() {

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

    function GetConfigurationStatus(nodeText) {
        _xmlDoc.loadXML(nodeText);
        var image_node = _xmlDoc.documentElement;
        return _parser._GetConfigurationStatus(image_node);
    }
});

