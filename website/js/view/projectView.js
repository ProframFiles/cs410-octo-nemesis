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
	    var dataset = [5,1,4,2,3,55];
	    var el = "#app";
	    var rendered = d3.style("background-color", "gray")
	    	.append("svg")
	    	.attr("width", 1024)
	    	.attr("height", dataset.length*40);

	return Backbone.Marionette.ItemView.extend({
		template: "#app",
		className: "code_forest",
		onRender : function(){
			this.$el = rendered;
		}
	});
};