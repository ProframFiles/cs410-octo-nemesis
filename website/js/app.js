//Requires syntax --- don't touch these unless --- 

require.config({
  paths : {
    backbone : './libs/backbone',
    underscore : './libs/underscore',
    jquery : './libs/jquery-1.10.2',
    d3: './libs/d3.v3',
    marionette : './libs/backbone.marionette'
  },
  shim : {
    jquery : {
      exports : 'jQuery'
    },
    underscore : {
      exports : '_'
    },
    backbone : {
      deps : ['jquery', 'underscore'],
      exports : 'Backbone'
    },
    marionette : {
      deps : ['jquery', 'underscore', 'backbone'],
      exports : 'Marionette'
    }
  }
})

define( ["marionette","./view/projectView"], function (Marionette, ProjectView) {

    // set up the app instance
    var MyApp = new Marionette.Application();

    MyApp.on('start', function(options) {
        Backbone.history.start(); // Great time to do this
    });

    MyApp.addRegions({
        container: "#container",
        footer:"#footer"
    });

    // Close out the view that's currently there and render a different view.
    //region.show(new MyOtherView());

    // Close out the view and display nothing in #container.
    //region.close();

    // configuration, setting up regions, etc ...

    // export the app from this module
    return MyApp;
});