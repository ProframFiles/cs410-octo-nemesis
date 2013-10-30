// main server node
var http = require('http');
var url = require('url') ;
var path = require("path");
var analyzer = require("analyzer");
var mustache = require("mustache");
var fs = require('fs') ;
var kDir = 
{
    static_files : ["../aleksy_sandbox/", "../website/"],
    home_dir : "./node_server/"
};
var kIsDoingFileUpdate = false;

var kPortToBind = 8088;
//used for c9.io
if (process.env.PORT !== undefined ) kPortToBind = process.env.PORT;

var gReadableStreams = {};
var gIgnoreList = {};
var gCachedFiles = {};
var gQueuedFileUpdates = 0;
var gFilesRead = 0;
var gFilesSkipped = 0;
var gFileRefreshTime = 0;
 
function ProcessQuery(query, value)
{
	switch (query)
	{
		case 'refresh':
			StaticFileCacheRefresh(RepeatedFileRefresh);
			return "Initiated Server file Refresh";
		default:
			return "unrecognized query:";
	}
}

function GetCachedFile(relative_path)
{
    
    if (relative_path == '/') relative_path = "index.html";
    var fullpath = "";
    for(var i=0; i < kDir.static_files.length; ++i)
    {
        fullpath = path.normalize( kDir.home_dir + kDir.static_files[i]+relative_path);
        console.log("looking for full path: " + fullpath);
        if(gCachedFiles[fullpath])
        {
            return gCachedFiles[fullpath];
        }
	}
}

var requestListener = function (req, res) {
	var parsed = url.parse(req.url,true);
	var path = parsed.pathname;
	console.log(parsed.pathname);
	var queries = parsed.query;
	//console.log(req);
    
    var cached_file = GetCachedFile(path);
    
	if(cached_file !== undefined && cached_file.buffered )
	{
		console.log("found!");
		if(queries['interpreter'] !== undefined)
		{
		}

		res.writeHead(200);
		res.write(cached_file.buffer);
		res.end();
		
	}
	else{
		console.log("not found!");
		res.writeHead(404);
		res.write('URL: ' + req.url + '\n');
		for (var i in queries) {
			res.write(ProcessQuery(i, queries[i]) + "\n");
			res.write(i + ' = ' + queries[i] + '\n');
		};
		res.end();
	}
	
}

function RefreshFile(err, relative_path, stat, dir_prefix, doneRefreshCallBack)
{
	if(stat === undefined)
	{
        console.log(err);
        console.log(dir_prefix+relative_path);
        gQueuedFileUpdates--;
        return;
	}
	if(stat.isFile() && !stat.isDirectory())
	{
		var read_file = dir_prefix+relative_path;
		var index = path.normalize( dir_prefix+relative_path);
		console.log("RefreshFile: " + index);
		if(gCachedFiles[index] === undefined || gCachedFiles[index].stat === undefined || gCachedFiles[index].stat.mtime < stat.mtime )
		{
			gCachedFiles[index]  = {};
			gCachedFiles[index].stat = stat;
			gCachedFiles[index].buffer = new Buffer(0);
			gReadableStreams[index] = fs.createReadStream(index);
			gReadableStreams[index].on('data', function(chunk) {
				if(gCachedFiles[index].buffer === undefined){
					gCachedFiles[index].buffered = true;
					gCachedFiles[index].buffer = chunk;
				}
				else gCachedFiles[index].buffer = Buffer.concat([gCachedFiles[index].buffer, chunk]);
				console.log('got %d bytes of data from ' + index, chunk.length);
			});
			gReadableStreams[index].on('end', function() {
				delete gReadableStreams[index];
				gCachedFiles[index].buffered = true;
				gQueuedFileUpdates--;
				gFilesRead++;
				//console.log("stream close, counter = %d ", gQueuedFileUpdates);
				if(gQueuedFileUpdates === 0) doneRefreshCallBack();
			});
		}
		else
		{
			gQueuedFileUpdates--;
			gFilesSkipped++;
			//console.log("skipped update, counter = %d ", gQueuedFileUpdates);
			if(gQueuedFileUpdates === 0) doneRefreshCallBack();
		}

	}
	else if(stat.isDirectory())
	{
		
	
		var read_directory = dir_prefix+relative_path + '/';
		
		fs.readdir(read_directory, function(err, files) {RefreshDirectoryCache(err, files, read_directory, doneRefreshCallBack); });
		//console.log("directory, counter = %d " + read_directory, gQueuedFileUpdates);
	}
	else
	{
		gQueuedFileUpdates--;
		//console.log("else, counter = %d ", gQueuedFileUpdates); 
		//console.log("Unknown file type " + relative_path);
		if(gQueuedFileUpdates === 0) doneRefreshCallBack();
	}

}

