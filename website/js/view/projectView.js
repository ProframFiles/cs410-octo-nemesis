define( ["d3", "../model/projectModel", "colorbrewer"], function (d3, model, colorbrewer) {	
// Private variables and private functions
	var greenColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8]).range(colorbrewer.YlGn[9]);
	var yellowGreenColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8,9]).range(colorbrewer.RdYlGn[10]);
	var svg;
	var leaf;
	var link;
	var vine;
	var node;
	var root;
	var loose;
	
	function desaturate(rgbstring)
	{
		var hsl = d3.hsl(rgbstring);
		hsl.s = hsl.s * 0.2;
		return hsl.toString();
	}

	function leaf_fill(d){
		return yellowGreenColor(Math.floor(d[d.length-1].curve[3]*9.99));
	}

	function vine_color(d){
		return greenColor(Math.floor(Math.min(7+d[d.length-1].depth, 8)));
	}
	
	function vine_stroke_width(d){
		return Math.max(2.5*Math.sqrt(1.0/d.length), 0.7);
	}

	function highlight_in_tree(root)
	{
		for (var i = 0; i < model.active_nodes.length; i++) {
			if(model.active_nodes[i].root == root) model.active_nodes[i].fixed = true;
		}

		leaf.style("stroke", function(d){
				if(d[0].root !== root) return desaturate(vine_color(d));
				return d3.rgb(vine_color(d)).brighter(1.0).toString();
			})
			.style("fill", function(d){
				if(d[0].root !== root) return desaturate(leaf_fill(d));
				return d3.rgb(leaf_fill(d)).brighter(1.0).toString();
			})
			.style("stroke-width", function(d){
				if(d[0].root !== root) return 0.5*vine_stroke_width(d);
				return 2.0*vine_stroke_width(d);
			});
		vine.style("stroke", function(d){
				if(d[0].root !== root) return desaturate(vine_color(d));
				return d3.rgb(vine_color(d)).brighter(1.0).toString();
			})
			.style("stroke-width", function(d){
				if(d[0].root !== root) return 0.5 * vine_stroke_width(d);
				return 2.0 * vine_stroke_width(d);
			});
	}
	function unhighlight_in_tree(root)
	{
		for (var i = 0; i < model.active_nodes.length; i++) {
			model.active_nodes[i].fixed = false;
		}
		leaf.style("stroke", vine_color)
			.style("fill", leaf_fill)
			.style("stroke-width", vine_stroke_width);
		vine.style("stroke", vine_color)
			.style("stroke-width", vine_stroke_width);
	}

	function on_force_tick(d) {

		root.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
			//.attr("d", function(d) { return kGrassTuft.d;})
			//.attr("transform", function(d){return "translate(" +(d.x-10) +" "+ (d.y-20)+ ") scale(0.3 )";});

		// display every node
		if(node !== undefined)
		{
			node.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}

		// display the loose nodes
		if(loose !== undefined)
		{
			loose.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}

		//draw the actual vines
		if(vine !== undefined)
		{
			vine.attr("d", function(d, i){
				//console.log("vine path");
				return model.lineGen(d);
			});
		}	

		// rotate and translate the leaves so that they're actually hanging off
		// the vines properly as they move
		if(leaf !== undefined)
		{
			leaf.attr("transform", function(d){
				//console.log("leaf path" + d.curve);
				// scale("+ rnd +")
				var x = d[d.length-1].x;
				var y = d[d.length-1].y;
				var dx = x - d[d.length-2].x;
				var dy = y - d[d.length-2].y;
				var scale = 0;
				scale = 1.0;
				return "rotate("+(210+180*(-Math.atan2(dx, dy)/Math.PI)) +" "+ x+ " " +y +
							")  translate(" +(x-8) +" "+ (y-29)+ ") scale(" + scale +") " ;			
			});
		}

		// draw the raw links between nodes (debugging)
		if(link !== undefined){
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
		}

	}
	
	
	return {
	
		backGroundColor : "#FFFAF0",
		
		Init : function(template){ 
			this.template = template;
			
			svg = d3.select(this.template).append("svg")
				.attr("width", model.width)
				.attr("height", model.height)
				.style("background-color", this.backGroundColor);
		
			// these are for debugging, mostly
			// they use up a lot of cycles, so comment them out
			// rather than render them transparently or something
			
			/*link = svg.selectAll(".link")
				.data(model.links)
				.enter().append("line")
				.attr("class", "link")
				.attr("color", "red")
				.style("stroke-opacity", function(link){
					if(link.source.pos ==="i" && link.target.pos ==="i") return 1.0;
					return 0.0;
				})
				.style("stroke-width", 1.3);*/
		
			/*node = svg.selectAll(".node")
				.data(model.nodes)
				.enter().append("circle")
				.attr("class", "node")
				.attr("r", 3)
				.style("fill", "red");*/
		
			/*loose = svg.selectAll(".loose")
				.data(model.singles)
				.enter().append("circle")
				.attr("class", "loose")
				.attr("r", 0.1);*/
		
			vine = svg.selectAll(".vine")
				.data(model.paths)
				.enter().append("path")
				.attr("class", "vine")
				.style("fill", "none")
				.style("stroke-width", vine_stroke_width)
				.style("stroke", vine_color)
				.attr("d", function(d){return model.lineGen(d);});
		
			leaf = svg.selectAll(".leaf")
				.data(model.paths)
				.enter().append("path")
				.attr("class", "leaf")
				.style("stroke-width", vine_stroke_width)
				.style("stroke", vine_color)
				.style("fill", leaf_fill)
				.style("fill-opacity", 0.8)
				.style("stroke-opacity", 0.7)
				.attr("d", model.kLeaf.d)
				.on('mouseover', function(d){
					highlight_in_tree(d[0].root)
				})
				.on('mouseout', function(d){
					unhighlight_in_tree();
				});
				
			root = svg.selectAll(".root")
				.data(model.roots)
				.enter().append("circle")
				.attr("r", 5)
				.attr("class", "root")
				.style("fill", "brown")
				.call(model.force.drag);

			if(node !== undefined) node.append("title").text(function(d) { return d.name; });
			if(loose !== undefined ) loose.append("title").text(function(d) { return d.name; });
		
			if(root !== undefined ) root.append("title").text(function(d) { return d.name +" " +d.terminalLeaves; });
			if(leaf !== undefined )leaf.append("title").text(function(d) { return d[d.length-1].name ; });
		},
		
		OnForceTick : on_force_tick,
		


		Start : function(){
			model.force.on("tick", this.OnForceTick);	
			model.force.start();
		},
		
		template: "#app",
		className: "code_forest",
		
		model: model
	};
});
