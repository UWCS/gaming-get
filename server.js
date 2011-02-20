var sys = require("sys"),
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs");

exec = require( 'child_process' ).exec;

var dcsGetDir = "/var/tmp/dcs-get";
var port = 9010;

var serv = http.createServer(function( req, res ){
	var reqURL = url.parse( req.url );
	var request = /^\/?([^\/]*)\/?([^\/]*)/.exec(reqURL.pathname);
	console.log(request[1] + ", " + request[2]);
	switch(request[1])
	{
		case '':
			home(req, res);
			break;
		case 'static':
			res.writeHead(200);
			serveStatic(req, res, request[2]);
			res.end();
			break;
		case 'download':
			download(req, res, request[2]);
			break;
		default:
			pageNotFound( req, res );
			break;
	}
	return;
});

serv.listen(port);
console.log("Server running at http://localhost:"+port+"/");

exec("dcs-get list", function(err, stdout, stderr){
	if ( err ) {
		console.log( "Unable to list packages" );
	}
	else
	{
		packageList = stdout.split("\n");
		
		for ( var i in packageList ) {
			var temp = /(.*)\ -(.*)-/.exec( packageList[i] );
			if ( temp ) {
				var data = {};
				data.name = temp[1];
				data.info = temp[2];
				packageList[i] = data;
			}
		}
	}
});

exec( "dcs-get list", function( err, stdout, stderr ) {
	if ( err ) {
		console.log( "Unable to list packages" );
	}
	packageList = stdout.split("\n");
	
	for ( var i in packageList ) {
		var temp = /(.*)\ -(.*)-/.exec(packageList[i].trim());
		if (temp) {
			var data = {};
			data.name = temp[1];
			data.info = temp[2];
			packageList[i] = data;
		}
	}
});


function home(req, res){
	res.writeHead( 500, {"Content-Type": "text/HTML"});
	serveStatic( req, res, "header.html" );
		res.write("<div id=\"page\">\n<div id=\"sidebar\">\n<ul><li>");
	res.write("<h2>Installed</h2><ul></ul></li>");
	try
	{
		var files = fs.readdirSync( dcsGetDir );
		var ignore = new Array( "bin", "cleanup", "downloads", "downloaded", "lib", "home");
		for ( var i in files ) {
			if ( ignore.indexOf( files[i] ) == -1 ) {
				res.write( "<li>"+files[i]+"</li>" );
			}
		}

		res.write("</ul></div><div id=\"content\">");
		res.write("<h1>Welcome to gaming-get</h1>");
		res.write("</p><h2>Available packages:</h2>\n");
		for ( var i in packageList ) {
			res.write('<div class="package">\n');
			res.write('<a class="install" href="download/' + packageList[i].name + '" title="' + packageList[i].info + '" >Install</a>\n' );
			res.write('<span class="title">' + packageList[i].name + '</span>\n');
			res.write('<span class="info">' + packageList[i].info + '</span>\n');
			res.write('</div>\n');
		}
	}
	catch(err)
	{
		if(err.code == 'ENOENT')
		{
			console.log(err);
			res.write("Error: dcs-get not installed\n");
		}
	}

	serveStatic( req, res, "footer.html" );
	res.end();
	return;

}

function download( request, response, packageName ) {
	if ( packageName != null ) {
	 
		exec( "dcs-get install "+packageName, function ( err, stdout, stderr ) {
			if ( err ) {
				response.write( "Unable to install\n" );
				console.log( err );
				response.end();
				return;
			}
			response.writeHead( 500, {"Content-Type": "text/HTML"});
			response.write( stdout );
			response.end();
			return;
		});

	}

	else {
		response.writeHead( 500, {"Content-Type": "text/HTML"});
                response.write( "Invalid Request." );
                response.end(); 
	}
}

function pageNotFound ( req, res ) {
	console.log("404 trying to get: "+req.url);
	res.writeHead(500, {'Content-Type': 'text/HTML'});
	res.write("404'd!!!");
	res.end();
	return;
}

function serveStatic(req, res, filePath) {
	try
	{
		res.write(fs.readFileSync("./static/"+filePath));
	}
	catch(err)
	{
		if(err.code == 'EBADF')
		{
			pageNotFound(req, res);
			console.log(err);
		}
		else
		{
			console.log(err);
			res.write("ERROR: " + err.code);
		}
	}
	return;
}
