var 	sys = require("sys"),
		http = require("http"),
		url = require("url"),
		path = require("path"),
		fs = require("fs");

	exec = require( 'child_process' ).exec;

var dcsGetDir = "/var/tmp/dcs-get";

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


function home ( req, res ) {
	res.writeHead( 500, { "Content-Type": "text/plain" } );
	res.write("Welcome to Gaming-Get Homepage\nYou have installed:\n");
	var files = fs.readdirSync( dcsGetDir );
	var ignore = new Array( "bin", "cleanup", "downloads", "downloaded", "lib");
	for ( var i in files ) {
		if ( ignore.indexOf( files[i] ) == -1 ) {
			res.write( "\t"+files[i]+"\n" );
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
		response.writeHead( 500, {"Content-Type": "text/plain"});
		response.write( stdout );
		response.end();
		return;
	});

	}

	else {
		response.writeHead( 500, {"Content-Type": "text/plain"});
                response.write( "Invalid Request." );
                response.end(); 
	}
}

function pageNotFound ( req, res ) {
	res.writeHead(500, {'Content-Type': 'text/plain'});
	res.write("404'd!!!");
	res.end();
	return;
}
	
sys.puts("Server running at http://localhost:8080/");
