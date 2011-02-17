var 	sys = require("sys"),
	http = require("http"),
    	url = require("url"),
    	path = require("path"),
    	fs = require("fs");
	
	exec = require( 'child_process' ).exec;

var directory = "/var/tmp/dcs-get";

var serv = http.createServer( function( req, res ) {

	var reqName = url.parse( req.url );

	if ( reqName.pathname == "/favicon.ico" ) {
		return;
	}

	else if ( reqName.pathname == '/' ) {
		console.log( "Home" );
		home( req, res );
	}

	else { 
		var todo = /^\/(.*)\//.exec( reqName.pathname );
		console.log( todo );	

		if ( todo != null ) {		
			switch ( todo[1] ) {
				case 'download':
					console.log( "Downloading" );
					download( req, res );
					break;
				default:
					pageNotFound( req, res );
					break;
			}
		}

		else {
			pageNotFound( req, res );
			return;
		}
	}
});

serv.listen(8080);


function home ( req, res ) {
	res.writeHead( 500, { "Content-Type": "text/plain" } );
	res.write("Welcome to Gaming-Get Homepage\nYou have installed:\n");
	var files = fs.readdirSync( directory );
	var ignore = new Array( "bin", "cleanup", "downloads", "downloaded", "lib");	
	for ( var i in files ) {
		if ( ignore.indexOf( files[i] ) == -1 ) {
			res.write( "\t"+files[i]+"\n" );
		}
	}
	
	res.end();
	return;
	

}

function download( request, response ) {
	var uri = /\/download(.*)/.exec( url.parse( request.url ).pathname )[1];
	var filename = path.join( directory, uri );
	var packagename = /\/(.*)/.exec( uri )[1];
   
	exec( "dcs-get install "+packagename, function ( err, stdout, stderr ) {
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

function pageNotFound ( req, res ) {
	console.log( "Lololol" );
	res.writeHead(500, {'Content-Type': 'text/plain'});
	res.write('<html>Nooo, my internets! ):</html>');
	res.end();
	return;
}
	

sys.puts("Server running at http://localhost:8080/");

