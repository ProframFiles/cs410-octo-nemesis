define( ["d3","marionette"], function (d3, Marionette) {	
// Private variables and private functions


		var projectData = doom3 = {
	    "class1": {
	        "childArray"  : [
	            "class2",
	            "class3" ],
	        "connectionArray" :  [
	            "class4" ]},
	    "class2": {
	        "childArray" : [
	            "class1" ],
	        "connectionArray" : [
	            "class4" ]},
	    "class3" : {
	        "childArray" : [
	            "class1"],
	        "connectionArray" : []},
	    "class4" : {
	        "childArray" : [],
	        "connectionArray" : []}
	    };
	    var el = "#app";
	    var dataset = [ 5, 10, 15, 20, 25 ];

	    d3.select(el).selectAll("p")
	        .data(dataset)
	        .enter()
	        .append("p")
	        .text("Yo bro's add your d3 stuffs here! \nYou can use the project data above");

	return Backbone.Marionette.ItemView.extend({
		template: "#app",
		className: "code_forest",
	});
});