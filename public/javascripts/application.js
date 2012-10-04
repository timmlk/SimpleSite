$('.destroy').live('click', function(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to delete that item?')) {
    var element = $(this),
        form = $('<form></form>');
    form
      .attr({
        method: 'POST',
        action: element.attr('href')
      })
      .hide()
      .append('<input type="hidden" />')
      .find('input')
      .attr({
        'name': '_method',
        'value': 'delete'
      })
      .end()
      .submit();
  }
});

$('#logout').bind('click', function(){
	var form = $('<form></form>');
	 form
	   .attr({
	     method: 'POST',
	     action: '/sessions'
	   })
	   .hide()
	   .append('<input type="hidden" />')
	   .find('input')
	   .attr({
	     'name': '_method',
	     'value': 'delete'
	   }).end()
	   .submit();
});

$('.message').bind('click', function(e){
	var me = $(this);
	me.remove();
	//me.removeClass().addClass('message');
});

function fileSelected() {
  var file = document.getElementById('fileinput').files[0];
  if (file) {
    var fileSize = 0;
    if (file.size > 1024 * 1024)
      fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
    else
      fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

    document.getElementById('fileName').innerHTML = 'Name: ' + file.name;
    document.getElementById('fileSize').innerHTML = 'Size: ' + fileSize;
    document.getElementById('fileType').innerHTML = 'Type: ' + file.type;
  }
}

function uploadFile() {
  var fd = new FormData();
  fd.append("fileinput", document.getElementById('fileinput').files[0]);
  var xhr = new XMLHttpRequest();
  xhr.upload.addEventListener("progress", uploadProgress, false);
  xhr.addEventListener("load", uploadComplete, false);
  xhr.addEventListener("error", uploadFailed, false);
  xhr.addEventListener("abort", uploadCanceled, false);
  xhr.open("POST","http://patsia.s3.amazonaws.com");
  xhr.send(fd);
}

function uploadProgress(evt) {
  if (evt.lengthComputable) {
    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    document.getElementById('progressNumber').innerHTML = percentComplete.toString() + '%';
  }
  else {
    document.getElementById('progressNumber').innerHTML = 'unable to compute';
  }
}

function uploadComplete(evt) {
  /* This event is raised when the server send back a response */
  alert(evt.target.responseText);
}

function uploadFailed(evt) {
  alert("There was an error attempting to upload the file.");
}

function uploadCanceled(evt) {
  alert("The upload has been canceled by the user or the browser dropped the connection.");
}

$('#uploadBtn').click(function(){
    var formData = new FormData($('form')[0]);
    $.ajax({
        url: 'http://patsia.s3.amazonaws.com',  //server script to process data
        type: 'POST',
        xhr: function() {  // custom xhr
            myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){ // check if upload property exists
                myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // for handling the progress of the upload
            }
            return myXhr;
        },
        //Ajax events
    //    beforeSend: beforeSendHandler,
     //   success: completeHandler,
     //   error: errorHandler,
        // Form data
        data: formData,
        //Options to tell JQuery not to process data or worry about content-type
        cache: false,
        contentType: false,
        processData: false
    });
});
function progressHandlingFunction(e){
    if(e.lengthComputable){
        $('progress').attr({value:e.loaded,max:e.total});
    }
}

//$(":input:not(:button)").each(function () {
//    this.oninvalid = validationFail;
 //   this.onblur = validate;
 //   
//});
