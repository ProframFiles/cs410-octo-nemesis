define(["doom3Data", "d3"], function(raw_data, d3){
	// Private variables and private functions
	const kBranchFactor = 1/0.7;
	const width = 1024,
   height = 1024;


   const kGrassTuft = {
		style : {
			fill : "none",
			"stroke-width" : 0.5,
			"stroke-linecap" : "round",
			"stroke-linejoin" : "miter",
			"stroke-miterlimit" : 40,
			"stroke-opacity" : 1,
			"stroke-dasharray" : "none",
			"marker-start" : "none"
		},
		d : "m 21.063,15.702 c 0,0 4.38204,5.69008 9.17024,19.39083 0.84026,2.40427 1.36993,5.12099 1.68054,7.90177 -1.22648,-1.98607 -4.62718,-6.17857 -6.52825,-7.82906 -8.61895,-7.48288 -18.66367,-6.29394 -18.66367,-6.29394 0,0 9.82249,0.96354 19.59281,11.78801 1.76216,1.95228 3.05448,4.1873 3.99937,6.4717 -0.0436,0.12275 -0.0878,0.24096 -0.12927,0.36357 -2.38321,-3.43135 -4.45189,-6.96944 -10.60033,-9.91356 -6.14843,-2.94412 -12.73359,-3.94504 -18.95453,0.95338 4.55069,-2.00202 10.12542,-2.00238 17.7426,2.07644 7.61719,4.07881 8.5705,9.08748 10.38218,14.26842 -0.3424,5.08389 0.59788,8.8713 0.59788,8.8713 l 8.16608,-0.0514 c 0,0 -0.0619,-2.56934 -0.44206,-5.46693 0.17093,-1.12498 0.33468,-2.38135 0.46053,-3.77314 1.41388,-3.75058 4.13603,-7.79746 8.75012,-11.1982 7.30502,-5.38403 12.28208,-5.54345 17.48407,-4.6538 -0.86498,-0.4767 -3.9204,-2.13602 -8.11992,-1.92293 -3.92136,0.19899 -8.96537,1.48729 -14.2361,6.05964 -1.43904,1.24836 -2.66374,2.57659 -3.7085,3.92664 -0.0425,-0.85681 -0.10124,-1.72629 -0.19391,-2.6016 0.73186,-1.3258 1.13017,-4.51563 7.14229,-9.17025 6.01213,-4.65462 14.70472,-5.65566 14.70472,-5.65566 -8.41969,-0.51495 -14.27494,1.55125 -17.84765,3.84585 -3.5727,2.2946 -4.84952,4.38788 -5.17089,4.6942 -0.42333,-1.51217 -0.95994,-3.00136 -1.62397,-4.44373 -5.55801,-12.07259 -13.65438,-17.63758 -13.65438,-17.63758 z",
		id : "grass"
	};

	const kLeaf = {
		style : {
			fill : "none",
			"stroke-width" : 0.5,
			"stroke-linecap" : "round",
			"stroke-linejoin" : "miter",
			"stroke-miterlimit" : 40,
			"stroke-opacity" : 1,
			"stroke-dasharray" : "none",
			"marker-start" : "none"
		},
		d : "M 7.4474,21.962 C 7.8991,17.887 16.485,14 16.485,14 c 0,0 -7.981,4.328 -7.981,8.436 C 21.239,24.431 28.288,9.606 24.485,2 c 0,8 -18,4 -18,20 0,6 2.0213,8 2.0213,8 0,0 -1.7199,-2.074 -1.0589,-8.038 z",
		id : "leaf"
	};

   function NewNode()
	{
		return {
			active : false,
			depth : 0,
			connections : 0,
			terminalLeaves : 0,
			drawOrder : -1,
			parents : [],
			children : [],
			name : "inner",
			pos : "i",
			curve : [ Math.random(), Math.random(), Math.random(), Math.random()]
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
					drawOrder : -1,
					parents : [],
					children : [],
					name : this_class.qualifiedName,
					pos : "e",
					curve : [ Math.random(), Math.random(), Math.random(), Math.random()]
				};

			node_array[this_class.index] = this_node;
			
			if(this_class.parentArray.length ===0 && this_class.childArray.length > 0)
			{
				root_array.push(this_node);
				this_node.pos = "r"; // "r"oot node 
			}
			else if(this_class.parentArray.length ===0)
			{
				this_node.pos = "u"; // "unconnected" node (no parents or children)
				loose_array.push(this_node);
			}
			else if(this_class.childArray.length > 0)
			{
				this_node.pos = "m"; // "m"iddle node
			}
			else 
			{
				this_node.pos = "e";  // "e"nd node
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
	
	function MakeFlexibleLink(src, dst, strength, data)
	{
		src.connections += 1;
		dst.connections += 1;
		var nn = NewNode();
		nn.depth = src.depth;
		nn.root = dst.root;
		nn.terminalLeaves = dst.terminalLeaves;
		nn.connections = 2;
		data.nodes.push(nn);

		if(strength === undefined)
		{
			strength.french();
		}
		console.log(strength);
		data.links.push({source : src, target : nn, value : 0.1*strength});
		data.links.push({source : nn, target : dst, value : 0.4*strength});
		return nn;
	}
	
	function RandomSelection(array, self)
	{
		var index;
		var ret; 
		while(array.length > 0 && (ret === undefined || ret.connections >= 3))
		{
			index = Math.floor(Math.random()*(array.length-0.0001));
			ret = array[index];
			if(self == ret)
			{
				if(array.length == 1)
				{
					array.pop();
					return null;
				}
				else if(index > 0) --index;
				else ++index;
				ret = array[index];
			}
			array[index] = array.pop();
		}
		return ret;
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
	}

	function GenTreePathsWorker(data, parent, index, current_path)
	{
		var num_leaves = 1;
		var this_path = [];
		var continuing_path = [];
		var depth = parent.depth + 1;
		var first_index = Math.max(0, 0);
		for (var i = first_index; i < current_path.length; ++i) {
			this_path.push(current_path[i]);
			continuing_path.push(current_path[i]);
		}
		var node = parent.children[index];
		node.depth = depth;
		node.root = parent.root;
		var base_node = node;
		
		// if this isn't the leaf, we want to put a branching
		// kink here, which means duplicating spline nodes
		if(node.pos !== "e")
		{
			this_path.push(node);
			continuing_path.push(node);
			this_path.push(node);
			continuing_path.push(node);
		}

		this_path.push(node);
		continuing_path.push(node);


		if(parent != node.parents[0])
		{
			
			data.paths.push(this_path);
			return num_leaves;
		}

		var strength = Math.pow(kBranchFactor, depth);

		while(node.pos != "e"){
			
			MakeFlexibleLink(node.children[0], node, strength, data);
			++depth;
			strength *= kBranchFactor;
			node = node.children[0];
			node.root = parent.root;
			node.depth = depth;
			continuing_path.push(node);
		}
		if(continuing_path.length > this_path.length)
		{
			num_leaves += 1;
			base_node.terminalLeaves += 1;
			data.paths.push(continuing_path);
		}
		data.paths.push(this_path);
		strength = Math.pow(kBranchFactor, depth);
		var pl = this_path.length-1;
		for (i = 1; i < base_node.children.length; i++) 
		{
			
			var new_node = MakeFlexibleLink(base_node.children[i], base_node, strength, data);
			if(i==1 &&continuing_path.length >= pl+1)
			{
				data.links.push(MakeLink(this_path[pl], continuing_path[pl], strength));
			}
			else
			{
				data.links.push(MakeLink(new_node, this_path[pl], strength));
			}
			this_path[pl]= new_node;
			var leaves = GenTreePathsWorker(data, base_node, i, this_path);
			base_node.terminalLeaves += leaves;
			num_leaves += leaves;
		}
		return num_leaves;
	}

	function GenerateTreePaths(data)
	{
		data.paths = [];
		data.links = [];
		var current_path = [];
		for (var root_index = data.roots.length - 1; root_index >= 0; root_index--) {
			var root = data.roots[root_index];
			root.root = root;
			current_path[0] = root;
			root.depth = 0;
			for (var child_index = 0; child_index < root.children.length; child_index++) {
				var nn = MakeFlexibleLink(root.children[child_index], root, 1.0, data, current_path);
				if(child_index > 0)
				{
					data.links.push(MakeLink(current_path[1], nn, 1.0)); 
				} 
				current_path[1] = nn;
				root.terminalLeaves += GenTreePathsWorker(data, root, child_index, current_path);
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
		data.links = data.links.concat(voronoi_links);
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
			if(data.nodes[i].pos !== "u")
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
							5.3));
		}
		data.links.push(MakeLink(data.paths[0][data.paths[0].length-1], 
						data.paths[data.paths.length-1][data.paths[data.paths.length-1].length-1], 
						5.3));
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
			if(data.nodes[i].pos !== "u")
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
			if(data.nodes[i].pos !== "f") data.active_nodes.push(data.nodes[i]);
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
	
	var line_gen = d3.svg.line()
		.x(function(d) { 
			return d.x;
		})
		.y(function(d) { 
			return d.y;
		}).interpolate("bundle").tension(1.1);

	var force = d3.layout.force()
		// repulsion between nodes is a -ive charge
		.charge(function(node){
			if(node.pos ==="i") return -1;
			if(node.pos ==="r") return -(3)*node.terminalLeaves/5;
			if(node.pos ==="e") return -(100/(node.parents[0].children.length/3));
			if(node.pos ==="u") return -(3+3*Math.random());
			return -(3)*node.terminalLeaves/5;
		})
		// nodes will attempt to preserve this distance between nodes 
		.linkDistance(function(link){
			if(link.target.pos === "i" && link.source.pos === "i") return 10;
			if(link.target.pos === "u" || link.source.pos === "u") return link.value;
			return link.value+Math.pow(link.target.depth/2+link.source.connections/2, 1.2)*(link.source.curve[1]);
		})
		// this is the strength with which the distance above is maintained
		// 1.0 == max
		// 0.0 == min
		.linkStrength(function(link){
			if(link.target.pos === "i" && link.source.pos === "i") return 0.8;
			if(link.target.pos === "u" && link.source.pos === "u") return 0.97;
			else if(link.target.pos === "u" || link.source.pos === "u") 
			{
				var terminal = Math.max(link.target.terminalLeaves, link.source.terminalLeaves);
				var s = Math.min(terminal/25, 1.0);
				return Math.pow(s, 1.0);
			}
			return Math.min(2.5/link.target.connections, 1.0/link.value);
		})
		// how strongly everything is drawn into the center
		.gravity(0.08)
		.size([width, height])
		.nodes(data.active_nodes)
		.links(data.links);

	data.width = width;
	data.height = width;
	data.force = force;
	data.kLeaf = kLeaf;
	data.kGrassTuft = kGrassTuft;
	data.lineGen = line_gen;
	return data;
});
