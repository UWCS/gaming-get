function toggleVisible(packageName)
{
	$(jq(packageName)+' .info').slideToggle();
	return false;
}

function install(packageName)
{
	var holder = $(jq(packageName)+' .progress');
	var done = $(jq(packageName)+' .progress .barContainer .done');
	var undone = $(jq(packageName)+' .progress .barContainer .undone');
	if(holder.is(':hidden'))
	{
		holder.slideDown('slow');
	}
	$.ajax({
		url: "download/"+packageName,
		type: "get",
		dataType: "html",
		success: function(data){
			done.html(data);
			undone.html(data);
			if(!data.match(/Installed/gi))
			{
				var match = /(\d*)\%/g.exec(data);
				if(match!=null)
				{
					done.css("width", match[1]+'%');
				}
				setTimeout(install(packageName), 200);
			}
			else
			{
				holder.slideUp();
				$(jq(packageName)+' .install').hide();
				$(jq(packageName)+' .launch').show();
			}
		}
	});
	return false;
}

function jq(myid) {
	return '#' + myid.replace(/(:|\.)/g,'\\$1');
}
