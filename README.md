# TeamCity garget is a Windows desktop gadget for TeamCity.

This gadget receives the information about project builds from [JetBrains TeamCity](https://www.jetbrains.com/teamcity/) build management server and combine it into a compact view. Since  TeamCity Gadget uses the same information channel as JetBrains TeamCity Tray Notifier there is no need in the additional plug-ins on the server side, just install the gadget, provide the URL to TeamCity server, and it is ready to go.

TeamCity Gadget uses the same settings and notification rules as JetBrains TeamCity [Tray Notifier](https://confluence.jetbrains.com/display/TCD8/Windows+Tray+Notifier) and allows instantly evaluate the build state of the projects and the configurations you are interested in. It is always available on your sidebar if you are on Windows Vista and on your desktop in case of Windows 7. The major advantage of TeamCity Gadget is the ability to represent the project build state in compact way by colorizing background of the project name with different colors corresponding to the build configuration state.

## Dowloads
The latest versions of the gadgets can be found on [http://www.teamcity-gadget.com/](http://www.teamcity-gadget.com/)

## Build

In order to build TeamCity Gadget, you need to have [Node.js/npm](https://nodejs.org/en/download/) and [git](https://git-scm.com/downloads) installed.

Clone a copy of the main git repo by running:

```bash
git clone git://github.com/anisimovsergey/teamcity-gadget.git
```

Run the build script:
```bash
npm run build
```

The built version of TeamCity Gadget will be put in the `dist/` subdirectory.

## FAQ

### My gadget does not show anything, what am I doing wrong?

The gadget displays everything what TeamCity server sends to its tray notifier and this information depends on the notification settings. In order to modify your notification settings you need to do the following:

1. In the top right corner of the TeamCity server web page, click the arrow next to your username, and select **My Settings&Tools** from the drop-down list.
2. Open the **Notification Rules** tab.
3. Click the required notifications type: **Windows Tray Notifier**
4. For the selected notifications type, specify the notification rules, which are comprised of two parts: **what should be watched** and **notification conditions**.
5. In **To Watch** area select the builds you want to watch
6. In the notification conditions should be at least two check boxes selected **The build fails** and **The build is successful**
7. **Apply** your changes and click **Refresh** button on the gadget.
