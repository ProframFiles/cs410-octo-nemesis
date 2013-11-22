define(["doom3Data", "d3"], function(raw_data, d3){
	// Private variables and private functions
	const kBranchFactor = 1/0.7;
	const kVineLinkStrength = 1.0;
	const kVineLinkDistance = 10.1;
	const width = 1024;
   	const height = 1024;

	Array.prototype.back=function()
	{
		return this[this.length-1];
	}

	const kGrassTuft = {
		
		fill : "none",
		"stroke-width" : 0.5,
		"stroke-linecap" : "round",
		"stroke-linejoin" : "miter",
		"stroke-miterlimit" : 40,
		"stroke-opacity" : 1,
		"stroke-dasharray" : "none",
		"marker-start" : "none",
	
		scale : 1.0,
		d : "m 21.063,15.702 c 0,0 4.38204,5.69008 9.17024,19.39083 0.84026,2.40427 1.36993,5.12099 1.68054,7.90177 -1.22648,-1.98607 -4.62718,-6.17857 -6.52825,-7.82906 -8.61895,-7.48288 -18.66367,-6.29394 -18.66367,-6.29394 0,0 9.82249,0.96354 19.59281,11.78801 1.76216,1.95228 3.05448,4.1873 3.99937,6.4717 -0.0436,0.12275 -0.0878,0.24096 -0.12927,0.36357 -2.38321,-3.43135 -4.45189,-6.96944 -10.60033,-9.91356 -6.14843,-2.94412 -12.73359,-3.94504 -18.95453,0.95338 4.55069,-2.00202 10.12542,-2.00238 17.7426,2.07644 7.61719,4.07881 8.5705,9.08748 10.38218,14.26842 -0.3424,5.08389 0.59788,8.8713 0.59788,8.8713 l 8.16608,-0.0514 c 0,0 -0.0619,-2.56934 -0.44206,-5.46693 0.17093,-1.12498 0.33468,-2.38135 0.46053,-3.77314 1.41388,-3.75058 4.13603,-7.79746 8.75012,-11.1982 7.30502,-5.38403 12.28208,-5.54345 17.48407,-4.6538 -0.86498,-0.4767 -3.9204,-2.13602 -8.11992,-1.92293 -3.92136,0.19899 -8.96537,1.48729 -14.2361,6.05964 -1.43904,1.24836 -2.66374,2.57659 -3.7085,3.92664 -0.0425,-0.85681 -0.10124,-1.72629 -0.19391,-2.6016 0.73186,-1.3258 1.13017,-4.51563 7.14229,-9.17025 6.01213,-4.65462 14.70472,-5.65566 14.70472,-5.65566 -8.41969,-0.51495 -14.27494,1.55125 -17.84765,3.84585 -3.5727,2.2946 -4.84952,4.38788 -5.17089,4.6942 -0.42333,-1.51217 -0.95994,-3.00136 -1.62397,-4.44373 -5.55801,-12.07259 -13.65438,-17.63758 -13.65438,-17.63758 z",
		id : "grass"
	};

	const kLeaf = {

		fill : "none",
		"stroke-width" : 0.5,
		"stroke-linecap" : "round",
		"stroke-linejoin" : "miter",
		"stroke-miterlimit" : 40,
		"stroke-opacity" : 1,
		"stroke-dasharray" : "none",
		"marker-start" : "none",
		
		scale : 1.0,
		x0 : 8,
		y0 : 29,
		d : "M 7.4474,21.962 C 7.8991,17.887 16.485,14 16.485,14 c 0,0 -7.981,4.328 -7.981,8.436 C 21.239,24.431 28.288,9.606 24.485,2 c 0,8 -18,4 -18,20 0,6 2.0213,8 2.0213,8 0,0 -1.7199,-2.074 -1.0589,-8.038 z",
		id : "leaf"
	};

	const kFlower =  {
		"stroke-linejoin" : "miter",
		"stroke-miterlimit" : 10,
		"stroke-width" : 0.5,
		stroke : "black",

		centerR : 4,
		scale : 0.6,
		x0 : 17*0.6,
		y0 : 16*0.6,
		d : "M17.944,21.429c3.715,12.019,18.305,9.423,11.42-0.27c-1.192-1.678-3.538-3.158-5.281-3.762c2.299-0.22,4.727,0.216,6.911-0.854c4.2-2.06,5.007-8.429,0.441-10.407c-5.357-2.32-7.721,2.339-9.753,6.104c-0.119-4.016,1.502-11.113-4.371-11.704c-6.748-0.678-6.027,7.503-4.104,11.38c-3.146-3.406-11.771-3.04-12.638,2.05c-0.878,5.154,6.532,6.66,10.237,6.308c-4.004,2.596-4.797,9.588-0.884,11.074C15.888,33.613,17.849,26.019,17.944,21.429z"
	};

	const kStar =  {
		"stroke-linejoin" : "miter",
		"stroke-miterlimit" : 10,
		"stroke-width" : 0.5,
		stroke : "black",

		centerR : 4,
		scale : 1.6,
		x0 : 0,
		y0 : 0,
		d : d3.svg.symbol().type("cross")()
	};

	const kTri =  {
		"stroke-linejoin" : "miter",
		"stroke-miterlimit" : 10,
		"stroke-width" : 0.5,
		stroke : "black",

		scale : 1.3,
		x0 : 0,
		y0 : 7.5,
		d : d3.svg.symbol().type("triangle-down")()
	};

	function CurveNode(parentArray, index)
	{
		return {
			homeCurve : parentArray,
			curveIndex : index,
			connections : 0,
			type : "c",
			rnd : [ Math.random(), Math.random(), Math.random(), Math.random()]
		};
	}


	function ConnectionColor(classnode)
	{
		var connections = classnode.parentArray.length + classnode.childArray.length;
		if  ((0 <= connections) && (connections < 1))
		{
			return 1;
		}
		else if (connections === 1)
		{
			return 0.9;
		}
		else if (connections === 2)
		{
			return 0.8;
		}
		else if (connections === 3)
		{
			return 0.7;
		}
		else if (connections === 4)
		{
			return 0.6;
		}
		else if ((5 <= connections) && (connections < 7))
		{
			return 0.5;
		}
		else if ((7 <= connections) && (connections < 10))
		{
			return 0.4;
		}
		else if ((10 <= connections) && (connections < 15))
		{
			return 0.3;
		}
		else if ((15 <= connections) && (connections < 20))
		{
			return 0.2;
		}
		else if ((20 <= connections) && (connections < 30))
		{
			return 0.1;
		}
		else
		{
			return 0;
		}
	}

  
	function GenerateAllNodes(class_array)
	{
		var node_array = [];
		var root_array = [];
		var loose_array = [];
		var leaf_array = [];
		var codeSize = 0;
		const array_size = class_array.length;
		for (var i = 0; i < array_size; ++i)
		{
			var this_class = class_array[i];
      	codeSize = Math.max(codeSize, this_class.declSize, this_class.implSize);
			var this_node = 
				{
					active : false,
					depth : 0,
					connections : 0,
					root : 0,
					terminalLeaves : 0,
					maxDepth : 0,
					declSize : this_class.declSize,
					implSize : this_class.implSize,
					drawOrder : -1,
					parents : [],
					children : [],
					methodCalls : this_class.methodCalls,
					intrusiveDataRefs : this_class.intrusiveDataRefs,
					sharedChildren : 0,
					name : this_class.qualifiedName,
					USR : this_class.USR,
					rnd : [ Math.random(), Math.random(), Math.random(), Math.random()]
				};

			node_array[this_class.index] = this_node;
			
			if(this_class.parentArray.length ===0 && this_class.childArray.length > 0)
			{
				root_array.push(this_node);
				this_node.type = "r"; // "r"oot node 
			}
			else if(this_class.parentArray.length ===0)
			{
				this_node.type = "u"; // "unconnected" node (no parents or children)
				loose_array.push(this_node);
			}
			else if(this_class.childArray.length > 0)
			{
				this_node.type = "m"; // "m"iddle node
			}
			else 
			{
				this_node.type = "e";  // "e"nd node
			}
		}
		return {
				largestCodeSize : codeSize,
				nodes : node_array,
				leaves : leaf_array,
				singles : loose_array,
				roots : root_array
			};
	}

	function MakeLink(src, dst, strength)
	{
		src.connections += 1;
		dst.connections += 1;
		if(strength === undefined)
		{
			strength.french();
		}
		//console.log(strength);
		return {source : src, target : dst, value : strength};
	}
	

	function CountToRoot(node, max_depth)
	{
		node.terminalLeaves++;
		node.maxDepth = Math.max(node.maxDepth, max_depth);
		if(node.parents.length > 0)
		{
			CountToRoot(node.parents[0], max_depth + 1);
		}
	}

	function GenerateTree(data, class_array)
	{
		data.link_web = [];
		for (var indx = 0; indx < class_array.length; indx++) 
		{
			var this_class = class_array[indx];
			var this_node = data.nodes[indx];
			for (var i = 0; i < this_class.childArray.length; i++) {
				this_node.children.push(data.nodes[this_class.childArray[i]]);
			}
			for (i = 0; i < this_class.parentArray.length; i++) {
				this_node.parents.push(data.nodes[this_class.parentArray[i]]);
			}
			for (i = 0; i < this_class.intrusiveDataRefs.length; i++) {
				var intruder = this_node.intrusiveDataRefs[i].intruder;
				this_node.intrusiveDataRefs[i].intruder = data.nodes[intruder];
				data.link_web.push({source: this_node.intrusiveDataRefs[i].intruder, target : this_node, value : this_node.methodCalls.intrusionCount, type : "i"});
			}
			for (i = 0; i < this_class.methodCalls.length; i++) {
				var caller = this_node.methodCalls[i].caller;
				this_node.methodCalls[i].caller= data.nodes[caller];
				data.link_web.push({source: this_node.methodCalls[i].caller, target : this_node, value : this_node.methodCalls.callCount, type : "m"});
			}
			this_node.parents.sort(function(n1, n2){ return n1.USR.localeCompare(n2.USR); });
			this_node.children.sort(function(n1, n2){ return n1.USR.localeCompare(n2.USR); });
		}
		var common_roots = {};
		for (var i = data.nodes.length - 1; i >= 0; i--) {
			if(data.nodes[i].type === "e")
			{
				CountToRoot(data.nodes[i], 0);
			}
		}

	}

	function MakeParentPathLink(data, node, parent, current_path)
	{
		if(parent === node ) return;
		var rootmost = parent;
		var leafmost = node;
		for (var i = 0; i < Math.max(Math.min(parent.children.length, 2-node.depth), 0.2*Math.sqrt(node.terminalLeaves)+1) ; i++) {
			var nn = CurveNode( current_path, current_path.length);
			nn.root = parent.root;
			current_path.push(nn);
			data.nodes.push(nn);
			data.links.push(MakeLink(nn, rootmost, kVineLinkStrength));
			rootmost = nn;
			nn.terminalLeaves = (node.terminalLeaves);
		};
		current_path.push(node);
		data.links.push(MakeLink(node, rootmost, kVineLinkStrength));
	}

	function GenTreePathsWorker(data, parent, node, current_path)
	{
		var this_path = [];
		var basic_path = [current_path.back()];
		var depth = parent.depth + 1;
		var bottom = 0;
		for (var i = bottom; i < current_path.length; ++i) {
			this_path.push(current_path[i]);
		}
		node.depth = depth;
		node.root = parent.root;

		if(node.type !== "r" ) 
		{
			MakeParentPathLink(data, node, parent, basic_path);
			this_path = this_path.concat(basic_path);
		}

		if(node.type !== "r" && (parent != node.parents[0] || node.type ===  "e"))
		{
			if(parent != node.parents[0])
			{
				for (var p = 0; p < node.parents.length; p++) {
					node.parents[p].sharedChildren++;
					node.parents[p].root.sharedChildren++;
				}
			}

			data.paths.push(this_path);
			data.basic_paths.push(basic_path);
		}
		else if(node.type !==  "e")
		{
			if(node.type != "r" ) data.forkPoints.push(node);
			//put a kink here
			this_path.push(node);
			//this_path.push(node);
			
			if(this_path.length > 2)
			{
				data.paths.push(this_path);
				data.basic_paths.push(basic_path);
			}
			var pl = this_path.length;
			var last_link_node;
			var new_path;
			for (i = 0; i < node.children.length; i++) 
			{
				new_path = GenTreePathsWorker(data, node, node.children[i], this_path);
				if(last_link_node !== undefined)
				{
					data.links.push(MakeLink(new_path[new_path.length-1], last_link_node, 10.3));
				}
				last_link_node = new_path[new_path.length-1];
			}
		}
		return basic_path;
	}

	function GenerateTreePaths(data)
	{
		data.paths = [];
		data.forkPoints = [];
		data.basic_paths = [];
		data.links = [];
		var current_path = [];
		for (var root_index = data.roots.length - 1; root_index >= 0; root_index--) {
			var root = data.roots[root_index];
			root.root = root;
			current_path = [];
			var extra_node = CurveNode(current_path, 0);
			extra_node.root = root;
			extra_node.type = "s";
			data.nodes.push(extra_node);
			current_path.push(root);
			data.links.push(MakeLink(extra_node,root, 1.5));
			root.depth = -1;
			GenTreePathsWorker(data, root, root, current_path);
		}
		for (var leaf_index = data.paths.length - 1; leaf_index >= 0; leaf_index--) {
			var leaf = data.paths[leaf_index][data.paths[leaf_index].length-1];
			if(leaf.curveRandom === undefined) leaf.curveRandom = [];
			var len = data.paths[leaf_index].length;
			while(leaf.curveRandom.length <  len) {
				leaf.curveRandom.push({x:Math.random(), y:Math.random(), mx:Math.random(), my:Math.random()});
			}
			leaf.path = data.paths[leaf_index];
			leaf.nextLast = data.paths[leaf_index][data.paths[leaf_index].length-2];
			data.leaves.push(leaf);
		}


	}

	function GenerateBackgroundMesh(data, d3)
	{
		data.web = []
		for (var i = 0; i < data.active_nodes.length; i++) {
			var node = data.active_nodes[i]
			for (var i = 0; i < node.length; i++) {
				Things[i]
			};
		};
	}

	function InitializePositions(data)
	{

		var radius = width*0.49;
		var cx = width/2;
		var cy = height/2;
		const pow_fac = 0.3;
		var incr = 2.0*Math.PI / data.roots.length;

		data.roots.sort(function (lhs, rhs){return lhs.sharedChildren - rhs.sharedChildren; } );
		for (var i = 0; i < data.roots.length; i++) {
			var angle = incr*i +0.1*(Math.random()-0.5);
			data.roots[i].x = Math.cos(angle-180)*radius+cx;
			data.roots[i].y = Math.sin(angle-180)*radius+cy;
		};

	

		for (var i = 0; i < data.active_nodes.length; i++) 
		{
			radius =  Math.sqrt(data.active_nodes[i].root.terminalLeaves +4);
			if(radius != radius) throw radius;
			var rx ;
			var ry ;
			do{
				rx = (2.0*(Math.random()-0.5))*radius;
				ry = (2.0*(Math.random()-0.5))*radius;
			}while((rx*rx+ry*ry) < radius*radius);
			if(data.active_nodes[i].type !== "r")
			{
				data.active_nodes[i].x = rx+data.active_nodes[i].root.x;
				data.active_nodes[i].y = ry+data.active_nodes[i].root.y;
			}
		}
		
		
	}


	
	function ProcessRawClassData (d3, json) 
	{

		var class_array = json.classes;
		var data = GenerateAllNodes(class_array);
		GenerateTree(data, json.classes);
		GenerateTreePaths(data);

		

		data.active_nodes = [];
		data.active_web = [];
		for (var i = 0; i < data.nodes.length; i++) {
			if(data.nodes[i].type !== "u")
			{ 
				data.active_nodes.push(data.nodes[i]);
				if(data.active_nodes.back().type === "r") data.active_nodes.back().fixed = true;
			}
			
		}
		for (var i = 0; i < data.link_web.length; i++) {
			if(data.link_web[i].target.type !== "u" && data.link_web[i].source.type !== "u")
			{
				data.active_web.push(data.link_web[i]);
			}
		}
		InitializePositions(data);
		data.building_path = 0;
		data.building_path_length =0; 
		return data;
	}
/*
	data : {
		nodes : all the nodes to be considered by the physics sim
		levels : array of the cum. sum of the number of members at each tree depth
		links : all the connections to be considered by the physics sim
		leaves : all the nodes that reside on the end of a path
		paths : an array of arrays. each subarray represents a spline path
		roots : all the root nodes
		singles : all the unconnected nodes
	} 
*/
	var data = ProcessRawClassData(d3, raw_data);
	
	function root_gen(root){
		return d3.svg.line()
		.x(function(d){
			return root.x;
		})
		.y(function(d){
			return root.y;
		});
	}
	function simple_line_gen(line_type){
		if(line_type === undefined) line_type = "basis";
		return d3.svg.line()
		.x(function(d){
			return d.x;
		})
		.y(function(d){
			return d.y;
		}).interpolate(line_type);
	}
	// generate a "vine" from an array of points
	// thick determines the thickness at a given control point
	// shifter determines the shift from the center line (to generate randomly wavy vines)
	function vine_gen(d, thick, shifter, kinkyness, line_type)
	{
		var tf;
		var sf ;
		var dupe_threshold = 0.0;
		if(kinkyness !== undefined) dupe_threshold = kinkyness;

		if(typeof thick === "function") tf = thick;
		else tf = function(d){return thick;}

		if(typeof shifter === "function") sf = shifter;
		else if (shifter === undefined ) sf = function(d){return {x:0, y:0};};
		else sf = function(d){return shifter;}

		var diffs = [];
		if(d.length > 0) diffs.push({x:0, y:0});
		for (var i = 1; i < d.length-1; i++) {
			var dx = (d[i+1].x - d[i-1].x)*0.5;
			var dy = (d[i+1].y - d[i-1].y)*0.5;
			var norm =  (dx*dx+dy*dy ==0 ) ? 1.0 : 1.0/Math.sqrt(dx*dx+dy*dy);
			diffs.push({x: -dy*norm, y:dx*norm, dupe: Math.random() < dupe_threshold });
		}
		if(d.length > 1) diffs.push({x:0, y:0});
		var L = [];
		var thickness = 0;
		var shift = 0;
		for (var i = 0; i < diffs.length; i++) 
		{
			thickness = tf(d[i], i);
			shift = sf(d[i], i);
			if(shift.x != shift.x) throw "NaN";
			L.push({x: d[i].x + thickness*diffs[i].x+ shift.x, y: d[i].y + thickness*diffs[i].y+ shift.y});
			if(diffs[i].dupe){
				L.push(L.back());
				L.push(L.back());
			}
		}

		L.push({x: d.back().x + thickness*diffs.back().x + shift.x, y: d.back().y + thickness*diffs.back().y+ shift.y});
		
		for (var i = diffs.length - 1; i >= 0; i--) 
		{
			thickness = tf(d[i], i);
			shift = sf(d[i], i);
			if(shift.x != shift.x) throw "NaN";
			L.push({x: d[i].x - thickness*diffs[i].x + shift.x, y: (d[i].y - thickness*diffs[i].y + shift.y)});
			if(diffs[i].dupe){
				L.push(L.back());
				L.push(L.back());
			}
			if(L.back().x != L.back().x) throw "NaN";
		}
		var str = simple_line_gen(line_type)(L);
		//console.log(str);
		return str;
	}
	function line_gen(leaf, thick, kinkyness,line_type){
		var shiftfunc = function(d,i) {
			if(d.type !== "c" )
			{
				return {x:0, y:0};
			}
			else
			{
				var rt = 3.0*Math.sqrt(d.terminalLeaves);
				var x_part =(rt*( leaf.curveRandom[i].mx-0.5));
				var y_part =(rt*( leaf.curveRandom[i].my-0.5));
				return  { x: x_part, y: y_part };
			}
		}
		return  vine_gen(leaf.path, thick, shiftfunc, kinkyness, line_type);
	}

	var force = d3.layout.force().nodes(data.active_nodes)
		.links(data.links);
	data.InitForce = function(border) {
		 for (var i = 0; i < data.active_nodes.length; i++) {
		 	data.active_nodes[i].x += border;
		 	data.active_nodes[i].y += border;
		 }

		
		// repulsion between nodes is a -ive charge
		force.charge(function(node){
			if(node.type ==="s") return -100;
			if(node.type ==="i") return -1;
			if(node.type ==="c") return -9;
			if(node.type ==="r") return -(50);
			if(node.type ==="e") return -(120/((node.parents[0].children.length/3)));
			if(node.type ==="u") return -(3+3*Math.random());
			return -(5)*node.terminalLeaves/5;
		})
		// nodes will attempt to preserve this distance between nodes 
		.linkDistance(function(link){
			if(link.target.type === "c" || link.source.type === "c") return link.value;
			if(link.target.type === "i" && link.source.type === "i") return 10;
			if(link.target.type === "u" || link.source.type === "u") return link.value;
			return link.value+Math.pow(link.target.depth/2+link.source.connections/2, 1.2)*(link.source.rnd[1]);
		})
		// this is the strength with which the distance above is maintained
		// 1.0 == max
		// 0.0 == min
		.linkStrength(function(link){
			if(link.target.type === "c" || link.source.type === "c") return kVineLinkStrength;
			if(link.target.type === "i" && link.source.type === "i") return 0.8;
			if(link.target.type === "u" && link.source.type === "u") return 0.97;
			else if(link.target.type === "u" || link.source.type === "u") 
			{
				var terminal = Math.max(link.target.terminalLeaves, link.source.terminalLeaves);
				var s = Math.min(terminal/25, 1.0);
				return Math.pow(s, 1.0);
			}
			return 0.7;
		})
		// how strongly everything is drawn into the center
		.gravity(0.17)
		.friction(0.90)
		.size([width+2*border, height+2*border]);
		
	}

	data.width = width;
	data.height = height;
	data.force = force;
	data.kLeaf = kLeaf;
	data.kStar = kStar;
	data.kTri = kTri;
	data.kGrassTuft = kGrassTuft;
	data.kFlower = kFlower;
	data.lineGen = line_gen;
	data.rootGen = root_gen;
	data.simpleLineGen = simple_line_gen;
	data.vineGen = function(thickness) {return function (d){return vine_gen(d, thickness);};}
	return data;
});
