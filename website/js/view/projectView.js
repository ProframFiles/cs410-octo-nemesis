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
			return d3.interpolateRgb( color_array[indx], color_array[indx+1] )(scaled_val%1);
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
				// noise for pixel shifting
				name : "feTurbulence",
				attributes : {
					"baseFrequency" : 0.09,
					"type" : "fractalNoise",
					"numOctaves" : 1,
					"result" : "perlin" 
				}
			},
			{
				// noise for blotchy whitening
				name : "feTurbulence",
				attributes : {
					"baseFrequency" : 0.3,
					"type" : "fractalNoise",
					"numOctaves" : 2,
					"result" : "perlin_fast" 
				}
			},
			{
				// scale the noise so that it's smaller, monochrome, opaque 
				// and positive only half the time
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
				// displace the pixels a bit: a smudging effect
				name : "feDisplacementMap",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "SourceGraphic",
					"in2" : "perlin",
					"xChannelSelector" : "R",
					"yChannelSelector" : "G",
					"scale" : "5",
					"result" : "displaced"
				}
			},
			{	
				// blur the displaced pixels a tad: the displace filter doesn't do subpixel stuff well
				name : "feConvolveMatrix",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "displaced",
					"kernelMatrix" : [     0.077528, 0.09949, 0.077528,
      0.09949,      0.28193,      0.09949,
     0.077528,      0.09949,     0.077528],
					"result" : "smudged"
				}
			},
			{
				//take the blotching noise and ensure that it's applied only to the opaque parts of the dest.
				name : "feComposite",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "perlinbw",
					"in2" : "smudged",
					"operator" : "in",
					"result" : "perlinBlend"
				}
			},
			{ 
				// make the smudged source smudged and blotchy
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
				// this is only required if the previous sreen does something weird with negative source pixels
				name : "feBlend",
				attributes : {
					"color-interpolation-filters" : "sRGB",
					"in" : "smudged",
					"in2" : "blotched",
					"mode" : "lighten",
					"result" : "done"
				}
			},
		]
	};

	var WoodBlockSkin = 
	{
		name : "Japanese Wood Block",
		branchColors : ["#4C2B20", "#2A1D16", "#602D29"],
		branchOpacity : 1.0,
		leafColors : ["#618C70", "#394F4B","#2A3B3C", "#B1CBBB"],
		leafStrokeColors : ["#618C70", "#394F4B","#2A3B3C", "#B1CBBB"],
		flowerColors : ["#FF8193", "#FFC2D1", "#E8D4D4"],
		flowerStrokeColors : ["#FF8193", "#FFC2D1", "#E8D4D4"],
		flowerCenterColors : ["#261F1D"],
		backGroundGradient : [woodBlockDarkBlue, woodBlockDarkBlue, "#D8C0A5","#D8C0A5", "#D8C0A5"],
		backGroundOpacity : [1.0, 1.0, 1.0, 1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : [woodBlockBrightPink],
		branchStrokeColors :  ["#4C2B20", "#2A1D16", "#602D29"],
		branchKinkiness : 0.95,
		branchThickness : 1.5,
		branchSplineStyle : "basis",
		borderWidth : 50,
		borderRadius : 25,
		leafFilter : woodBlockFilter,
		vineFilter : woodBlockFilter,
		textStroke : "white",
		textFill : "white",
		leaf : model.kLeaf,
		flower : model.kFlower,
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
		borderWidth : 50,
		borderRadius : 25,
		textStroke : "white",
		textFill : "white",
		leaf : model.kLeaf,
		flower : model.kFlower,
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
		flowerCenterColors : ["none"],
		backGroundGradient : ["darkgray","white", "darkgray"],
		backGroundOpacity : [1.0, 1.0, 1.0],
		backGroundColor : "#FFFAF0",
		baseColors : ["black"],
		branchStrokeColors : ["black"],
		branchKinkiness : 0.0,
		branchThickness : 2.0,
		branchSplineStyle : "step-after",
		borderWidth : 50,
		borderRadius : 3,
		textStroke : "black",
		textFill : "white",
		leaf : model.kTri,
		flower : model.kStar,
	};

	function ConnectionColor(classnode)
	{
		var connections = 0
		if(classnode.parents !== undefined) connections += classnode.parents.length + classnode.children.length;
		if  ((0 <= connections) && (connections < 5))
		{
			return 1;
		}
		else if ((5 <= connections) && (connections < 10))
		{
			return 0.8;
		}
		else if ((10 <= connections) && (connections < 20))
		{
			return 0.6;
		}
		else if ((20 <= connections) && (connections < 40))
		{
			return 0.4;
		}
		else if ((40 <= connections) && (connections < 200))
		{
			return 0.2;
		}
		else
		{
			return 0;
		}
	}
	
	function CodeSizeColor(node)
	{
		if(node.implSize === undefined || node.declSize === undefined ) return 0;
		return  1 - Math.min(Math.pow(Math.abs(node.implSize + node.declSize - 40)/180000, 0.3), 1);
	} 

	function LeafRandomColor(node)
	{
		return node.rnd[1];
	} 

	var color_algorithms = 
	{
		"Code size" : CodeSizeColor,
		"num parents + children" : ConnectionColor,
		"Random" : LeafRandomColor
	}

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

	var leaf_random_portion = 0.1;
	var LeafColorGenerator = CodeSizeColor;

	var yellowGreenColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8,9]).range(colorbrewer.RdYlGn[10]);
	var setOneColor = d3.scale.ordinal().domain([0,1,2,3,4,5,6,7,8]).range(colorbrewer.Set1[9]);

	var svg;
	var bg_gradient;
	var center_circle;
	var label_font;
	var label_text;
	var label_string = "";
	var label_visible = false;
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
	var legend = {};



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
		var val = leaf_random_portion*d.rnd[1] + LeafColorGenerator(d)*(1.0-leaf_random_portion);
		if(d.type === "e") return LeafColorFunc(val);
		else return FlowerColorFunc(val);
	}

	function leaf_stroke(d){
		if(d.type === "e") return LeafStrokeColorFunc(d.rnd[1]);
		else return FlowerStrokeColorFunc(d.rnd[2]);
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
		if(d.type === "e") flora = skin.leaf;
		else flora = skin.flower;
		//console.log("leaf path" + d.rnd);
		// scale("+ rnd +")
		var x = d.x;
		var y = d.y;
		var dx = 0;
		var dy = 0;
		if(d.nextLast !== undefined)
		{
			dx = x - d.nextLast.x;
			dy = y - d.nextLast.y;
		}

		return "rotate("+(210+180*(-Math.atan2(dx, dy)/Math.PI)) +" "+ x+ " " +y +
					")  translate(" +(x-flora.x0) +" "+ (y-flora.y0)+ ") scale(" + flora.scale +") " ;			
		
	}

	function BackgroundCircle(start_angle, reversed)
	{
		if(reversed === undefined) reversed = false;
		if(start_angle === undefined) start_angle = 0;
		var increment = 0.001;
		if(reversed) increment *= -1;
		direction = 0;
		if(reversed) direction = 1;
		var padding = 1;
		if(reversed) padding = 0;
		start_angle = start_angle*Math.PI/180+Math.PI;
		var rx = model.width*0.5+padding*skin.borderWidth*0.7;
		var ry = model.height*0.5+padding*skin.borderWidth*0.7;
		var ix = Math.cos(-start_angle)*rx;
		var iy = Math.sin(-start_angle)*ry;
		var fx = Math.cos(-start_angle+increment)*rx;
		var fy = Math.sin(-start_angle+increment)*ry;
		var start_x = ( model.width*0.5+skin.borderWidth) +ix;
		var start_y =  (model.height*0.5+skin.borderWidth) +iy;
		var end_x = fx-ix;
		var end_y =  fy-iy;

		return "M" +start_x + " " +start_y +"a" + rx + " " +ry +" " + 0 + " " + 1 + " " + direction + " " + 
					end_x + " " + end_y + "z";
	}

	function highlight_in_tree(leaf, dom_elem)
	{
		//d3.select(dom_elem).style("fill", "red");
		if(highlight_path !== null)
		{
			unhighlight_in_tree();
		}
		
		if(leaf.root.name !== label_string)
		{
			label_string = leaf.root.name;
			var cx = model.width*0.5+skin.borderWidth;
			var cy = model.height*0.5+skin.borderWidth;
			var root_angle = Math.atan2(leaf.root.x-cx, leaf.root.y-cy)*(180/Math.PI)-90;
			console.log(root_angle);

			center_circle.attr("d", BackgroundCircle(root_angle, (root_angle+720)%360 < 180 ));
			label_text.attr("xlink:href", "#circle_path")
				.text(leaf.root.name);
		}
		if(!label_visible)
		{
			label_visible = true;
			label_font.transition()
				.attr("font-size", 36)
				.style("fill-opacity", 1)
				.duration(1000)
				.ease(d3.ease("bounce"));
		}

		web.style("stroke", function(d){
				if(d.source === leaf || d.target === leaf) return "yellow";
				else return "gray";
			})
			.style("stroke-opacity", function(d){
				if(d.source === leaf || d.target === leaf) return 0.5;
				else return 0.05;
			})

		highlight_path = svg.selectAll(".hl_vine")
				.data([leaf])
				.enter().append("path")
				.attr("class", "hl_vine")
				.style("fill", "red")
				.style("fill-opacity", 0.9)
				.style("stroke-opacity", 1.0)
				.style("stroke-width", 1.0)
				.style("stroke", "black")
				.attr("d", function(d){return model.lineGen(d, 3.0, skin.branchKinkiness, skin.branchSplineStyle);});
		
		highlight_leaf = svg.selectAll(".hl_leaf")
				.data([leaf])
				.enter().append("path")
				.attr("class", "hl_leaf")
				.style("stroke-width", 1.0)
				.style("stroke", "red")
				.style("fill", "red")
				.style("fill-opacity",function(d){
					if(d.type === "e") return 0.9;
					else return 0.9;
				})
				.style("stroke-opacity", 1.0)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", skin.leaf["miter-limit"])
				.attr("d", function(d){
					if(d.type === "e") return skin.leaf.d;
					else return skin.flower.d;
				}).attr("transform", leaf_transform);

		highlight_leaf.append("title").text( leaf.name + "\nsize: " + (leaf.implSize + leaf.declSize) + " bytes");

	}
	function unhighlight_in_tree(root)
	{
		if(highlight_path!==undefined && highlight_path !== null)
		{
			if(label_visible)
			{
				label_visible = false;
				label_font.transition()
				.attr( "font-size", 0)
				.style("fill-opacity", 0)
				.ease(d3.ease("linear")).duration(500);

			}

			web.style("stroke", "gray")
			.style("stroke-opacity", 0.1);

			highlight_path.remove();
			highlight_leaf.remove();
			highlight_path = null;
			highlight_leaf = null;
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
			.attr("d", function(d){return model.lineGen(d, skin.branchThickness, skin.branchKinkiness, skin.branchSplineStyle);})
			.on('mouseover', function(d){
					highlight_in_tree(d, this);
			});


		if(skin.leafFilter !== undefined) leaf_group.attr("filter", "url(#" +skin.leafFilter.id +")");
		if(skin.vineFilter !== undefined) vine_group.attr("filter", "url(#" +skin.vineFilter.id +")");

		if(web !== undefined)
		{
			web.style("stroke-opacity", 0.1)
				.style("stroke-width", 1.5);
		}
		web.attr("x1", function(d) { return d.source.x - (d.source.type === "e" ? 0 : 0); })
			.attr("y1", function(d) { return d.source.y - (d.source.type === "e" ? 0 : 0); })
			.attr("x2", function(d) { return d.target.x - (d.target.type === "e" ? 0 : 0); })
			.attr("y2", function(d) { return d.target.y - (d.target.type === "e" ? 0 : 0); });


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
	
	function PlaceLabel(parent, text, x, y, size)
	{
		return parent.append("svg:text")
			.attr("x", x)
			.attr("y", y)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold")
			.attr("font-size", size)
			.attr("baseline-shift", "-50%")
			.style("fill", skin.textFill )
			.style("stroke", skin.textStroke)
			.style("stroke-width", 0.0)
			.style("stroke-opacity", 0.0)
			.text(text);
	}

	function ShowLegend()
		{
			legend.group.selectAll("*").remove();
			var leaf_locations = [ 
				{x : 35, y : 20, type : "e", rnd : [ Math.random(), 1, Math.random(), Math.random()]},
				{x : 25, y : 60, type : "m", rnd : [ Math.random(), Math.random(), Math.random(), Math.random()]}

			];
			var root_location = {x : 25, y : 100, type : "r", rnd : [ Math.random(), Math.random(), Math.random(), Math.random()]};
			

			leaf_group.selectAll(".leaf_legend").remove();
			leaf_group.append("circle")
				.data([root_location])
				.attr("r", 13)
				.attr("cx", root_location.x)
				.attr("cy", root_location.y)
				.style("stroke", "white")
				.style("stroke-width", 1.0)
				.style("fill", class_base_color);

			PlaceLabel(legend.group, "Leaf class (no children)", 50, 20, 16);
			PlaceLabel(legend.group, "Class with children and parents",  50, 60, 16);
			PlaceLabel(legend.group, "Root class (no parents)", 50, 100, 16);

			legend.leaf = leaf_group.selectAll(".leaf_legend")
				.data(leaf_locations)
				.enter().append("svg:path")
				.attr("class", "leaf_legend")
				.style("stroke-width", vine_stroke_width)
				.style("stroke", "white")
				.style("fill", leaf_fill)
				.style("fill-opacity", 1.0)
				.style("stroke-opacity", 1.0)
				.style("stroke-linejoin", "miter")
				.style("miter-limit", skin.leaf["miter-limit"])
				.attr("d", function(d){
					if(d.type === "e") return skin.leaf.d;
					else return skin.flower.d;
				})
				.attr("transform", leaf_transform);

			leaf_group.selectAll(".legend_flower_center").
				data([leaf_locations[1]])
				.enter().append("circle")
				.attr("class", "legend_flower_center")
				.attr("cx", leaf_locations[1].x)
				.attr("cy", leaf_locations[1].y)
				.attr("r", skin.flower.centerR)
				.style("stroke", 1.0)
				.style("fill", flower_center);
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


		// Set these less than 1 to crop the svg
		// it was previously set to width 0.6, height 0.4
		var width_multiplier = 1.0;
		var height_multiplier = 1.0;


		svg.attr("width", width_multiplier*(model.width+skin.borderWidth*2))
			.attr("height", height_multiplier*(model.height+skin.borderWidth*4));

		bg_gradient.remove();
		bg_gradient = svg.insert("linearGradient", ".web_group")
			.attr("id", "bg_gradient_id")
			.attr("x1","0%")
			.attr( "y1", "100%")
			.attr( "x2", "0%")
			.attr( "y2", "0%")
			.attr("spreadMethod", "pad");

		var gradient_dv = 100/(Math.max(skin.backGroundGradient.length-1, 1))
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

		center_circle.attr("d", BackgroundCircle());

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
			.style("miter-limit", skin.leaf["miter-limit"])
			.attr("d", function(d){
				if(d.type === "e") return skin.leaf.d;
				else return skin.flower.d;
			})
			.attr("transform", leaf_transform);

		flower_centers.attr("r", skin.flower.centerR)
			.style("stroke", 1.0)
			.style("fill", flower_center);

		root.attr("r", function(d){
				return Math.max(Math.sqrt(d.terminalLeaves), 3)
			})
			.style("fill", class_base_color);

		var gradient_data = [];
		for (var i = 0; i < 101; i++) {
			gradient_data.push(i*0.01);
		};
		var rect_width = (model.width+skin.borderWidth*2)/gradient_data.length;


		svg.selectAll(".leaf_gradient_rect").remove();
		svg.selectAll(".leaf_gradient_rect")
			.data(gradient_data)
			.enter().append("rect").attr("class", "leaf_gradient_rect")
			.attr("y", model.height+skin.borderWidth*2)
			.attr("x", function(d){
				return Math.floor((model.width+skin.borderWidth*2)*d) ;
			})
			.attr("width", function(d){
				return Math.ceil((model.width+skin.borderWidth*2)*(d+0.01) - Math.floor((model.width+skin.borderWidth*2)*d)) ;
			})
			.attr("height", skin.borderWidth)
			.style("fill", function (d){
				return LeafColorFunc(d);
			});
		svg.selectAll(".branch_gradient_rect").remove();
		svg.selectAll(".branch_gradient_rect")
			.data(gradient_data)
			.enter().append("rect").attr("class", "branch_gradient_rect")
			.attr("y", model.height+skin.borderWidth*3)
			.attr("x", function(d){
				return (model.width+skin.borderWidth*2)*d;
			})
			.attr("width", function(d){
				return Math.ceil((model.width+skin.borderWidth*2)*(d+0.01) - Math.floor((model.width+skin.borderWidth*2)*d)) ;
			})
			.attr("height", skin.borderWidth)
			.style("fill", function (d){
				return BranchColorFunc(d);
		});

		ShowLegend();

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

		Init : function(template, themeSelect, colorAlgoSelect){ 
			this.template = template;

			var selector = d3.select(themeSelect);
			for (var i = 0; i < themeArray.length; i++) {
				selector.append("option")
					.attr("value", i)
					.text(themeArray[i].name);
			};

			selector = d3.select(colorAlgoSelect);
			for(var color_alg in color_algorithms)
			{
				selector.append("option")
					.attr("value", color_alg)
					.text(color_alg);
			}

			// we set the size here, but it's immediately overwritten in
			// SetTheme(), so look there to *actually* set the size
			svg = d3.select(this.template).append("svg")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*4)
				.style("background-color", "none");

			filters = svg.append("defs");



			bg_gradient = svg.append("linearGradient")
				.attr("id", "bg_gradient_id")
				.attr("x1","0%")
				.attr( "y1", "100%")
				.attr( "x2", "0%")
				.attr( "y2", "0%")
				.attr("spreadMethod", "pad");
			var gradient_dv = 100/(Math.max(skin.backGroundGradient.length-1, 1))

			for (var i = 0; i < skin.backGroundGradient.length; i++) {
				bg_gradient.append("svg:stop")
				.attr("offset", i*gradient_dv+"%")
				.attr("stop-color", skin.backGroundGradient[i])
				.attr("stop-opacity", skin.backGroundOpacity[i]);
			};

			web_group = svg.append("g")
				.attr("class", "web_group")
				.on('mouseover', function(d){
					unhighlight_in_tree();
				});

			bg_rect = web_group.append("svg:rect")
				.attr("width", model.width+skin.borderWidth*2)
				.attr("height", model.height+skin.borderWidth*2)
				.attr( "ry", skin.borderRadius)
				.attr( "rx", skin.borderRadius)
				.style("fill", "url(#bg_gradient_id)");
				

			center_circle = svg.append("svg:path")
				.attr("class", "center_circle")
				.attr("id", "circle_path")
				.style("stroke", "none")
				.style("fill", "none")
				.attr("d", BackgroundCircle());





		
			web = web_group.selectAll(".web")
				.data(model.active_web)
				.enter().append("line");

			vine_group = svg.append("g")
				.attr("class", "vine_group")
				.attr("image-rendering", "optimizeQuality");
			leaf_group = svg.append("g")
				.attr("class", "leaf_group")
				.attr("image-rendering", "optimizeQuality");
			leaf = leaf_group.selectAll(".leaf")
				.data(model.leaves)
				.enter().append("path")
				.attr("class", "leaf")
				.on('mouseover', function(d){
					highlight_in_tree(d, this);
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

			label_font = svg.append("svg:text")
				.attr("text-anchor", "middle")
				.attr("font-family", "sans-serif")
				.attr( "font-weight", "bold") 
				.attr( "font-size", 0) 
				.attr("baseline-shift", "100%")
				.style("fill", skin.textFill )
				.style("stroke", skin.textStroke)
				.style("stroke-width", 0.0)
				.style("stroke-opacity", 0.0);
			label_text = label_font.append("svg:textPath")
				.attr("startOffset", "50%")
				.attr("xlink:href", "#circle_path")
				.text("text, on on a path!!");
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
			legend.group = svg.append("g")
				.attr("class", "legend_group");

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

		SetColorAlgorithm : function(alg_name)
		{
			LeafColorGenerator = color_algorithms[alg_name];
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
