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
	   }).end();
});

$('.message').bind('click', function(e){
	var me = $(this);
	me.remove();
	//me.removeClass().addClass('message');
});

