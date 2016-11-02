$(document).ready(function() {

	$(".partition").slider({
		min: 0,
		max: 16,
		step: 1,
		tooltip: 'hide',
		handle: 'custom'
	});	// Declare Attributes for CHILD .partition Inputs.

	$("#parent-partition").slider('disable');	// Declare Attributes for PARENT .partition Inputs.

	$(".slider-handle").append("<div class='counter'></div>"); // Declare a placeholder to show Indicator.

	$(".switch input").change(function() {
	    if(this.checked) {
	      	$("#parent-partition").slider('enable');
			$(".pane-actions").find("button:first").removeClass("disabled").addClass("btn-orange");
			$("input:not(#parent-partition)").slider('disable');
			$("input:not(#parent-partition)").parent().siblings("button").addClass("disabled").removeClass("btn-orange");
	    }
		else {
			$("#parent-partition").slider('disable');
			$(".pane-actions").find("button:first").removeClass("btn-orange").addClass("disabled");
			$("input:not(#parent-partition)").slider('enable');
			$("input:not(#parent-partition)").parent().siblings("button").removeClass("disabled").addClass("btn-orange");
		}
	});	// Add an Input toggler along with Primary Slider.

	$(".partition").each(function() {
		var temp = $(this).val();
		$(this).siblings(".slider").find(".counter").append(temp);
		$(this).on("change slide", function (e) {
	    $(this).siblings(".slider").find(".counter").text(e.value.newValue);
		}); // Source: https://github.com/seiyria/bootstrap-slider/issues/336
	}); // Update Counter value.

	$('.gpu-node').not(':has(.node-children)').find(".partition-toggle").hide(); // Check if Parent node has no children.

	$(".partition-toggle").on("click", function() {
		$(this).find("i").toggleClass("fa-plus fa-minus");
		$(this).parent().siblings("ul").toggle();
	}); // Partition Toggle.

});
