var VM_DATA;
var GPU_DATA;
var GPU_DATA_RESTORE;

var VM_CHANGES;
var NO_GPU = "No GPU";

var HOST_NAME;

var STATUS_MAPPING = [
        {
            vfStatus: "UNASSIGNED",
            text: "Not Assigned",
            cssClass: "not-connected"
        },
        {
            vfStatus: "ASSIGNED",
            text: "Assigned to",
            cssClass: "connected"
        },
        {
            vfStatus: "IN_USE",
            text: "In Use",
            cssClass: "in-use"
        }
];


var getGPUOption = function (name, index, selected, disabled) {
    //using the disabled attribute prevents the user from selecting the item, but
    //it makes the value null. This breaks setting previousIndex on line 10 of custom.js
    return '<option value="' + index + '"' + (selected ? ' selected' : '') +
        (disabled ? ' disabled' : '') + '>' + name + '</option>';
};

var getGPUList = function (gpuData, vfId, disabled) {
    var i, j, name;
    var list = '<select class="selectpicker"' + (disabled ? " disabled" : "") + '>';
    var found = false;

    for (i = 0; i < gpuData.gpuList.length; i++) {
        name = gpuData.gpuList[i].gpuId + " | " + gpuData.gpuList[i].gpuName
        	+ " [" + gpuData.gpuList[i].unassignedVfCount + "]";
        if (!found) {
            for (j = 0; j < gpuData.gpuList[i].vfList.length; j++) {
                if (vfId === gpuData.gpuList[i].vfList[j].vfId) {
                    found = true;
                    // In the case of the selected VF, we show only the VF ID & GPU name,
                    // not the GPU ID nor the available VFs - as required by AMD
                    name = vfId + " | " + gpuData.gpuList[i].gpuName;
                    break;
                }
            }
            // Don't disable selection for the current GPU, but disable selection for other GPUs having 0 available VFs
            list = list.concat(getGPUOption(name, i, found, !found && gpuData.gpuList[i].unassignedVfCount === 0));
        } else {
            list = list.concat(getGPUOption(name, i, false, gpuData.gpuList[i].unassignedVfCount === 0));
        }
    }
    list = list.concat(getGPUOption(NO_GPU, gpuData.gpuList.length, !found, false) + '</select>');
    return list;
};


var findVF = function (vfId) {
    var i, j, vf;
    var found = false;

    for (i = 0; i < GPU_DATA.gpuList.length; i++) {
        if (found) {
        	break;
        }
        for (j = 0; j < GPU_DATA.gpuList[i].vfList.length; j++) {
            if (vfId === GPU_DATA.gpuList[i].vfList[j].vfId) {
                found = true;
                vf = GPU_DATA.gpuList[i].vfList[j];
                break;
            }
        }
    }
    return vf;
};


var createVMElements = function (vmData, gpuData) {
    var domElements = "";
    var gpuList, vfId, listItem, vf, statusObject, statusClass;

    for (var i = 0; i < vmData.vmList.length; i++) {
        vf = findVF(vmData.vmList[i].vfId);
        if (vf) {
            statusObject = getStatusObject(vf.vfStatus);
            statusClass = statusObject.cssClass;
        } else {
        	if (vmData.vmList[i].isPoweredOn) {
                statusClass = STATUS_MAPPING[2].cssClass; // "in-use"
        	} else {
                statusClass = STATUS_MAPPING[0].cssClass; // "not-connected"
        	}
        }
        gpuList = getGPUList(gpuData, vmData.vmList[i].vfId, statusClass === STATUS_MAPPING[2].cssClass ? true : false);
        listItem =
            '<li id="vm' + i + '">' +
                '<div class="machine-header ' + statusClass + '">' +
                    '<span>Virtual Machine</span>' +
                    '<h2>' + vmData.vmList[i].vmName + '</h2>' +
                '</div>' +
                '<div class="machine-action">' +
                    gpuList +
                '</div>' +
            '</li>';

        domElements = domElements.concat(listItem);
    }

    $("#vm-listing > ul").html(domElements);
    refreshVMList();
};


var getStatusObject = function (vfStatus) {
    for (var i = 0; i < STATUS_MAPPING.length; i++) {
        if (STATUS_MAPPING[i].vfStatus === vfStatus) {
            return STATUS_MAPPING[i];
        }
    }
};


var getVMNameForPartition = function (vf, statusObject) {
    if (statusObject.vfStatus === "UNASSIGNED") {
        return "";
    } else {
        if (vf.vm && vf.vm.vmName) {
            return vf.vm.vmName;
        } else {
            return "Unknown";
        }
    }
};


