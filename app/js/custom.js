//This file includes custom-css related code and actions for things like sliders.

//Initiating Datatables for VM tab
$(document).ready(function() {
    $('#vm-listing table').DataTable({
        paging: false,
        searching: false,
        // order: [[ 1, "asc" ]],
        ordering: false,
        info: false,
        scrollY: 407, //gives you 12 rows
        scrollCollapse: true
    });
    $('.toggleBtn label').click(function () {
        var checked = $('input', this).is(':checked');
        $('span', this).text(checked ? 'Power Off' : 'Power On');
        $(this).closest('tr').toggleClass('on', 'off');
    });

} );

var refreshVMList = function () {
    $('.selectpicker').selectpicker('refresh');

    //this is shared between all of the select pickers. Works because only one can be open at once.
    var previousIndex;
    $(".selectpicker").on("shown.bs.select", function (e) {
        previousIndex = parseInt($(this).val());
    });

    $(".selectpicker").on("change", function (e) {
        var newIndex = parseInt($(this).val());
        var id = this.parentElement.parentElement.parentElement.id;
        var vmIndex = id.substring(id.search(/\d/), id.length);
        vmIndex = parseInt(vmIndex);

        //console.log("changed! this is vmIndex: " + vmIndex + "; this is previous GPU index: " +
          //      previousIndex + "; new GPU index: " + newIndex);
        var found = false;
        for (var i = 0; i < VM_CHANGES.length; i++) {
            if (VM_CHANGES[i].vmIndex === vmIndex) {
                VM_CHANGES[i].newGPUIndex = newIndex;
                found = true;
                if (VM_CHANGES[i].newGPUIndex === VM_CHANGES[i].previousGPUIndex) {
                    VM_CHANGES.splice(i, 1);
                }
                break;
            }
        }

        if (!found) {
            VM_CHANGES.push({ "vmIndex": vmIndex, "previousGPUIndex": previousIndex, "newGPUIndex": newIndex });
        }
        if (VM_CHANGES.length > 0) {
            enableApply();
        } else {
            $("#btn-vm-apply").addClass("disabled");
        }
    });
};




var enableRestore = function () {
    $("#btn-gpu-restore").removeClass("disabled").addClass("btn-orange");
};

function enableApply() {
    $("#btn-vm-apply").removeClass("disabled");
};

// Generate the BDF for a VF given its GPU ID and index position within the GPU's list of VFs
var generateBDFForVF = function (gpuId, index) {
	var bdfRoot = gpuId.substring(0, gpuId.lastIndexOf(":") + 1);
	var bdfSuffix;
	
	if (index > 0 && index < 8) {
		bdfSuffix = "02." + index;
	} else if (index >= 8 && index < 16) {
		bdfSuffix = "03." + (index - 8);
	} else {
		console.log("generateBDFForVF() - Cannot generate BDF for unexpected mxGPU index " + index);
	}
	
	return bdfRoot + bdfSuffix;
};

//Dynamically add VFs and corresponding DOM elements
var addVFs = function (gpuId, id, index, list, originalValue, newValue) {
    var counter = 1;

    //create the new JSON data
    for (i = 0; i < newValue - originalValue; i++) {
        list[originalValue + i] = {
            "vfName": list[0].vfName, // Assumption: there's always at least 1 VF in the list
            "vfId": generateBDFForVF(gpuId, originalValue + i),
            "vfStatus": STATUS_MAPPING[0].vfStatus,
            "vm": null,
        }
    }

    var domElements = getPartitionListElements(list.slice(originalValue, list.length));

    $("#gpu" + index + " > ul").append(domElements);
    enableRestore();
};

//Dynamically remove VFs from both the GPU_DATA object and the corresponding DOM elements
//Note that this will set all VFs in the given GPU to "UNASSIGNED"
var removeVFs = function (index, list, newValue) {
    list = list.slice(0, newValue);
    for (var i = 0; i < list.length; i++) {
        list[i].vfStatus = STATUS_MAPPING[0].vfStatus;
        //not clearing the vm here... not necessary
    }
    
    GPU_DATA.gpuList[index].vfList = list;
    var domElements = getPartitionListElements(list);
    $("#gpu" + index + " > ul").html(domElements);
    enableRestore();
};

