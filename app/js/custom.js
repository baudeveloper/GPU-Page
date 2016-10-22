$(document).ready(function() {

	$(".partition").slider();
	// Declare Progress Slider for .partition Inputs.

	$(".slider-handle").append("<div class='counter'></div>");
	// Declare a placeholder to show Indicator.

	$("#primary-slider .slider-disabled").append("<span class='off'>GPU Partitions have been individually customized.</span>");
	// Add a placeholder text below Primary Slider.

	// Update Counter value.
	$(".partition").each(function() {
		var temp = $(this).val();
		$(this).siblings(".slider").find(".counter").append(temp);
	});
	$(".partition").on("slide", function(slideEvt) {
		$(this).siblings(".slider").find(".counter").text(slideEvt.value);
	});
	$("#parent-partition, #gpu-partition, #gpu2-partition").on("change", function (e) {
    $(this).siblings(".slider").find(".counter").text(e.value.newValue);
	}); // Source: https://github.com/seiyria/bootstrap-slider/issues/336

});
