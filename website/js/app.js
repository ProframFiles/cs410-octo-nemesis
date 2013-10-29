require.config({
  paths : {
    backbone : './libs/backbone',
    underscore : './libs/underscore',
    jquery : './libs/jquery-1.10.2',
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

define( ["marionette"], function (Marionette) {

    // set up the app instance
    var MyApp = new Marionette.Application();

    // configuration, setting up regions, etc ...

    // export the app from this module
    return MyApp;
});