var refreshSliders = function () {

	$(".partition").slider({
		min: 1,
		step: 1,
		tooltip: 'hide',
		handle: 'custom'
	});	// Declare Attributes for CHILD .partition Inputs.

    $(".slider-handle").find(".counter").remove(); // Get rid of any possible previous placeholder.
    $(".slider-handle").append("<div class='counter'></div>"); // Declare a placeholder to show Indicator.

    $(".partition").each(function () {
        var temp = $(this).val();
        $(this).siblings(".slider").find(".counter").append(temp);

        $(this).on("change", function (e) {
            var id = this.id;
            if (id !== "parent-partition") {
                var index = id.substring(id.search(/\d/), id.length);
                index = parseInt(index);
                //console.log("changed! old value: " + e.value.oldValue + "; newValue: " + e.value.newValue);
                var list = GPU_DATA.gpuList[index].vfList;
                if (e.value.newValue > e.value.oldValue) {
                    addVFs(GPU_DATA.gpuList[index].gpuId, id, index, list, e.value.oldValue, e.value.newValue);
                    GPU_DATA.gpuList[index].modified = true;
                    $("#gpu" + index + " > div > button").removeClass("disabled").addClass("btn-orange");
                }
                if (e.value.newValue < e.value.oldValue) {
                    removeVFs(index, list, e.value.newValue);
                    GPU_DATA.gpuList[index].modified = true;
                    $("#gpu" + index + " > div > button").removeClass("disabled").addClass("btn-orange");
                }
            } else {
                enableRestore();
            }
            $(this).siblings(".slider").find(".counter").text(e.value.newValue);
            // Source: https://github.com/seiyria/bootstrap-slider/issues/336*
        });
    });
};


var refreshGPUList = function () {
    refreshSliders();

    $('.gpu-node').not(':has(.node-children)').find(".partition-toggle").hide(); // Check if Parent node has no children.

    $(".partition-toggle").on("click", function () {
        $(this).find("i").toggleClass("fa-plus fa-minus");
        $(this).parent().siblings("ul").toggle();
    }); // Partition Toggle.

    //Set up the individual GPU Apply buttons
    for (var i = 0; i < GPU_DATA.gpuList.length; i++) {
        $("#gpu" + i + " > div > button").on("click", function () {
            if (this.className.indexOf("disabled") < 0) {
                var id = this.parentElement.parentElement.id;
                var index = id.substring(id.search(/\d/), id.length);
                index = parseInt(index);
                
                if (GPU_DATA.gpuList[index].hasVfInUse) {
                    showAlert("Cannot modify number of partitions",
                        "The number of partitions cannot be modified when an mxGPU is in use." +
                        "<br/>Please ensure that users are logged off before modifying partitions.");

                	// Restore VF data
                	var restoredVfData = $.extend(true, [], GPU_DATA_RESTORE.gpuList[index].vfList);
                	GPU_DATA.gpuList[index].vfList = restoredVfData;
                	var originalSliderValue = restoredVfData.length;
                	
                	// Recreate the VF UI elements
                	var domElements = getPartitionListElements(GPU_DATA.gpuList[index].vfList);
                    $("#gpu" + index + " > ul").html(domElements);

            	    // Restore the slider position and value
                    var slider = $("#gpu-partition" + index);
                    slider.slider("setValue", restoredVfData.length);
                    var sliderCounter = slider.siblings(".slider").find(".counter");
                    sliderCounter.html(restoredVfData.length);
                	
                	// Disable the Apply button
                	$("#gpu" + index + " > div > button").addClass("disabled").removeClass("btn-orange");
                } else {
                    
                    var totalVFs = GPU_DATA_RESTORE.gpuList[index].vfList.length;
                    var unassignedVFs = GPU_DATA_RESTORE.gpuList[index].unassignedVfCount;
                    var assignedVFs = totalVFs - unassignedVFs;
                    if (GPU_DATA.gpuList[index].vfList.length < assignedVFs) {
                    	showConfirm("Warning",
                    	    "Reducing the number of partitions will unassign the removed mxGPUs from their VMs. Continue?",
                    	    function() {
                        	    updateMxGPU(GPU_DATA.hostId,
                        	        GPU_DATA.gpuList[index].gpuId,
                        	        GPU_DATA.gpuList[index].vfList.length,
                        	        function () {
                        	            GPU_DATA.gpuList[index].modified = false;
                        	            loadData(index);
                        	            $("#gpu" + index + " > div > button").addClass("disabled").removeClass("btn-orange");
                        	        });
                        	});
                    } else {
    	                updateMxGPU(GPU_DATA.hostId, GPU_DATA.gpuList[index].gpuId, GPU_DATA.gpuList[index].vfList.length,
    	                        function () {
    	                    GPU_DATA.gpuList[index].modified = false;
    	                    loadData(index);
    	                    $("#gpu" + index + " > div > button").addClass("disabled").removeClass("btn-orange");
    	                });
                    }
                }
            };
        });
    } // for-loop
};


