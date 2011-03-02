function toggleVisible(packageName)
{
	$(jq(packageName)+' .info').slideToggle();
	return false;
}

function install(packageName)
{
	var content = $(jq(packageName)+' .progress');
	if(content.is(':hidden'))
	{
		content.slideDown('slow');
	}
	$.ajax({
		url: "download/"+packageName,
		type: "get",
		dataType: "html",
		success: function(data){
			content.html(data);
			if(!data.match(/Installed/gi))
			{
				setTimeout(install(packageName), 200);
			}
			else
			{
				content.slideUp();
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
