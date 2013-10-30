define( ["marionette","d3"], function (Marionette, d3) {
	el: "#app",// Private variables and private functions

	//sample
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
    }
    var dataset = [5,1,4,2,3,55]

    d3.select(el,)
    // manipulate it here!



	return{
		// exposed methods don't put variables in here

	}
}