function ProcessFile(relative_path, dir_prefix, doneRefreshCallBack)
{
	if(gIgnoreList[relative_path] === undefined)
	{ 
		gQueuedFileUpdates ++;
		//console.log("process, counter = %d ", gQueuedFileUpdates);
		var filename = relative_path;
		var recursed_prefix = dir_prefix;
		console.log("files " + filename + " " + recursed_prefix );
		fs.stat(recursed_prefix +filename, function(err, stat){ RefreshFile(err, filename, stat, recursed_prefix, doneRefreshCallBack);} );
	}
}

function RefreshDirectoryCache(err, files, dir_prefix, doneRefreshCallBack)
{
	//console.log("Refresh directory, counter = %d " + dir_prefix, gQueuedFileUpdates);
	//console.log('callback: ' + callback);
	if(files === undefined) return;
	for (var i = files.length - 1; i >= 0; i--) 
	{
		ProcessFile(files[i], dir_prefix, doneRefreshCallBack);
	};
	gQueuedFileUpdates--;
	console.log("directory, counter = %d " + dir_prefix, gQueuedFileUpdates);
	if(gQueuedFileUpdates === 0)
	{
		console.log('exit at refreshdir');
		doneRefreshCallBack();
	}

}

function ReadDir(home_dir, dir, doneRefreshCallBack)
{
    console.log("reading " + home_dir + dir);
     fs.readdir(home_dir+dir, 
        function(err, files){RefreshDirectoryCache(err, files, home_dir + dir, doneRefreshCallBack); });
}

function StaticFileCacheRefresh(doneRefreshCallBack)
{
	//console.log('callback: ' + callback);
	gFilesRead = 0;
	gFilesSkipped = 0;
	gQueuedFileUpdates++;
	for(var i=0; i < kDir.static_files.length; ++i)
	{
		ReadDir(kDir.home_dir, kDir.static_files[i], doneRefreshCallBack);
	}
}

var server = http.createServer(requestListener);
function BindServer()
{
	console.log("done initial update, now listening on port 80");
	server.listen(kPortToBind);
	RepeatedFileRefresh();


	code_root = "./" + path.normalize( kDir.home_dir + "../code_to_analyze/sample_streaming_json"); 
	code_file = "./" + path.normalize( kDir.home_dir + "../code_to_analyze/sample_streaming_json/aj++.cpp");

	//uncomment to test the analyser plugin
	//var result = analyzer.SingleFile(code_root, code_file);
	console.log(result);

}

function RepeatedFileRefresh()
{
	console.log("read %d files, %d unchanged files skipped", gFilesRead, gFilesSkipped);
	if(gFileRefreshTime > 0)
	{
		console.log("Sheduling next in %d seconds", gFileRefreshTime);
		setTimeout(StaticFileCacheRefresh, gFileRefreshTime, RepeatedFileRefresh);
	}
}

function PopulateIgnoreList(buffer)
{
	console.log(buffer.toString());
	if(buffer !== undefined)
	{
		var strings = buffer.toString().split("\n");
		console.log(strings);
		var p = "";
		for (var i = strings.length - 1; i >= 0; i--) {
			var result = strings[i].match(/\w*#.*/);
			if (result !== undefined) continue;
			p = path.normalize(strings[i]);
			gIgnoreList[p] = true;
			console.log(p);
		};
	}
	console.log("ignoring: \n");

}

function OnBootup()
{
	gQueuedFileUpdates = 0;
	ProcessFile(".nodeignore", kDir.home_dir, function()
		{
            console.log(gCachedFiles);
			PopulateIgnoreList(gCachedFiles[path.normalize(kDir.home_dir+'.nodeignore')].buffer);
			StaticFileCacheRefresh(BindServer);
		});
}


OnBootup();







