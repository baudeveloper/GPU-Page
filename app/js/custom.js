$(document).ready(function() {
	$(".partition").slider();
	$(".slider-handle").append("<div class='counter'></div>");
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
