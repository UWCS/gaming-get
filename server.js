var http = require('http');
var fs = require('fs');
var url = require('url');
var childProcess = require('child_process');
var static = require('./lib/static-resource');
var template = require('./lib/node-template');

var dcsGetDir = "/var/tmp/dcs-get";
var dcsGetURL = url.parse("http://backus.uwcs.co.uk:80/dcs-get/");
var port = 9010;
var staticHandler = static.createHandler(fs.realpathSync('./static'));
var packageList = '';

updatePackages(function(){
		server.listen(port);
		console.log('Server running at http://localhost:' + port + '/');
});


var server = http.createServer(function(request, response){
	var path = url.parse(request.url).pathname;
	var topPath = /^\/?([^\/]*)\/?([^\/]*)/.exec(path);
	var tailPath = topPath?topPath[2]:'';
	topPath = topPath?topPath[1]:'';
	switch(topPath)
	{
		case '':
			response.writeHead(200,{'Content-Type': 'text/HTML'});
			/* begin fugly sorting of packages */
			var packageNames = new Array();
			for(var name in packageList){
				packageNames.push(name);
			}
			packageNames.sort();
			var sortedPackages = {};
			for(var name in packageNames){
				sortedPackages[packageNames[name]] = packageList[packageNames[name]];
			}!
			/* end fugly sorting of packages */
			response.write(template.create("./template/index.tmpl",{
				packages: sortedPackages,
			}));
			response.end();
			break;
		case 'static':
			if(!staticHandler.handle('/'+tailPath, request, response)){
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
		case 'update':
			update(request, response);
			break;
		case 'ssh':
			ssh(request, response);
			break;
		case 'fixres':
			fixres(request, response);
			break;
		case 'volume':
			volume(request, response);
			break;
		case 'mouse':
			mouse(request, response);
			break;
		case 'chrome':
			chrome(request, response);
			break;
		case 'mousesens':
			mousesens(request,response);
			break;
		default:
			response.writeHead(404);
			console.log("404 looking for " + path);
			response.write('404');
			response.end();
			break;
	}
});

function download(packageName, request, response){
	if(packageName in packageList)
	{
		switch(packageList[packageName].installed)
		{
			//not installed
			case 0:
				console.log("Installing " + packageName);
				packageList[packageName].installed = 2;
				packageList[packageName].installer = childProcess.spawn(dcsGetDir+'/bin/dcs-get', ['install', packageName], {encoding: 'utf8'});
				packageList[packageName].installer.stdout.setEncoding('utf8');
				packageList[packageName].installer.on('exit', function(code){
					packageList[packageName].installed = 1;
					console.log('Exited with code: ' + code);
				});
				packageList[packageName].installer.stdout.on('data', function(data){
					percentage = / (\d*)\% /.exec(data);
					percentage = percentage?percentage[percentage.length-1]:0;
					packageList[packageName].installProgress = percentage;
				});
				response.writeHead(200, {"Content-Type": "text/HTML"});
				response.write("Installing...\n");
				response.end();
				break;
			//installed!
			case 1:
				response.writeHead(200, {"Content-Type": "text/HTML"});
				response.write("Installed\n");
				response.end();
				break;
			//currently installing
			case 2:
				response.writeHead(200, {"Content-Type": "text/HTML"});!
				response.write("Currently installing: " + packageList[packageName].installProgress + "%\n");
				response.end();
				break;
		}
	}
	else
	{
		response.writeHead(200, {"Content-Type": "text/HTML"});
		response.write("Invalid Package: "+packageName+"\n");
		response.end();
	}
	return;
}

function launch(packageName, request, response){
	if(packageName in packageList)
	{
		switch(packageList[packageName].installed)
		{
			//not installed
			case 0:
				response.writeHead(200, {'Content-Type': 'text/HTML'});
				response.write('Package not installed: ' + packageName + '\n');
				response.end();
				break;
			//installed
			case 1:
				response.writeHead(200, {"Content-Type": "text/HTML"});
				response.write("Launching...\n");
				response.end();
				console.log("Launching " + dcsGetDir + "/bin/" + packageName);!
				childProcess.exec(dcsGetDir+"/bin/"+packageName, function(err, stdout, stderr){
					if (err) {
						console.log(err);
					}
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
				});
				break;
			//currently installing
			case 2:
				response.writeHead(200, {"Content-Type": "text/HTML"});
				response.write("Currently installing: " + packageList[packageName].installProgress + "%\n");
				response.end();
				break;
		}
	}
	else
	{
		response.writeHead(200, {"Content-Type": "text/HTML"});!
		response.write("Invalid Package: "+packageName+"\n");
		response.end();
	}
	return;
}

function update(request, response){
	childProcess.exec(dcsGetDir+'/bin/dcs-get update', function(err, stdout, stderr){
		if (err) {
			console.log(err);
		}
		response.writeHead(200, {"Content-Type": "text/HTML"});
		response.write("Updated.");
		updatePackages();
		response.end();
	});
	return;
}

function updatePackages(callback){
	console.log('Updating package list');
	packageList = '';
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
			fs.readdir(dcsGetDir, function(err, files){
				for(packageName in packageList)
				{
					for(packageVersion in packageList[packageName].version)
					{
						if(files && files.indexOf(packageName+"-"+packageList[packageName].version[packageVersion]) != -1)
						{
							packageList[packageName].installed = 1;
							break;
						}
						else
						{
							packageList[packageName].installed = 0;
						}
					}
				}
			});
			if (typeof callback !== 'undefined')
			{
				callback();
			}
		});
	});
	return;
}