function displayAccumulatedErrors(errors) {
    for (i = 0; i < errors.length; i++) {
        if (errors[i].jsonMap) {
            reportError(errors[i].title, errors[i].message, null, errors[i].jsonMap, true)
        } else {
            reportException(errors[i].title, errors[i].message, null, null, null, true);
        }
    }
};



//Note: not enough VFs is not considered an "error" for auto assign, but it is for Apply (because
//in this case the user has double-booked a GPU, and there's currently no frontend indication
//of it when they do that).
function processAssignResponse(notEnoughVFErrors, unassignErrors, assignErrors, numAssignments, autoAssign) {
    $("#btn-vm-apply").addClass("disabled");
    var notEnoughVFs;

    var allErrors = unassignErrors.concat(assignErrors);
    if (!autoAssign) {
        allErrors = notEnoughVFErrors.concat(allErrors);
        notEnoughVFs = notEnoughVFErrors.length;
    } else {
        notEnoughVFs = notEnoughVFErrors.numNotAssigned;
    }
    if (allErrors.length === 0) {
        if (autoAssign) {
            var msg = numAssignments + " mxGPUs have been assigned to " + numAssignments +
                " VMs. ";
            if (notEnoughVFs > 0) {
                msg = msg + notEnoughVFs + " VMs not assigned because there were not enough mxGPUs available.";
            }
            showAlert("Assignments Successful!", msg);
        } else {
            if (numAssignments > 1) {
                showAlert("Assignments Successful!",
                    numAssignments + " VMs assigned to " + numAssignments + " mxGPUs.");
            } else {
                //AMD didn't ask for any confirmation in this case - so we do nothing for now.
                //this case includes when there is only one assignment, and only unassignments
            }
        }
    } else {
        var numSuccess = numAssignments - assignErrors.length;
        var errorMessage = "";
        if (numSuccess > 0) {
            errorMessage = numSuccess + " VMs assigned to " + numSuccess + " mxGPUs. ";
        }
        if (notEnoughVFs > 0) {
            errorMessage = errorMessage + notEnoughVFs + " VMs not assigned because there were not enough mxGPUs available. ";
        }
        if (assignErrors.length > 0) {
            errorMessage = errorMessage + (numAssignments - numSuccess) + " VMs were not assigned because of server errors.";
        }

        reportError("Partial success", errorMessage, null, {}, true)
        displayAccumulatedErrors(allErrors);
    }

    hideProgressBar();
    loadData();
};



