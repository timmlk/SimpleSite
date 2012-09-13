$('.fileform').submit(function(form){
	var id = $(form.currentTarget).find('[type="file"]')[0].id;
	var files = getFile(id);
	for (var i = 0; i < files.length; i++) {
	    file = files[i];
		addFileData(form.currentTarget.id, file);
	}
	return true;
});

function getFile(inputId){
	
	if (!window.FileReader) {
        bodyAppend("p", "The file API isn't supported on this browser yet.");
        return;
    }

    input = $('#'+inputId)[0];
    if (!input) {
        alert( "Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
        alert("Please select a file before clicking 'Load'");
    }
    else {
        file = input.files;
       // bodyAppend("p", "File " + file.name + " is " + file.size + " bytes in size");
    }
    return file;

}

function addFileData(formId, file){
	var form = $('#'+formId);
	form.prepend("<input type='hidden' name='filesize["+file.name+"]' value='"+file.size+"'/>");
} 