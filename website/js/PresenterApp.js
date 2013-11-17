//Requires syntax --- don't touch these unless --- 

require.config({
  paths : {
    underscore  : './libs/underscore',
    jquery      : './libs/jquery-1.10.2',
    d3          : './libs/d3/d3.v3',
    colorbrewer : './libs/d3/colorbrewer',
    doom3Data   : '../data/doom3Data'
  },
  shim : {
    jquery : {
      exports : 'jQuery'
    },
    d3  : {
      exports : "d3"
    },
    colorbrewer  : {
      exports : "colorbrewer"
    },
    doom3Data : {
      exports : "doom3Data"
    },
    underscore : {
      exports : '_'
    }
  }
});

/*
    Start of the presenter
*/

define( ["./view/projectView"], function (ProjectView) {

	ProjectView.Init("#app", "#themeSelectID");
	ProjectView.Start();
	// Close out the view that's currently there and render a different view.
	//region.show(new MyOtherView());
	// Close out the view and display nothing in #container.
	//region.close();
	// configuration, setting up regions, etc ...
	// export the app from this module
	return {
		mainView : ProjectView,
		other_variable : true
	};
});
