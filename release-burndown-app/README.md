release-burndown-app
=========================

## Overview
Release burndown that is filtered by Release (on a Release scoped dashboard) and the selected portfolio item. 

![ScreenShot](/images/release-burndown-app.png)

 The column represents the sum of story points associated with "features" (or lowest level Portfolio item type) associated explicitly with the selected release.  
 Note that if a story is associated with the release explicitly, but the feature that it belongs to is not, the story will not be included in this chart.  
 
 Any level of portfolio item can be selected.  This is setup in the app settings.  
 
### App Settings
 Check the "Show Selector Box" to show the portfolio item selector on the app.
 
 Also select the type of portfolio item for the selector.
 
 If "Show Selector Box" is not checked, then the app will listen for published "portfolioItemSelected" message from another app on the dashboard.  

## License

release-burndown-app is released under the MIT license.  See the file [LICENSE](./LICENSE) for the full text.

##Documentation for SDK

You can find the documentation on our help [site.](https://help.rallydev.com/apps/2.1/doc/)