var getPartitionListElements = function (vfList) {
    var domElements = "";
    var listItem, statusObject, vmName;

    for (var i = 0; i < vfList.length; i++) {
        statusObject = getStatusObject(vfList[i].vfStatus);
        vmName = getVMNameForPartition(vfList[i], statusObject);

        listItem =
            '<li id="' + vfList[i].vfName.replace(/ /g, '') + '">' + //may not be valid dom ID, doesn't matter for now
                '<div class="panel-child ' + statusObject.cssClass + '">' +
                    '<span class="mxgpu-status">' + statusObject.text + '</span>' +
                    '<span class="gpu-name">' + (vfList[i].vfId ? vfList[i].vfId + ' |<br/>' : '' ) + vfList[i].vfName + '</span>' +
                    '<span class="vm-name">' + vmName + '</span>' +
                '</div>' +
            '</li>';

        domElements = domElements.concat(listItem);
    }

    return domElements;
};



var createGPUElements = function(gpuData) {
    var domElements = "";
    var listItem, partitionElements, gpuId;

    for (var i = 0; i < gpuData.gpuList.length; i++) {
        partitionElements = getPartitionListElements(gpuData.gpuList[i].vfList);

        listItem =
            '<li id="gpu' + i + '" class="gpu-node">' +
                '<div class="partition-action">' +
                    '<h2><img src="images/icon-gpu.png" alt="GPU Icon">' + gpuData.gpuList[i].gpuId
                    + " | " + gpuData.gpuList[i].gpuName +
                    //can uncomment Power User when needed. Span still needs to be there though.
                    '<span class="label label-power-user"><!--Power User--></span></h2>' + 
                    '<div class="slide">' +
                        '<span>Partitions:</span>' +
                        '<input id="gpu-partition' + i + '" type="text" class="partition" data-slider-value="' +
                        ((gpuData.gpuList[i].vfList.length > 0) ? gpuData.gpuList[i].vfList.length : 1) +
                        '" data-slider-max="' + ((gpuData.gpuList[i].maxVfNumber > 0) ? gpuData.gpuList[i].maxVfNumber : 1) + '">' +
                    '</div>' +
                    '<button type="button" class="btn btn-default disabled">Apply</button>' +
                    '<a href="#" class="partition-toggle"><i class="fa fa-minus" aria-hidden="true"></i></a>' +
                '</div>' +
                '<ul class="node-children">' + partitionElements + '</ul>'
            '</li>'

        domElements = domElements.concat(listItem);
    }

    $("#gpu-listing > ul").html(domElements);
    refreshGPUList();
};


var loadDataNoServer = function (gpuIndex) {
	
	 $("#hostTitle").text("Host");
	 
    //this is not a great way of doing things- ideally the calls would happen at the same time
    //and wait for the longer one to finish before continuing. Consider redoing this a better way
    //when more time. These items are dependent on each other for filling the DOM.
    $.getJSON("vm-vf_associations-2.json", function (vmData) {
        VM_DATA = vmData.result;
        console.log("loaded associations");

        if (gpuIndex === undefined || gpuIndex === null) {
            $.getJSON("gpu-vf_partitions-2.json", function (gpuData) {
                GPU_DATA = gpuData.result;
                GPU_DATA_RESTORE = $.extend(true, {}, GPU_DATA); //clone the current data for restore
                GPU_DATA_RESTORE.masterValue = $("#parent-partition").slider("getValue");
                console.log("loaded partitions");

                // Set the max value on the global partition slider
                $("#parent-partition").slider("setAttribute", "max", GPU_DATA.globalMaxVfNumber);

                createVMElements(VM_DATA, GPU_DATA);
                createGPUElements(GPU_DATA);

                updateAutoAssignButton();
            });
        } else {
            $.getJSON("gpu-vf-list.json", function (gpuData) {
                processIndividualGPURefresh(gpuData, gpuIndex);
            });
        }
    });
};

function processIndividualGPURefresh(gpuData, gpuIndex) {
    GPU_DATA.gpuList[gpuIndex].vfList = gpuData.jsonMap.result;

    var restoreData = $.extend(true, {}, gpuData.jsonMap);
    GPU_DATA_RESTORE.gpuList[gpuIndex].vfList = restoreData.result; //clone the current data for restore
    GPU_DATA_RESTORE.masterValue = $("#parent-partition").slider("getValue");

    var domElements = getPartitionListElements(GPU_DATA.gpuList[gpuIndex].vfList);
    $("#gpu" + gpuIndex + " > ul").html(domElements);

    // Figure out how many unassigned VFs there are on the GPU
    var vfTotal = GPU_DATA.gpuList[gpuIndex].vfList.length;
    var unassignedCount = 0;
    for (var i = 0; i < vfTotal; i++) {
        if (GPU_DATA.gpuList[gpuIndex].vfList[i].vfStatus === STATUS_MAPPING[0].vfStatus) {
            unassignedCount++;
        }
    }

    // Update the # of unassigned VFs on the GPU
    GPU_DATA.gpuList[gpuIndex].unassignedVfCount = unassignedCount;
    GPU_DATA_RESTORE.gpuList[gpuIndex].unassignedVfCount = unassignedCount;

    // Update the slider in case there was an error
    // - the following code restores the slider position and value)
    $("#gpu-partition" + gpuIndex).slider("setValue", vfTotal);
    var sliderCounter = $("#gpu-partition" + gpuIndex).siblings(".slider").find(".counter");
    sliderCounter.html(vfTotal);

    createVMElements(VM_DATA, GPU_DATA);

    updateAutoAssignButton();
};