function fixres(request, response){!
	console.log("Fixing resolution");
	childProcess.exec('xrandr -s 0', function(err, stdout, stderr){
		if (err) {
			console.log(err);
		}
		response.writeHead(200, {"Content-Type": "text/HTML"});
		response.write("Fixed.\n");
		response.end();
	});
	return;
}

function ssh(request, response){
	console.log("Launching ssh");
	var sshProc = childProcess.spawn(dcsGetDir+'/gaming-get-0.3/ssh', [], {encoding: 'utf8'});
	sshProc.stdout.setEncoding('utf8');
	sshProc.on('exit', function(code){
		console.log('Exited with code: ' + code);
	});
	return;
}

function volume(request, response){
	console.log("Launching gnome-volume-control");
	var volumeProc = childProcess.spawn('gnome-volume-control', ['--page=applications'], {env: {DISPLAY: ':0.0'}, encoding: 'utf8'});
	volumeProc.stdout.setEncoding('utf8');
	volumeProc.on('exit', function(code){
		console.log('Exited with code: ' + code);
	});
	return;
}

function mouse(request, response){
	console.log("Launching gnome-mouse-properties");
	var volumeProc = childProcess.spawn('gnome-mouse-properties', [], {env: {DISPLAY: ':0.0'}, encoding: 'utf8'});
	volumeProc.stdout.setEncoding('utf8');
	volumeProc.on('exit', function(code){
		console.log('Exited with code: ' + code);
	});
	return;
}

function mousesens(request,response){
	console.log("Launching mouse-sensitivity");
	childProcess.exec('xterm -e ./mouse-sens',function(err,stdout,stderr){
		if(err) {
			console.log(err);
		}
		response.end();
	});
	return;
}

function chrome(request, response){
	console.log("Launching new Chrome window");
	var chromeProc = childProcess.spawn('google-chrome', ['--incognito'], {env: {DISPLAY: ':0.0'},encoding: 'utf8'});
	chromeProc.stdout.setEncoding('utf8');
	chromeProc.on('exit', function(code){
		console.log('Exited with code: ' + code);
	});
	chromeProc.stdout.on('data', function(data){
		console.log('stdout: ' + data);
	});
	chromeProc.stderr.on('data', function(data){
		console.log('stderr: ' + data);
	});
	return;
}
