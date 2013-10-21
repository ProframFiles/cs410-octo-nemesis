// main server node
var http = require('http');
var url = require('url') ;
var mustache = require("mustache");
var fs = require('fs') ;
var kHomeDir = './';
var kStaticFilesDir = ""; 
var kIsDoingFileUpdate = false;
var gReadableStreams = new Object();
var gIgnoreList = new Object();
var gCachedFiles = new Object();
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
		case 'interpret':

		default:
			return "unrecognized query:";
	}
}
function GetHtmlHeader()
{
	return '<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\" xml:lang=\"en\" lang=\"en\" dir=\"ltr\">\n';
}
function GetHtmlFooter()
{
	return '</html>';
}


function WriteD3CodeThing(res, template, queries,  when_done)
{

	view = 
	{
		title: "D3 tutorial",
		css_files :
		[
			{path: "syntaxhighlighter/styles/shCoreMidnight.css", media: "screen" },
			{path: "syntaxhighlighter/styles/shCore.css", media: "screen" }
		],

		script_files :
		[
			{path: 'misc_scripts.js'},
			{path: 'd3/d3.v3.js'},
			{path: 'syntaxhighlighter/scripts/shCore.js'},
			{path: 'syntaxhighlighter/scripts/shBrushCpp.js'}
		]
	}
	if(queries['source_file'] !== undefined) console.log(queries['source_file']);
	if(queries['source_file'] !== undefined && gCachedFiles['./'+queries['source_file']] !== undefined)
	{
		view.json_data = [];
		var line_strings = gCachedFiles['./'+queries['source_file']].buffer.
				toString().replace(/\\/g, "\u005c\u005c" ).replace(/"/g, '\u005c\u0022').replace(/'/g, '\u005c\u0027').replace(/\t/g, '    ').split('\n');//replace(/</g,"&lt;").replace(/>/g, '&gt;')
		for (var i = line_strings.length - 1; i >= 0; i--) {
			view.json_data.push( {line_string: line_strings[i]} );
		};
	}

	res.write(mustache.to_html(template, view));
	when_done();
}

var requestListener = function (req, res) {
	var parsed = url.parse(req.url,true);
	var path = "." + parsed.pathname;
	console.log("." + parsed.pathname);
	var queries = parsed.query;
	var mu_file = path.replace(/\.html$/, ".mu.html");
	if(gCachedFiles[path] !== undefined && gCachedFiles[path].buffered )
	{
		console.log("found!");
		if(queries['interpreter'] !== undefined)
		{
		}

		res.writeHead(200);
		res.write(gCachedFiles[path].buffer);
		res.end();
		
	}
	else if(gCachedFiles[mu_file] !== undefined && gCachedFiles[mu_file].buffered )
	{
		console.log(mu_file);
		res.writeHead(200);
		WriteD3CodeThing(res, gCachedFiles[mu_file].buffer.toString(), queries, function()
		{res.end();} );
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
	if(stat.isFile() && !stat.isDirectory())
	{
		var read_file = dir_prefix+relative_path;
		var index = dir_prefix+relative_path;
		if(gCachedFiles[index] == undefined || gCachedFiles[index].stat == undefined || gCachedFiles[index].stat.mtime < stat.mtime )
		{
			gCachedFiles[index]  = new Object();
			gCachedFiles[index].stat = stat;
			delete gCachedFiles[index].buffer;
			gReadableStreams[index] = fs.createReadStream(dir_prefix+relative_path);
			gReadableStreams[index].on('data', function(chunk) {
				if(gCachedFiles[index].buffer == undefined){
					gCachedFiles[index].buffered = true;
					gCachedFiles[index].buffer = chunk;
				}
				else gCachedFiles[index].buffer = Buffer.concat([gCachedFiles[index].buffer, chunk]);
				//console.log('got %d bytes of data from ' + dir_prefix+relative_path, chunk.length);
			});
			gReadableStreams[dir_prefix+relative_path].on('end', function() {
				delete gReadableStreams[dir_prefix+relative_path];
				gCachedFiles[index].buffered = true;
				gQueuedFileUpdates--;
				gFilesRead++;
				//console.log("stream close, counter = %d ", gQueuedFileUpdates);
				if(gQueuedFileUpdates == 0) doneRefreshCallBack();
			});
		}
		else
		{
			gQueuedFileUpdates--;
			gFilesSkipped++;
			//console.log("skipped update, counter = %d ", gQueuedFileUpdates);
			if(gQueuedFileUpdates == 0) doneRefreshCallBack();
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
		if(gQueuedFileUpdates == 0) doneRefreshCallBack();
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
			//console.log("files " + filename + " " + recursed_prefix );
		fs.stat(recursed_prefix +filename, function(err, stat){ RefreshFile(err, filename, stat, recursed_prefix, doneRefreshCallBack);} );
	}
}

function RefreshDirectoryCache(err, files, dir_prefix, doneRefreshCallBack)
{
	//console.log("Refresh directory, counter = %d " + dir_prefix, gQueuedFileUpdates);
	//console.log('callback: ' + callback);
	for (var i = files.length - 1; i >= 0; i--) 
	{
		ProcessFile(files[i], dir_prefix, doneRefreshCallBack);
	};
	gQueuedFileUpdates--;
	//console.log("directory, counter = %d " + dir_prefix, gQueuedFileUpdates);
	if(gQueuedFileUpdates == 0)
	{
		console.log('exit at refreshdir');
		doneRefreshCallBack();
	}

}


function StaticFileCacheRefresh(doneRefreshCallBack)
{
	//console.log('callback: ' + callback);
	gFilesRead = 0;
	gFilesSkipped = 0;
	gQueuedFileUpdates++;
	fs.readdir(kHomeDir+kStaticFilesDir, function(err, files) {RefreshDirectoryCache(err, files, kHomeDir +kStaticFilesDir, doneRefreshCallBack); });
}

var server = http.createServer(requestListener);
function BindServer()
{
	console.log("done initial update, now listening on port 80");
	server.listen(8088);
	if (process.getuid && process.setuid) {
		console.log('Current uid: ' + process.getuid());
		try {
			process.setuid('aleksy');
			console.log('New uid: ' + process.getuid());
		}
		catch (err) {
			console.log('Failed to set uid: ' + err);
		}
	}

	RepeatedFileRefresh();
	
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
		for (var i = strings.length - 1; i >= 0; i--) {
			gIgnoreList[strings[i]] = true;
			console.log(strings[i]);
		};
	}
	console.log("ignoring: \n");

}

function OnBootup()
{
	gQueuedFileUpdates = 0;
	ProcessFile(".nodeignore", "./", function()
		{ 
			PopulateIgnoreList(gCachedFiles['./.nodeignore'].buffer);
			StaticFileCacheRefresh(BindServer);
		});
}


OnBootup();