var loadDataServer = function (gpuIndex) {
    // Shortcut to namespace
    var ns = com_amd_mxgpui;

    // Get the host's ID either from the object ID or the action UID
    // (we use the object ID if this page was reached through the left nav & TOC;
    // we use the actionTargets if this page was reached through the action dialog)
    var selectedHost = WEB_PLATFORM.getObjectId() != null ? WEB_PLATFORM.getObjectId() : WEB_PLATFORM.getActionTargets();
    if (!selectedHost) {

        // If the host ID is null, hide the content
        $("#vm-gpu-component").hide();
        console.log("MxGPUI: Cannot load VMs or MxGPUs for an undefined host");

    } else {
    	// Host name is not in the global variable, so load it
    	if (!HOST_NAME) {
            loadHostName(selectedHost, function(hostName) {
        		if (hostName) {
        			// Save it in the global variable
        			HOST_NAME = hostName;
    		        // Update the HTML field with the host name
    		        $("#hostTitle").text(hostName);
    			} else {
    				console.log("Failed to load host name for host ID " + hostId);
    		        $("#hostTitle").text("Host");
    			}
            });
    	} else {
	        // Update the HTML field with the host name
	        $("#hostTitle").text(HOST_NAME);
    	}
    	
    	getDataServer(gpuIndex, selectedHost);
    }
};


// Load VMs and associated VF
function getDataServer(gpuIndex, selectedHost) {

    // The second call is in the callback of the first one, because the data sets are dependent on one another for
    // creating the GPU elements.
    getVMsForHost(selectedHost, 0, 0, function (vmData) {
        console.log("Operation: " + vmData.jsonMap.actionUid);

        // Save the data in a global variable
        VM_DATA = vmData.jsonMap.result;

        // Load MxGPUs and VFs
        //if this is an update for just one GPU, then we only load the data for that GPU
        if (gpuIndex === undefined || gpuIndex === null) {
            getMxGPUs(selectedHost, 0, 0, function (gpuData) {
                console.log("Operation: " + gpuData.jsonMap.actionUid);

                // Save the data in a global variable
                GPU_DATA = gpuData.jsonMap.result;
                GPU_DATA_RESTORE = $.extend(true, {}, GPU_DATA); //clone the current data for restore
                GPU_DATA_RESTORE.masterValue = $("#parent-partition").slider("getValue");
                
                // Set the max value on the global partition slider
                $("#parent-partition").slider("setAttribute", "max", GPU_DATA.globalMaxVfNumber);

                createVMElements(VM_DATA, GPU_DATA);
                createGPUElements(GPU_DATA);

                updateAutoAssignButton();
            });
        } else {
            getVFsForMxGPU(selectedHost, GPU_DATA.gpuList[gpuIndex].gpuId, function (gpuData) {
                console.log("Operation: " + gpuData.jsonMap.actionUid);
                processIndividualGPURefresh(gpuData, gpuIndex);
            });
        }

    });
};


// Ensure the Auto Assign button is enabled only if there are available VMs and unassigned VFs
var updateAutoAssignButton = function () {
    if (GPU_DATA.hasUnassignedVf && VM_DATA.hasAvailableVm) {
        //$("#btn-vm-auto").prop('disabled', false);
        $("#btn-vm-auto").removeClass("disabled");
    } else {
        //$("#btn-vm-auto").prop('disabled', true);
        $("#btn-vm-auto").addClass("disabled");
    }
};

var loadData = function (gpuIndex) {
    //Luna, you can change this here...
    //loadDataServer(gpuIndex);
    loadDataNoServer(gpuIndex);
    VM_CHANGES = [];
    var disable = true;

    if (gpuIndex !== undefined && gpuIndex !== null) {
        for (var i = 0; i < GPU_DATA.gpuList.length; i++) {
            if (GPU_DATA.gpuList[i].modified) {
                disable = false;
                break;
            }
        }
    }

    if (disable) {
        $("#btn-gpu-restore").removeClass("btn-orange").addClass("disabled");
    }
};


// Function to clean global variables whenever the user leaves the MxGPUI page
// (see navigation.js for usage)
var cleanGlobals = function () {
    VM_DATA = null;
    VM_CHANGES = [];
	GPU_DATA = null;
	GPU_DATA_RESTORE = null;
	HOST_NAME = null;
};


// Use JQuery's $(document).ready to execute the script when the document is loaded.
// This also hides locale variables from the global scope.
$(document).ready(function () {

	// Function for handling global refreshes
	//WEB_PLATFORM.setGlobalRefreshHandler(loadData());
	
	loadData();
});