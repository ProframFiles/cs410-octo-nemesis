define( ["d3", "../model/projectModel", "colorbrewer"], function (d3, model, colorbrewer) {	
// Private variables and private functions

	//get a function representing a color spectrum from an array of colors
	function GetColorInterp(color_array)
	{
		//if there is only one color, then don't worry about interpolating anything
		if(color_array.length == 1)
		{
			return function(d){ return color_array[0];};
		}
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
	var woodBlockFilter = 
	{
		id : "displaceFilter",
		elements : [
			{
				name : "feTurbulence",
				attributes : {
					"baseFrequency" : 0.06,
					"type" : "fractalNoise",
					"numOctaves" : 2,
					"result" : "perlin" 
				}
			},
			{
				name : "feTurbulence",
				attributes : {
					"baseFrequency" : 0.3,
					"type" : "fractalNoise",
					"numOctaves" : 2,
					"result" : "perlin_fast" 
				}
			},
			{
				name : "feColorMatrix",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"type" : "matrix",
					"values" : [0.2, 0.01, 0.01, 0.01, -0.1,
									0.2, 0.01, 0.01, 0.01, -0.1, 
									0.2, 0.01, 0.01, 0.01, -0.1,
									0.01, 0.01, 0.01, 0.01, 1.0],
					"in" : "perlin_fast",
					"result" : "perlinbw"
				}
			},
			
			{ 
				name : "feDisplacementMap",
				attributes : {
					"in" : "SourceGraphic",
					"in2" : "perlin",
					"xChannelSelector" : "R",
					"yChannelSelector" : "G",
					"scale" : "5",
					"result" : "displaced"
				}
			},
			{	
				name : "feConvolveMatrix",
				attributes : {
					"in" : "displaced",
					"kernelMatrix" : [     0.077528, 0.10949, 0.077528,
      0.10949,      0.25193,      0.10949,
     0.077528,      0.10949,     0.077528],
					"result" : "smudged"
				}
			},
			{
				name : "feComposite",
				attributes : {
					"in" : "perlinbw",
					"in2" : "smudged",
					"operator" : "in",
					"result" : "perlinBlend"
				}
			},
			{ 
				name : "feBlend",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "smudged",
					"in2" : "perlinBlend",
					//result = k1*i1*i2 + k2*i1 + k3*i2 + k4
					"mode" : "screen",
					"result" : "blotched"
				}
			},
			{ 
				name : "feBlend",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "smudged",
					"in2" : "blotched",
					//result = k1*i1*i2 + k2*i1 + k3*i2 + k4
					"mode" : "lighten",
					"result" : "done"
				}
			},
		]
	};

	var WoodBlockSkin = 
	{
		name : "Japanese Wood Block",
		branchColors : ["#A35E47", "#994943", "#8C6344"],
		branchOpacity : 1.0,
		leafColors : ["#618C70", "#394F4B", "#B1CBBB"],
		leafStrokeColors : ["#618C70", "#394F4B", "#B1CBBB"],
		flowerColors : ["#FF8193", "#FFC2D1", "#E8D4D4"],
		flowerStrokeColors : ["#FF8193", "#FFC2D1", "#E8D4D4"],
		flowerCenterColors : ["#261F1D"],
		backGroundGradient : [woodBlockDarkBlue, woodBlockDarkBlue, "#D8C0A5","#D8C0A5", "#D8C0A5"],
		backGroundOpacity : [1.0, 1.0, 1.0, 1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : [woodBlockBrightPink],
		branchStrokeColors :  ["#714830", "#633125", "#8C6344"],
		branchKinkiness : 0.95,
		branchThickness : 1.5,
		branchSplineStyle : "basis",
		borderWidth : 30,
		borderRadius : 25,
		leafFilter : woodBlockFilter,
		vineFilter : woodBlockFilter,
	};

	var CountryFairSkin = 
	{
		name : "Country Fair",
		branchColors : ["#2B7D30", "#385C43", "#5D851B"],
		branchOpacity : 1.0,
		leafColors : colorbrewer.RdYlGn[10],
		leafStrokeColors : ["black"],
		flowerColors : ["#F23869","#F28E13", "#8E59D9", "#5FB3BA"],
		flowerStrokeColors : ["black"],
		flowerCenterColors : ["#F2B705"],
		backGroundGradient : ["#291802", "#291802"],
		backGroundOpacity : [1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : ["#833128"],
		branchStrokeColors : ["black"],
		branchKinkiness : 0.0,
		branchThickness : 2.0,
		branchSplineStyle : "basis",
		borderWidth : 30,
		borderRadius : 25
	};

	var FuturistSkin = 
	{
		name : "Postmodern",
		branchColors : ["black", "white"],
		branchOpacity : 0.1,
		leafColors : ["white"],
		leafStrokeColors : ["black"],
		flowerColors : ["white"],
		flowerStrokeColors : ["black"],
		flowerCenterColors : ["black"],
		backGroundGradient : ["darkgray","white", "darkgray"],
		backGroundOpacity : [1.0, 1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : ["black"],
		branchStrokeColors : ["black"],
		branchKinkiness : 0.0,
		branchThickness : 2.0,
		branchSplineStyle : "step-after",
		borderWidth : 30,
		borderRadius : 3
	};




	var themeArray = [CountryFairSkin, WoodBlockSkin, FuturistSkin];
	var skin = CountryFairSkin;
	
	var LeafColorFunc = GetColorInterp(skin.leafColors);
	var FlowerColorFunc = GetColorInterp(skin.flowerColors);
	var FlowerCenterColorFunc = GetColorInterp(skin.flowerCenterColors);
	var BaseColorFunc = GetColorInterp(skin.baseColors);
	var BranchColorFunc = GetColorInterp(skin.branchColors);
	var BranchStrokeColorFunc = GetColorInterp(skin.branchStrokeColors);
	var LeafStrokeColorFunc = GetColorInterp(skin.leafStrokeColors);
	var FlowerStrokeColorFunc = GetColorInterp(skin.flowerStrokeColors);

	var yellowGreenColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8,9]).range(colorbrewer.RdYlGn[10]);
	var setOneColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8]).range(colorbrewer.Set1[9]);

	var svg;
	var bg_gradient;
	var bg_rect;
	var filters;
	var leaf;
	var web;
	var web_group;
	var flower_centers;
	var leaf_group;
	var link;
	var simple_vine = null;
	var vine_group;
	var vine;
	var highlight_path;
	var highlight_leaf;
	var node;
	var root;
	var loose;
	var state;
	



	function AddFilterDef(def)
	{
		var new_filter = filters.append("filter")
			.attr("filterUnits", "userSpaceOnUse")
			.attr("id", def.id)
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", model.width+skin.borderWidth*2)
			.attr("height", model.width+skin.borderWidth*2);
		for (var el_index = 0 ; el_index < def.elements.length; ++el_index) {
			var el =def.elements[el_index];
			var svg_fe = new_filter.append(el.name);
			for (var at  in el.attributes) {
				svg_fe.attr(at, el.attributes[at]);
			}
		}
	}

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

	function leaf_stroke(d){
		if(d.type === "e") return LeafStrokeColorFunc(d.rnd[1]);
		else return FlowerStrokeColorFunc(d.rnd[1]);
	}

	function flower_fill(d){
		return FlowerColorFunc(d.rnd[3]);
	}

	function flower_stroke(d){
		return FlowerStrokeColorFunc(d.rnd[3]);
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

	function vine_stroke_color(d){
		return BranchStrokeColorFunc(d.rnd[2]);
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
				.attr("d", function(d){return model.lineGen(d, 3.0, skin.branchKinkiness, skin.branchSplineStyle);});
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
			simple_vine.attr("d", model.simpleLineGen(skin.branchSplineStyle) );
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
		if(vine !== undefined && vine !== null) vine.remove();
		vine = vine_group.selectAll(".vine")
			.data(model.leaves)
			.enter().append("path")
			.attr("class", "vine")
			.style("fill", vine_color)
			.style("fill-opacity", skin.branchOpacity)
			.style("stroke-opacity", 1.0)
			.style("stroke-width", vine_stroke_width)
			.style("stroke", vine_stroke_color)
			.attr("d", function(d){return model.lineGen(d, skin.branchThickness, skin.branchKinkiness, skin.branchSplineStyle);});


		if(skin.leafFilter !== undefined) leaf_group.attr("filter", "url(#" +skin.leafFilter.id +")");
		if(skin.vineFilter !== undefined) vine_group.attr("filter", "url(#" +skin.vineFilter.id +")");

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
		vine_group.attr("filter", null);
		leaf_group.attr("filter", null);
		if(vine !== null && vine != undefined )
		{
			vine.remove();
			vine = null;
		}
		if(simple_vine !== null )simple_vine.remove();
		simple_vine = svg.selectAll(".simple_vine")
			.data(model.basic_paths)
			.enter().insert("path", ".leaf_group")
			.attr("class", "simple_vine")
			.style("fill", "none")
			.style("fill-opacity", 1.0)
			.style("stroke-opacity", 1.0)
			.style("stroke-width", 1.6)
			.style("stroke", skin.branchColors[0])
			.attr("d", model.simpleLineGen(skin.branchSplineStyle));
		web.style("stroke-opacity", 0.0);
		state = "started";
	}
	
	function SetTheme()
	{
		LeafColorFunc = GetColorInterp(skin.leafColors);
		FlowerColorFunc = GetColorInterp(skin.flowerColors);
		FlowerCenterColorFunc = GetColorInterp(skin.flowerCenterColors);
		BaseColorFunc = GetColorInterp(skin.baseColors);
		BranchColorFunc = GetColorInterp(skin.branchColors);
		BranchStrokeColorFunc = GetColorInterp(skin.branchStrokeColors);
		LeafStrokeColorFunc = GetColorInterp(skin.leafStrokeColors);
		FlowerStrokeColorFunc = GetColorInterp(skin.flowerStrokeColors);

		filters.selectAll("*").remove();
		vine_group.attr("filter", null);
		leaf_group.attr("filter", null);
		
		if(skin.leafFilter !== undefined ) AddFilterDef(skin.leafFilter);
		if(skin.vineFilter !== undefined && skin.leafFilter !== skin.vineFilter) AddFilterDef(skin.vineFilter);

		svg.attr("width", model.width+skin.borderWidth*2)
			.attr("height", model.height+skin.borderWidth*2);

		bg_gradient.remove();
		bg_gradient = svg.insert("linearGradient", ".web_group")
			.attr("id", "bg_gradient_id")
			.attr("x1","0%")
			.attr( "y1", "100%")
			.attr( "x2", "0%")
			.attr( "y2", "0%")
			.attr("spreadMethod", "pad");

		gradient_dv = 100/(Math.max(skin.backGroundGradient.length-1, 1))
		for (var i = 0; i < skin.backGroundGradient.length; i++) {
			bg_gradient.append("svg:stop")
			.attr("offset", i*gradient_dv+"%")
			.attr("stop-color", skin.backGroundGradient[i])
			.attr("stop-opacity", skin.backGroundOpacity[i]);
		}

		bg_rect.attr("width", model.width+skin.borderWidth*2)
			.attr("height", model.height+skin.borderWidth*2)
			.attr( "ry", skin.borderRadius)
			.attr( "rx", skin.borderRadius)
			.style("fill", "url(#bg_gradient_id)");

		web.attr("class", "web")
			.style("stroke", "gray")
			.style("stroke-width", 1.3);

		leaf.style("stroke-width", vine_stroke_width)
			.style("stroke", leaf_stroke)
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
			});

		flower_centers.attr("r", model.kFlower.centerR)
			.style("stroke", 1.0)
			.style("fill", flower_center);

		root.attr("r", function(d){
				return Math.max(Math.sqrt(d.terminalLeaves), 3)
			})
			.style("fill", class_base_color);
		if(state === "stopped")
		{
			OnStop();
		}
		else if(state === "started")
		{
			OnStart();
		}
	}

	return {
		
		Init : function(template, themeSelect){ 
			this.template = template;
			var selector = d3.select(themeSelect);
			for (var i = 0; i < themeArray.length; i++) {
				selector.append("option")
					.attr("value", i)
					.text(themeArray[i].name);
			};
			svg = d3.select(this.template).append("svg")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*3)
				.style("background-color", "none");

			filters = svg.append("defs");



			bg_gradient = svg.append("linearGradient")
				.attr("id", "bg_gradient_id")
				.attr("x1","0%")
				.attr( "y1", "100%")
				.attr( "x2", "0%")
				.attr( "y2", "0%")
				.attr("spreadMethod", "pad");
			gradient_dv = 100/(Math.max(skin.backGroundGradient.length-1, 1))

			for (var i = 0; i < skin.backGroundGradient.length; i++) {
				bg_gradient.append("svg:stop")
				.attr("offset", i*gradient_dv+"%")
				.attr("stop-color", skin.backGroundGradient[i])
				.attr("stop-opacity", skin.backGroundOpacity[i]);
			};

			bg_rect = svg.append("svg:rect")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*2)
				.attr( "ry", skin.borderRadius)
				.attr( "rx", skin.borderRadius)
				.style("fill", "url(#bg_gradient_id)");

			web_group = svg.append("g")
				.attr("class", "web_group");
			web = web_group.selectAll(".web")
				.data(model.active_web)
				.enter().append("line");

			vine_group = svg.append("g")
				.attr("class", "vine_group");
			leaf_group = svg.append("g")
				.attr("class", "leaf_group");
			leaf = leaf_group.selectAll(".leaf")
				.data(model.leaves)
				.enter().append("path")
				.attr("class", "leaf")
				.on('mouseover', function(d){
					highlight_in_tree(d)
				})
				.on('mouseout', function(d){
					unhighlight_in_tree();
				})
				.call(model.force.drag);

			flower_centers = leaf_group.selectAll(".flower_center")
				.data(model.forkPoints)
				.enter().append("circle")
				.attr("class", "flower_center");
				
				
			root = svg.selectAll(".root")
				.data(model.roots)
				.enter().append("circle")
				.attr("class", "root")
				.call(model.force.drag);


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
				.style("fill", "red");
		
			loose = svg.selectAll(".loose")
				.data(model.singles)
				.enter().append("circle")
				.attr("class", "loose")
				.attr("r", 0.1);*/

			if(node !== undefined) node.append("title").text(function(d) { return d.name; });
			if(loose !== undefined ) loose.append("title").text(function(d) { return d.name; });
		
			if(root !== undefined )root.append("title").text(function(d) { return d.name +" " +d.sharedChildren; });
			if(leaf !== undefined )leaf.append("title").text(function(d) { return d.name ; });
			SetTheme();
		},
		
		OnForceTick : on_force_tick,
		OnForceStop : OnStop,
		OnForceStart : OnStart,

		SetTheme : function(theme)
		{
			console.log("setTheme : " + theme);
			skin = themeArray[theme];
			SetTheme();
		},

		StopSim : function ()
		{
			if(state === "started")
			{
				model.force.stop();
			}
			else if(state === "stopped")
			{
				model.force.resume();
			}

		},

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
