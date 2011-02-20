var 	sys = require("sys"),
		http = require("http"),
		url = require("url"),
		path = require("path"),
		fs = require("fs");

	exec = require( 'child_process' ).exec;

var dcsGetDir = "/var/tmp/dcs-get";
var packageList;

var serv = http.createServer( function( req, res ) {

	var reqURL = url.parse( req.url );
	var request = /^\/?([^\/]*)\/?([^\/]*)/.exec(reqURL.pathname);
	console.log(request[1] + ", " + request[2]);
	switch(request[1])
	{
		case 'favicon.ico':
			break;
		case '':
			home(req, res);
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

serv.listen(8080);

exec( "dcs-get list", function( err, stdout, stderr ) {
	if ( err ) {
		console.log( "Unable to list packages" );
	}
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
});


function home ( req, res ) {
	res.writeHead( 500, { "Content-Type": "text/HTML" } );
	res.write("Welcome to Gaming-Get Homepage<br/>You have installed:<br/>");
	try
	{
		var files = fs.readdirSync( dcsGetDir );
		var ignore = new Array( "bin", "cleanup", "downloads", "downloaded", "lib");
		for ( var i in files ) {
			if ( ignore.indexOf( files[i] ) == -1 ) {
				res.write( files[i]+"<br/>" );
			}
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

	res.write("<br/>Available packages<br/>");
	for ( var i in packageList ) {
		res.write( "<a href=\"http://localhost:8080/download/" + packageList[i].name + "/\" TITLE=\""+ packageList[i].info +"\" \">" + packageList[i].name + "</a><br/>" );
	}

	//Link on homepage that links to localhost:8080/download/<PACKAGE> with link name <PACKAGE>

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
	res.writeHead(500, {'Content-Type': 'text/HTML'});
	res.write("404'd!!!");
	res.end();
	return;
}
	
sys.puts("Server running at http://localhost:8080/");
