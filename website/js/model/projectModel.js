define(["doom3Data", "d3"], function(raw_data, d3){
	// Private variables and private functions
	const kBranchFactor = 1/0.7;
	const kVineLinkStrength = 0.99;
	const kVineLinkDistance = 12;
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

		x0 : 17,
		y0 : 16,
		d : "M17.944,21.429c3.715,12.019,18.305,9.423,11.42-0.27c-1.192-1.678-3.538-3.158-5.281-3.762c2.299-0.22,4.727,0.216,6.911-0.854c4.2-2.06,5.007-8.429,0.441-10.407c-5.357-2.32-7.721,2.339-9.753,6.104c-0.119-4.016,1.502-11.113-4.371-11.704c-6.748-0.678-6.027,7.503-4.104,11.38c-3.146-3.406-11.771-3.04-12.638,2.05c-0.878,5.154,6.532,6.66,10.237,6.308c-4.004,2.596-4.797,9.588-0.884,11.074C15.888,33.613,17.849,26.019,17.944,21.429z"
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

	function GenerateAllNodes(class_array)
	{
		var node_array = [];
		var root_array = [];
		var loose_array = [];
		var leaf_array = [];
		const array_size = class_array.length;
		for (var i = 0; i < array_size; ++i)
		{
			var this_class = class_array[i];
			var this_node = 
				{
					active : false,
					depth : 0,
					connections : 0,
					root : 0,
					terminalLeaves : 0,
					maxDepth : 0,
					drawOrder : -1,
					parents : [],
					children : [],
					name : this_class.qualifiedName,
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
				leaf_array.push(this_node);
			}
		}
		return {
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
		console.log(strength);
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
		}
		for (var i = data.nodes.length - 1; i >= 0; i--) {
			if(data.nodes[i].type === "e")
			{
				CountToRoot(data.nodes[i], 0);
			}
		}

	}

	function MakeParentPathLink(data, node, parent, current_path)
	{
		var rootmost = parent;
		var leafmost = node;
		for (var i = 0; i < Math.max(Math.min(parent.children.length, 5-node.depth), 1) ; i++) {
			var nn = CurveNode( current_path, current_path.length);
			current_path.push(nn);
			data.nodes.push(nn);
			data.links.push(MakeLink(nn, rootmost, kVineLinkStrength));
			rootmost = nn;
			nn.terminalLeaves = (node.terminalLeaves);
		};
		current_path.push(node);
		data.links.push(MakeLink(node, rootmost, kVineLinkStrength));
	}

	function GenTreePathsWorker(data, parent, index, current_path)
	{
		var this_path = [];
		var depth = parent.depth + 1;
		var bottom = Math.max(current_path.length -29, 0);
		for (var i = bottom; i < current_path.length; ++i) {
			this_path.push(current_path[i]);
		}
		var node = parent.children[index];
		node.depth = depth;
		node.root = parent.root;

		MakeParentPathLink(data, node, parent, this_path);

		if(parent != node.parents[0] || node.type ===  "e")
		{
			data.paths.push(this_path);
		}
		else if(node.type !==  "e")
		{
			data.forkPoints.push(node);
			//put a kink here
			//this_path.push(node);
			//this_path.push(node);
		
			data.paths.push(this_path);
			var pl = this_path.length;
			for (i = 0; i < node.children.length; i++) 
			{
				GenTreePathsWorker(data, node, i, this_path);
			}
		}
	}

	function GenerateTreePaths(data)
	{
		data.paths = [];
		data.forkPoints = [];
		data.links = [];
		var current_path = [];
		for (var root_index = data.roots.length - 1; root_index >= 0; root_index--) {
			var root = data.roots[root_index];
			root.root = root;
			current_path[0] = root;
			root.depth = 0;
			for (var child_index = 0; child_index < root.children.length; child_index++) {
				GenTreePathsWorker(data, root, child_index, current_path);
			}
		}
		for (var leaf_index = data.paths.length - 1; leaf_index >= 0; leaf_index--) {
			var leaf = data.paths[leaf_index][data.paths[leaf_index].length-1];
			if(leaf.curveRandom === undefined) leaf.curveRandom = [];
			var len = data.paths[leaf_index].length;
			while(leaf.curveRandom.length <  len) {
				leaf.curveRandom.push({x:Math.random(), y:Math.random(), mx:Math.random(), my:Math.random()});
			}
		}

		for (var i = data.paths.length - 1; i >= 0; i--) {
			var path = data.paths[i];
			var backleaf = path.back();
			data.leaves.push(backleaf);
			backleaf.nextLast = path[path.length-2];
			backleaf.path = path;
			backleaf.curveRandom.push(backleaf.curveRandom.back());
			path.push(backleaf);
			for (var q = path.length - 2; q >= 0; q--) {
				path.push(path[q]);
			}
			for (var p = backleaf.curveRandom.length - 2; p >= 0; p--) {
				var c = backleaf.curveRandom[p];
				backleaf.curveRandom.push({x : -c.x, y : -c.y, mx:c.mx, my:c.my});
			}
		}

	}

	function GenerateBackgroundMesh(data, d3)
	{
		var tess = d3.geom.voronoi().x(function(d) { 
			//d.fixed = true;
			return d.x; 
		})
		.y(function(d) {
			return d.y; 
		});
		var voronoi_links =  tess.links(data.singles.concat(data.roots));
		for (var i = voronoi_links.length - 1; i >= 0; i--) {
			var xd = voronoi_links[i].source.x - voronoi_links[i].target.x;
			var yd = voronoi_links[i].source.y - voronoi_links[i].target.y;

			voronoi_links[i].value = Math.sqrt(xd*xd+yd*yd);
		}
		//data.links = data.links.concat(voronoi_links);
	}

	function InitializePositions(data)
	{
		var cx = width/2;
		var cy = height/2;
		const pow_fac = 0.3;
		for (var i = 0; i < data.nodes.length; i++) 
		{
			var rx = (2.0*(Math.random()-0.5));
			var ry = (2.0*(Math.random()-0.5));
			if(data.nodes[i].type !== "u")
			{
				if(rx < 0) rx = -Math.pow(-rx, pow_fac);
				else rx = Math.pow(rx, pow_fac);
				if(ry < 0) ry = -Math.pow(-ry, pow_fac);
				else ry = Math.pow(ry, pow_fac);
			}
			data.nodes[i].x = rx*cx+cx;
			data.nodes[i].y = ry*cy+cy;
		}
	}

	function LinkLeafNodes(data)
	{
		for (var i = 0; i < data.paths.length-1; i++) {
			data.links.push(MakeLink(data.paths[i][data.paths[i].length-1], 
							data.paths[i+1][data.paths[i+1].length-1], 
							15.3));
		}
		data.links.push(MakeLink(data.paths[0][data.paths[0].length-1], 
						data.paths[data.paths.length-1][data.paths[data.paths.length-1].length-1], 
						15.3));
	}

	function CalculateDrawOrder(data)
	{
		data.levels = [];
		data.paths.sort(function(a, b){
			if(a[0].depth != b[0].depth) return a[0].depth - b[0].depth;
			return b.length - a.length;
		});

		for (var i = 0; i < data.nodes.length; i++) {
			if( data.levels[data.nodes[i].depth] === undefined ) data.levels[data.nodes[i].depth] = 0;
			if(data.nodes[i].type !== "u")
			{ 
				data.levels[data.nodes[i].depth] += 1;
			}
		}
		data.levels[0] = 0;

		for (i = 1; i < data.levels.length; i++) {
			data.levels[i] += data.levels[i-1]; 
		}

		for (i = 0; i < data.nodes.length; i++) {
			if( data.nodes[i].depth > 0 )
			{
				data.nodes[i].drawOrder = data.levels[data.nodes[i].depth-1];
				data.nodes[i].drawOrder += Math.random()*(data.levels[data.nodes[i].depth] 
										- data.levels[data.nodes[i].depth-1]); 
			}
		}
	}
	function ProcessRawClassData (d3, json) 
	{

		var class_array = json.classes;
		var data = GenerateAllNodes(class_array);
		GenerateTree(data, json.classes);
		GenerateTreePaths(data);

		InitializePositions(data);

		GenerateBackgroundMesh(data, d3);
		LinkLeafNodes(data);

		CalculateDrawOrder(data);

		data.active_nodes = [];
		for (var i = 0; i < data.nodes.length; i++) {
			if(data.nodes[i].type !== "u") data.active_nodes.push(data.nodes[i]);
		}

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

	function line_gen(leaf, thick){ 
		return d3.svg.line()
		.x(function(d,i) { 
			var ret = 0;
			var shift = 0;
			var sqrt = Math.sqrt(d.terminalLeaves);
			shift =  sqrt*(leaf.curveRandom[i].mx-0.5);
			ret = (leaf.curveRandom[i].x-0.5);

			if(d.type === "e" )
			{
				shift = 0;
				ret = 0;
			}
			else if(d.type === "r")
			{
				shift =0;
				ret = 0;
			}
			else
			{
				shift*=2;
				ret*=thick;
			}
			return (d.x + ret + shift).toFixed(4);
		})
		.y(function(d,i) { 
			var ret = 0;
			var shift = 0;
			var sqrt = Math.sqrt(d.terminalLeaves);
			shift =  sqrt*(leaf.curveRandom[i].my-0.5);
			ret = (leaf.curveRandom[i].y-0.5);

			if(d.type === "e" )
			{
				shift = 0;
				ret = 0;
			}
			else if(d.type === "r")
			{
				shift =0;
				ret = 0;
			}
			else
			{
				shift*=2;
				ret*=thick;
			}
			return (d.y + ret+shift).toFixed(4);
		}).interpolate("basis");
	}

	var force = d3.layout.force()
		// repulsion between nodes is a -ive charge
		.charge(function(node){
			if(node.type ==="i") return -1;
			if(node.type ==="c") return -2;
			if(node.type ==="r") return -(3)*node.terminalLeaves/5;
			if(node.type ==="e") return -(100/((node.parents[0].children.length/3)));
			if(node.type ==="u") return -(3+3*Math.random());
			return -(3)*node.terminalLeaves/5;
		})
		// nodes will attempt to preserve this distance between nodes 
		.linkDistance(function(link){
			if(link.target.type === "c" || link.source.type === "c") return kVineLinkDistance;
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
			return Math.min(2.5/Math.sqrt(link.target.connections), 1.0/link.value);
		})
		// how strongly everything is drawn into the center
		.gravity(0.10)
		.friction(0.90)
		.size([width, height])
		.nodes(data.active_nodes)
		.links(data.links);

	data.width = width;
	data.height = height;
	data.force = force;
	data.kLeaf = kLeaf;
	data.kGrassTuft = kGrassTuft;
	data.kFlower = kFlower;
	data.lineGen = line_gen;
	data.rootGen = root_gen;
	return data;
});
