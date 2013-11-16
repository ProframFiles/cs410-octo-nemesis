define( ["d3", "../model/projectModel", "colorbrewer"], function (d3, model, colorbrewer) {	
// Private variables and private functions

	//get a function representing a color spectrum from an array of colors
	function GetColorInterp(color_array)
	{
		//if there is only one color, then don't worry about interpolating anything
		if(color_array.length == 1) return function(){ return color_array[0];}
		var maxfloatval = color_array.length -1 - 0.00001;
		var num_colors = color_array.length-1; 
		return function(val){
			var scaled_val = Math.max(Math.min(val*num_colors, maxfloatval), 0);
			var indx = Math.floor(scaled_val);
			return d3.interpolateLab( color_array[indx], color_array[indx+1] )(scaled_val%1);
		}
	}

	function greenColor(val){
		return GetColorInterp(colorbrewer.YlGn[9]);
	}

	var woodBlockBrightPink = "#D74053";
	var woodBlockDarkBlue = "#011640";

	kWoodBlockSkin = 
	{
		branchColors : ["#52452F", "#695643", "#8C6344"],
		leafColors : ["#618C70", "#394F4B", "#B1CBBB"],
		flowerColors : ["#FF8193", "#FFC2D1", "#E8D4D4"],
		flowerCenterColors : ["#261F1D"],
		backGroundGradient : [woodBlockDarkBlue, "#FFFAF0"],
		backGroundOpacity : [1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : [woodBlockBrightPink],
		brachKinkiness : 0.95,
		branchThickness : 1.5,
		borderWidth : 30,
		borderRadius : 25
	}

	kCountryFairSkin = 
	{
		branchColors : ["#2B7D30", "#385C43", "#5D851B"],
		leafColors : colorbrewer.RdYlGn[10],
		flowerColors : ["#F23869","#F28E13", "#8E59D9", "#5FB3BA"],
		flowerCenterColors : ["#F2B705"],
		backGroundGradient : ["#291802", "#291802"],
		backGroundOpacity : [1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : ["#833128"],
		brachKinkiness : 0.0,
		branchThickness : 2.0,
		borderWidth : 30,
		borderRadius : 25
	}

	skin = kWoodBlockSkin;
	
	var LeafColorFunc = GetColorInterp(skin.leafColors);
	var FlowerColorFunc = GetColorInterp(skin.flowerColors);
	var FlowerCenterColorFunc = GetColorInterp(skin.flowerCenterColors);
	var BaseColorFunc = GetColorInterp(skin.baseColors);
	var BranchColorFunc = GetColorInterp(skin.branchColors);


	var yellowGreenColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8,9]).range(colorbrewer.RdYlGn[10]);
	var setOneColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8]).range(colorbrewer.Set1[9]);

	var svg;
	var leaf;
	var web;
	var flower_centers;
	var link;
	var simple_vine = null;
	var vine;
	var highlight_path;
	var highlight_leaf;
	var node;
	var root;
	var loose;
	var state;
	
	function desaturate(rgbstring)
	{
		var hsl = d3.hsl(rgbstring);
		hsl.s = hsl.s * 0.2;
		return hsl.toString();
	}

	function saturate(rgbstring)
	{
		var hsl = d3.hsl(rgbstring);
		hsl.s = Math.pow(hsl.s, 1/3.0);
		return hsl.toString();
	}

	function leaf_fill(d){
		if(d.type === "e") return LeafColorFunc(d.rnd[1]);
		else return FlowerColorFunc(d.rnd[1]);
	}

	function flower_fill(d){
		return FlowerColorFunc(d.rnd[3]);
	}

	function class_base_color(d) {
		return BaseColorFunc(d.rnd[2]);
	}

	function flower_center(d)
	{
		return FlowerCenterColorFunc(d.rnd[3]);
	}

	function vine_color(d){
		return BranchColorFunc(d.rnd[2]);
	}

	function vine_stroke_width(d){
		return Math.max(1.0,0.4);
	}

	function flower_stroke_width(d){
		return 0.7;
	}

	function leaf_transform(d)
	{
	
		var flora;
		if(d.type === "e") flora = model.kLeaf;
		else flora = model.kFlower;
		//console.log("leaf path" + d.rnd);
		// scale("+ rnd +")
		var indx = Math.floor(d.length*0.5)
		var x = d.x;
		var y = d.y;
		var dx = x - d.nextLast.x;
		var dy = y - d.nextLast.y;

		return "rotate("+(210+180*(-Math.atan2(dx, dy)/Math.PI)) +" "+ x+ " " +y +
					")  translate(" +(x-flora.x0) +" "+ (y-flora.y0)+ ") scale(" + flora.scale +") " ;			
		
	}


	function highlight_in_tree(leaf, index)
	{

		highlight_path = svg.selectAll(".hl_vine")
				.data([leaf])
				.enter().append("path")
				.attr("class", "hl_vine")
				.style("fill", "red")
				.style("fill-opacity", 1.0)
				.style("stroke-opacity", 1.0)
				.style("stroke-width", 1.0)
				.style("stroke", "red")
				.attr("d", function(d){return model.lineGen(d, 3.0);});
		highlight_leaf = svg.selectAll(".hl_leaf")
				.data([leaf])
				.enter().append("path")
				.attr("class", "hl_leaf")
				.style("stroke-width", 1.0)
				.style("stroke", "red")
				.style("fill", "none")
				.style("fill-opacity",function(d){
					if(d.type === "e") return 1.0;
					else return 1.0;
				})
				.style("stroke-opacity", 1.0)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", model.kLeaf["miter-limit"])
				.attr("d", function(d){
					if(d.type === "e") return model.kLeaf.d;
					else return model.kFlower.d;
				}).attr("transform", leaf_transform);


	}
	function unhighlight_in_tree(root)
	{
		highlight_path.remove();
		highlight_leaf.remove();
		console.log(highlight_path);
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

		if(flower_centers !== undefined)
		{
			flower_centers.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}

		// display the loose nodes
		if(loose !== undefined)
		{
			loose.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}

		//draw the actual vines
		if(simple_vine !== null)
		{
			simple_vine.attr("d", model.simpleLineGen() );
		}	
		// rotate and translate the leaves so that they're actually hanging off
		// the vines properly as they move
		if(leaf !== undefined) 
		{
		leaf.attr("transform", leaf_transform);
		}

		// draw the raw links between nodes (debugging)
		if(link !== undefined){
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
		}
		if(web !== undefined){
			web.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
		}
		framecount++;
	}

	// draw fancy vines once the movement has stopped
	function OnStop(d)
	{
		for (var i = 0; i < model.nodes.length; i++) {
			model.nodes[i].fixed = true;
		};
		if(simple_vine !== undefined && simple_vine !== null)
		{
			simple_vine.remove();
			simple_vine = null;
		}

		vine = svg.selectAll(".vine")
			.data(model.leaves)
			.enter().insert("path", ".leaf")
			.attr("class", "vine")
			.style("fill", vine_color)
			.style("fill-opacity", 1.0)
			.style("stroke-opacity", 1.0)
			.style("stroke-width", vine_stroke_width)
			.style("stroke", "black")
			.attr("d", function(d){return model.lineGen(d, skin.branchThickness, skin.brachKinkiness);});

		if(web !== undefined)
		{
			web.style("stroke-opacity", function(link){
					return 0.1;
				})
				.style("stroke-width", 1.5);
		}

		if(link !== undefined)
		{
			link.attr("class", "link")
				.style("stroke", "red")
				.style("stroke-opacity", function(link){
					return 0.0;
				})
				.style("stroke-width", 1.3);
		}
		
		if(node !== undefined){
			node.attr("class", "node")
				.attr("r", 1)
				.style("fill", "red");
		}
		state = "stopped";
	}
	function OnStart(d)
	{
		if(vine !== null && vine != undefined )
		{
			vine.remove();
			vine = null;
		}
		var old_vine = simple_vine;
		simple_vine = svg.selectAll(".simple_vine")
			.data(model.basic_paths)
			.enter().insert("path", ".leaf")
			.attr("class", "simple_vine")
			.style("fill", "none")
			.style("fill-opacity", 1.0)
			.style("stroke-opacity", 1.0)
			.style("stroke-width", 1.6)
			.style("stroke", skin.branchColors[0])
			.attr("d", model.simpleLineGen());
		if(old_vine !== null ) old_vine.remove();
		web.style("stroke-opacity", 0.0);
		state = "started";
	}
	
	brown_color = "#663409";
	cream_color = "#FFFAF0";

	return {
		
		Init : function(template){ 
			this.template = template;
			
			svg = d3.select(this.template).append("svg")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*3)
				.style("background-color", "none");

			var bg_gradient = svg.append("linearGradient")
				.attr("id", "bg_gradient_id")
				.attr("x1","0%")
				.attr( "y1", "100%")
				.attr( "x2", "0%")
				.attr( "y2", "0%")
				.attr("spreadMethod", "pad");
		
			bg_gradient.append("svg:stop")
				.attr("offset", "0%")
				.attr("stop-color", skin.backGroundGradient[0])
				.attr("stop-opacity", skin.backGroundOpacity[0]);

			bg_gradient.append("svg:stop")
				.attr("offset", "100%")
				.attr("stop-color", skin.backGroundGradient[1])
				.attr("stop-opacity", skin.backGroundOpacity[1]);

			svg.append("svg:rect")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*2)
				.attr( "ry", skin.borderRadius)
				.attr( "rx", skin.borderRadius)
				.style("fill", "url(#bg_gradient_id)");

			// these are for debugging, mostly
			// they use up a lot of cycles, so comment them out
			// rather than render them transparently or something
			/*
			link = svg.selectAll(".link")
				.data(model.links)
				.enter().append("line")
				.attr("class", "link")
				.style("stroke", "red")
				.style("stroke-opacity", function(link){
					return 1.0;
				})
				.style("stroke-width", 1.3);
		
			node = svg.selectAll(".node")
				.data(model.active_nodes)
				.enter().append("circle")
				.attr("class", "node")
				.attr("r", 3)
				.style("fill", "red");*/
		
			/*loose = svg.selectAll(".loose")
				.data(model.singles)
				.enter().append("circle")
				.attr("class", "loose")
				.attr("r", 0.1);*/
			web = svg.selectAll(".web")
				.data(model.active_web)
				.enter().append("line")
				.attr("class", "web")
				.style("stroke", "gray")
				.style("stroke-opacity", function(link){
					return 0.0;
				})
				.style("stroke-width", 1.3);
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
				.style("fill-opacity",function(d){
					if(d.type === "e") return 1.0;
					else return 1.0;
				})
				.style("stroke-opacity", 1.0)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", model.kLeaf["miter-limit"])
				.attr("d", function(d){
					if(d.type === "e") return model.kLeaf.d;
					else return model.kFlower.d;
				})
				.on('mouseover', function(d){
					highlight_in_tree(d)
				})
				.on('mouseout', function(d){
					unhighlight_in_tree();
				})
				.call(model.force.drag);

			flower_centers = svg.selectAll(".flower_center")
				.data(model.forkPoints)
				.enter().append("circle")
				.attr("r", model.kFlower.centerR)
				.style("stroke", 1.0)
				.attr("class", "flower_center")
				.style("fill", flower_center);
				
			root = svg.selectAll(".root")
				.data(model.roots)
				.enter().append("circle")
				.attr("r", function(d){
					return Math.max(Math.sqrt(d.terminalLeaves), 3)
				})
				.attr("class", "root")
				.style("fill", class_base_color)
				.call(model.force.drag);

			if(node !== undefined) node.append("title").text(function(d) { return d.name; });
			if(loose !== undefined ) loose.append("title").text(function(d) { return d.name; });
		
			if(root !== undefined ) root.append("title").text(function(d) { return d.name +" " +d.sharedChildren; });
			if(leaf !== undefined )leaf.append("title").text(function(d) { return d.name ; });
		},
		
		OnForceTick : on_force_tick,
		OnForceStop : OnStop,
		OnForceStart : OnStart,


		Start : function(){
			model.InitForce(skin.borderWidth);
			model.force
				.on("tick", this.OnForceTick)
				.on("end", this.OnForceStop)
				.on("start", this.OnForceStart);
			model.force.start();
		},
		
		template: "#app",
		className: "code_forest",
		
		model: model
	};
});
