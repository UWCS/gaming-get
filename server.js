var sys = require("sys"),
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs");

exec = require( 'child_process' ).exec;

var dcsGetDir = "/var/tmp/dcs-get";
var port = 8080;

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
	res.write('<title>UWCS Gaming</title>');
	res.write('<link href="static/main.css" rel="stylesheet" type="text/css" />');
	res.write('<link href="static/favicon.ico" rel="shortcut icon" type="image/vnd.microsoft.icon" />');
	res.write("Welcome to gaming-get Homepage<br/>You have installed:<br/>");
	try
	{
		var files = fs.readdirSync( dcsGetDir );
		var ignore = new Array( "bin", "cleanup", "downloads", "downloaded", "lib");
		for ( var i in files ) {
			if ( ignore.indexOf( files[i] ) == -1 ) {
				res.write( files[i]+"<br/>" );
			}
		}
		res.write("<h2>Available packages:</h2>");
		for ( var i in packageList ) {
			res.write('<div class="package">');
			res.write('<a class="install" href="download/' + packageList[i].name + '" title="' + packageList[i].info + '" >Install</a>' );
			res.write('<span class="title">' + packageList[i].name + '</span>');
			res.write('<span class="info">' + packageList[i].info + '</span>');
			res.write('</div>');
		}
		res.write('Some tester text <a href="foo/bar/">blah</a>');
	}
	catch(err)
	{
		if(err.code == 'ENOENT')
		{
			console.log(err);
			res.write("Error: dcs-get not installed\n");
		}
	}

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
