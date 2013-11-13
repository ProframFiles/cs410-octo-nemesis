define( ["d3", "../model/projectModel", "colorbrewer"], function (d3, model, colorbrewer) {	
// Private variables and private functions
	function greenColor(val){
		var indx = Math.max(Math.min(val*9, 8.9999), 0);
		return d3.interpolateLab( colorbrewer.YlGn[9][Math.floor(indx)], 
							colorbrewer.YlGn[9][Math.floor(indx)+1] )(indx%1);
	}
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
		return yellowGreenColor(Math.floor(d.rnd[3]*9.99));
	}

	function vine_color(d){
		return greenColor(0.8-0.5*d.rnd[2]);
	}

	function vine_stroke_width(d){
		return Math.max(0.4,0.4);
	}

	function flower_stroke_width(d){
		return 0.4;
	}


	function highlight_in_tree(root)
	{

		leaf.style("stroke-width",function(d){
				if(d.root !== root ) return vine_stroke_width(d);
				else return 1.0;
			})
			.style("fill", function(d){
				if(d.root !== root) return desaturate(leaf_fill(d));
				return d3.rgb(leaf_fill(d)).brighter(1.0).toString();
			});
		if(vine !== undefined)
		{
		vine.style("stroke", function(d){
				if(d.root !== root) return desaturate(vine_color(d));
				return d3.rgb(vine_color(d)).brighter(1.0).toString();
			})
			.style("fill", vine_color);
		}
	}
	function unhighlight_in_tree(root)
	{
		leaf.style("stroke", "black")
			.style("fill", leaf_fill)
			.style("stroke-width", vine_stroke_width);
		if(vine !== undefined)
		{
			vine.style("stroke", "black")
				.style("fill", vine_color)
				.style("stroke-width", vine_stroke_width);
		}
	}

	var frameskip = 40;
	var framecount = 0;
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
		if(vine !== undefined && vine.should_draw)
		{
			vine.attr("d", function(d){
				//console.log("vine path");
				return model.lineGen(d, 0.9)(d.path);
			});
		}	

		// rotate and translate the leaves so that they're actually hanging off
		// the vines properly as they move
		if(leaf !== undefined)
		{
			leaf.attr("transform", function(d){
				//console.log("leaf path" + d.rnd);
				// scale("+ rnd +")
				var indx = Math.floor(d.length*0.5)
				var x = d.x;
				var y = d.y;
				var dx = x - d.nextLast.x;
				var dy = y - d.nextLast.y;
				var scale = 0;
				scale = 1.0;
				return "rotate("+(210+180*(-Math.atan2(dx, dy)/Math.PI)) +" "+ x+ " " +y +
							")  translate(" +(x-model.kLeaf.x0) +" "+ (y-model.kLeaf.y0)+ ") scale(" + scale +") " ;			
			});
		}

		// draw the raw links between nodes (debugging)
		if(link !== undefined){
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
		}
		framecount++;
	}

	function OnStop(d)
	{
		
				vine
				.style("fill", vine_color)
				.style("fill-opacity", 0.9)
				.style("stroke-opacity", 1.0)
				.style("stroke-width", vine_stroke_width)
				.style("stroke", "black")
				.attr("d", function(d){return model.lineGen(d, 1.0)(d.path);});

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
				.data(model.leaves)
				.enter().append("path")
				.attr("class", "vine")
				.style("fill", "none")
				.style("fill-opacity", 0.0)
				.style("stroke-opacity", 0.0)
				.style("stroke-width", vine_stroke_width)
				.style("stroke", "black")
				.attr("d", function(d){return model.lineGen(d, 1.0)(d.path);});
			vine.should_draw = false;
/*
			flower = svg.selectAll(".flower")
				.data(model.paths)
				.enter().append("path")
				.attr("class", "flower")
				.style("stroke-width", flower_stroke_width)
				.style("stroke", model.kFlower.stroke)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", model.kFlower["miter-limit"])
				.attr("d", model.kFlower.d);*/
		
			leaf = svg.selectAll(".leaf")
				.data(model.leaves)
				.enter().append("path")
				.attr("class", "leaf")
				.style("stroke-width", vine_stroke_width)
				.style("stroke", "black")
				.style("fill", leaf_fill)
				.style("fill-opacity", 0.8)
				.style("stroke-opacity", 0.7)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", model.kLeaf["miter-limit"])
				.attr("d", model.kLeaf.d)
				.on('mouseover', function(d){
					highlight_in_tree(d.root)
				})
				.on('mouseout', function(d){
					unhighlight_in_tree();
				});
				
			root = svg.selectAll(".root")
				.data(model.roots)
				.enter().append("circle")
				.attr("r", function(d){
					return Math.max(Math.sqrt(d.terminalLeaves), 3)
				})
				.attr("class", "root")
				.style("fill", "Darkblue")
				.call(model.force.drag);

			if(node !== undefined) node.append("title").text(function(d) { return d.name; });
			if(loose !== undefined ) loose.append("title").text(function(d) { return d.name; });
		
			if(root !== undefined ) root.append("title").text(function(d) { return d.name +" " +d.terminalLeaves; });
			if(leaf !== undefined )leaf.append("title").text(function(d) { return d.name ; });
		},
		
		OnForceTick : on_force_tick,
		OnForceStop : OnStop,


		Start : function(){
			model.force
				.on("tick", this.OnForceTick)
				.on("end", this.OnForceStop);
			model.force.start();
		},
		
		template: "#app",
		className: "code_forest",
		
		model: model
	};
});
