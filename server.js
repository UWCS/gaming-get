var http = require('http');
var fs = require('fs');
var url = require('url');
var childProcess = require('child_process');
var static = require('./lib/static-resource');
var template = require('./lib/node-template');

var dcsGetDir = "/var/tmp/dcs-get";
var dcsGetURL = url.parse("http://backus.uwcs.co.uk:80/dcs-get/");
var port = 9010;
var packageList = '';
http.get({
	host: dcsGetURL.hostname,
	port: dcsGetURL.port,
	path: dcsGetURL.pathname+"/packages.json"
}, function(response){
	response.setEncoding('utf8');
	response.on('data',function(data){
		packageList += data;
	});
	response.on('end', function(){
		packageList = JSON.parse(packageList);
		server.listen(port);
		console.log("Server running at http://localhost:"+port+"/");
	});
});

var installedList = new Object();
fs.readdir(dcsGetDir, function(err, files){
	var ignored = Array("bin", "cleanup", "downloads", "downloaded", "lib");
	for(var i in files)
	{
		if(ignored.indexOf(files[i])==-1)
		{
			var name = /^(.*)-[\d\.]*$/.exec(files[i]);
			if(name)
			{
				installedList[name[1]] = true;
			}
		}
	}
});


var staticHandler = static.createHandler(fs.realpathSync('./static'));

var server = http.createServer(function(request, response){
	var path = url.parse(request.url).pathname;
	var topPath = /^\/?([^\/]*)(\/?[^\/]*)/.exec(path);
	var tailPath = topPath?topPath[2]:'';
	topPath = topPath?topPath[1]:'';
	switch(topPath)
	{
		case '':
			response.writeHead(200,{"Content-Type": "text/HTML"});
			response.write(template.create("./template/index.tmpl",{
				packages: packageList,
				installed: installedList
			}));
			response.end();
			break;
		case 'static':
			if(!staticHandler.handle(tailPath, request, response)){
				response.writeHead(404);
				response.write('404');
				response.end();
			}
			break;
		case 'download':
			download(tailPath, request, response);
			break;
		case 'launch':
			launch(tailPath, request, response);
			break;
		default:
			response.writeHead(404);
			response.write('404');
			response.end();
			break;
	}
});

function download(packageName, request, response){
	console.log(packageName);
	if (packageName != null) {
		packageName = /^\/([\w-]*)$/.exec(packageName);
		if(packageName)
		{
			childProcess.exec(dcsGetDir+"/bin/dcs-get install "+packageName[1], function(err, stdout, stderr){
				if (err) {
					response.write("Unable to install\n");
					console.log(err);
					response.end();
					return;
				}
				/*stdout.pipe(process.stdout);
				stdout.on('data', function(data){
					//console.log(data);
					//response.write(data);
				});
				stdout.on('end', function(){
					response.end();
				});*/
			});
			response.write("Installed");
			response.end();
			installedList[packageName[1]] = true;
			return;
		}
	}
	response.writeHead(200,{"Content-Type": "text/HTML"});
	response.write( "Unable to install\n" );
	response.end();
	return;
}

function launch(packageName, request, response){
	if ( packageName != null ) {
		packageName = /^\/([\w-]*)$/.exec(packageName);
		if(packageName)
		{
			childProcess.exec(dcsGetDir+"/bin/"+packageName[1], function(err, stdout, stderr){
				if (err) {
					response.write("Unable to launch\n");
					console.log(err);
					response.end();
					return;
				}
			});
			response.write("Launched");
			response.end();
			return;
		}
	}
	response.writeHead(200,{"Content-Type": "text/HTML"});
	response.write( "Unable to launch\n" );
	response.end();
	return;
}