$(document).ready(function () {

    refreshSliders();
    resetProgressBar();
    hideProgressBar();


    function resetButtons(setMasterSlider) {
        if (setMasterSlider) {
            $("#parent-partition").slider("setValue", GPU_DATA_RESTORE.masterValue);
        }

        if ($(".switch input").prop("checked")) {
            $(".switch input").prop("checked", false);
            $(".switch input").trigger("change");
        }

        if ($("#btn-gpu-restore")[0].className.indexOf("disabled") < 0) {
            $("#btn-gpu-restore").removeClass("btn-orange").addClass("disabled");
        }
    };


    function restore() {
        GPU_DATA = $.extend(true, {}, GPU_DATA_RESTORE);
        resetButtons(true);
        createGPUElements(GPU_DATA);
    };


    //This method handles tab changes
    $("#vm-gpu-tabs a").click(function (e) {
        e.preventDefault();
        var show = false;
        var selected = ($(this)[0].parentElement.className.indexOf("active") >= 0);
        if (!selected) {
            var clickedTab = $(this).is($("#vm-tab")) ? 0 : 1;
            if (clickedTab === 0) {
                if ($("#btn-gpu-restore")[0].className.indexOf("disabled") >= 0) {
                    resetButtons();
                    show = true;
                } else {
                	showConfirm("Lose changes?",
                		"Are you sure you want to leave this tab? Changes not applied will be lost.",
                		function() {
                			restore();
                			$("#vm-tab").tab("show");
                		});
                }
            } else {
                if (VM_CHANGES.length === 0) {
                    show = true;
                } else {
                	showConfirm("Lose changes?",
                		"Are you sure you want to leave this tab? Changes not applied will be lost.",
                		function () {
	                        VM_CHANGES = [];
	                        createVMElements(VM_DATA, GPU_DATA);
	                        $("#btn-vm-apply").addClass("disabled");
	                        $("#gpu-tab").tab("show");
                    	});
                }
            }
        }

        if (show) {
            $(this).tab("show");
        } else {
            return false;
        }
    });


    $("#parent-partition").slider('disable');	// Declare Attributes for PARENT .partition Inputs.

	$(".switch input").change(function() {
	    if(this.checked) {
	      	$("#parent-partition").slider('enable');
	      	$("#btn-gpu-apply").removeClass("disabled").addClass("btn-orange");
			$("input:not(#parent-partition)").slider('disable');
			$("input:not(#parent-partition)").parent().siblings("button").addClass("disabled").removeClass("btn-orange");
	    }
		else {
			$("#parent-partition").slider('disable');
			$("#btn-gpu-apply").removeClass("btn-orange").addClass("disabled");
			$("input:not(#parent-partition)").slider('enable');
			for (var i = 0; i < GPU_DATA.gpuList.length; i++) {
			    if (GPU_DATA.gpuList[i].modified) {
			        $("#gpu" + i + " > div > button").removeClass("disabled").addClass("btn-orange");
			    }
			}
			
		}
	});	// Add an Input toggler along with Primary Slider.


    //Apply VM changes
    //This method uses VM_CHANGES to get a list of unassignments and assignments
    //then passes the lists to the unassign/assign VF function to run them simultaneously.
    //Unassignments are completed first.
    //If there are no assignments or unassignments, then that operation won't run.
	$("#btn-vm-apply").on("click", function () {
	    if (this.className.indexOf("disabled") < 0) {
	        var gpuData = $.extend(true, {}, GPU_DATA); //clone the current data for changing around
	        var notEnoughVFErrors = [];
	        var unassignments = processUnassignData(VM_CHANGES, gpuData.gpuList);
	        var assignments = processAssignData(VM_CHANGES, gpuData.gpuList, notEnoughVFErrors);
	        resetProgressBar();
	        var percentToAdvance = 1.0 / (unassignments.length + assignments.length) * 100;

	        if (unassignments.length > 0) {
	            unassignAssignVFs(VM_DATA.hostId, unassignments, true, percentToAdvance, function (unassignErrors) {
	                if (assignments.length > 0) {
	                    unassignAssignVFs(VM_DATA.hostId, assignments, false, percentToAdvance, function (assignErrors) {
	                        processAssignResponse(notEnoughVFErrors, unassignErrors, assignErrors,
                                assignments.length, false);
	                    });
	                } else {
	                    processAssignResponse(notEnoughVFErrors, unassignErrors, [], -1, false);
	                }
	            });
	        } else if (assignments.length > 0) {
	            unassignAssignVFs(VM_DATA.hostId, assignments, false, percentToAdvance, function (assignErrors) {
	                processAssignResponse(notEnoughVFErrors, [], assignErrors, assignments.length, false);
	            });
	        } else {
	            $("#btn-vm-apply").addClass("disabled");
	            displayAccumulatedErrors(notEnoughVFErrors);
	        }
	    }
	});


	$("#btn-vm-auto").on("click", function () {
	    if (this.className.indexOf("disabled") < 0) {
	        showConfirm("Confirm Auto Assign",
	        	"Are you sure you want to automatically assign VMs to any mxGPUs that are unassigned?",
	        	function () {
		            var gpuData = $.extend(true, {}, GPU_DATA);
		            var notEnoughVFErrors = { numNotAssigned: 0 };
		            var assignments = autoAssign(VM_DATA.vmList, gpuData.gpuList, notEnoughVFErrors);
		            var percentToAdvance = 1.0 / assignments.length * 100;
		            resetProgressBar();
	
	                if (assignments.length > 0) {
		                unassignAssignVFs(VM_DATA.hostId, assignments, false, percentToAdvance, function (assignErrors) {
		                    processAssignResponse(notEnoughVFErrors, [], assignErrors, assignments.length, true);
		                });
		            }
	        	}
	        );
	    }
	});


    //Apply to All GPUs Apply button
    //This just calls updateGPU for the individual items, since there is no API for batch updates.
	$("#btn-gpu-apply").on("click", function () {
	    if (this.className.indexOf("disabled") < 0) {
	    	// Check for VFs with a status of "in use" - we don't allow partitions to be updated when there's any VF in use
	    	var hasVfInUse = false;
	    	for (var i = 0; i < GPU_DATA.gpuList.length; i++) {
	    		if (GPU_DATA.gpuList[i].hasVfInUse) {
	    			hasVfInUse = true;
	    			break;
	    		}
	    	}
	    	if (hasVfInUse) {
				showAlert("Cannot modify number of partitions", "The number of partitions cannot be modified because there are mxGPUs in use.<br/>Please ensure that all users are logged off before modifying partitions.");

        	    // Restore the master slider position and value
				var slider = $("#parent-partition");
                slider.slider("setValue", GPU_DATA_RESTORE.masterValue);
                var sliderCounter = slider.siblings(".slider").find(".counter");
                sliderCounter.html(GPU_DATA_RESTORE.masterValue);

                // Uncheck the checkbox and force updates
	            $(".switch input").prop("checked", false);
	            $(".switch input").trigger("change");
	    	} else {
		        showConfirm("Confirm Repartitioning of All GPUs",
		        	"Are you sure you want to override individual GPU settings?",
		        	function () {
				            var value = $("#parent-partition").slider("getValue");
				            updateAllMxGPUs(GPU_DATA.hostId, GPU_DATA.gpuList, value,
				            	function () {
				                	resetButtons(false);
				                	loadData();
				            	});
		            });
	    	}
	    }
	});


	$("#btn-gpu-refresh").on("click", function () {
	    if ($("#btn-gpu-restore")[0].className.indexOf("disabled") >= 0) {
	        resetButtons(true);
	        loadData();
	    } else {
	    	showConfirm("Lose changes?",
	    		"Refreshing will erase all unapplied changes. Continue?",
	    		function() {
			        resetButtons(true);
			        loadData();
	    		});
	    }
    	$("#btn-gpu-refresh").blur();
	});

    //This is the functionality for the Restore button - gets the old data and restores it
	$("#btn-gpu-restore").on("click", function () {
	    if (this.className.indexOf("disabled") < 0) {
	        showConfirm("Lose changes?",
	        	"Restoring will erase all unapplied changes. Continue?",
	        	restore);
	    }
	});

});
