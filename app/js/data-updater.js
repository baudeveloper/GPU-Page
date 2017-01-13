// Namespace shortcut
var ns = com_amd_mxgpui;
var PROGRESS;
var ANIMATE_PROGRESS;

function resetProgressBar() {
    PROGRESS = 0.0;
    ANIMATE_PROGRESS = 0.0;
    $("#progress-bar").width("0%");
    $("#progress-div").show();
};

//progress bar based on http://www.w3schools.com/howto/howto_js_progressbar.asp
function advanceProgressBar(percentToAdvance) {
    PROGRESS += percentToAdvance;
    var interval = setInterval(frame, 10);
    function frame() {
        if (ANIMATE_PROGRESS >= PROGRESS) {
            clearInterval(interval);
        } else {
            ANIMATE_PROGRESS += 1.0;
            $("#progress-bar").width(ANIMATE_PROGRESS + "%");
        }
    }
};

function hideProgressBar() {
    setTimeout(function () {
        $("#progress-div").hide();
    }, 1000);
};


// Update the number of virtual functions (VFs) for an MxGPU
//
// hostId = Host ID
// gpuId = MxGPU ID
// vfCount = # of VFs
// callback = function to process the results
function updateMxGPU(hostId, gpuId, vfCount, callback) {
    var actionUrl = ns.webContextPath + "/rest/services/updateMxGPU/" + hostId + "?gpuId=" + gpuId + "&vfCount=" + vfCount;
    //var actionUrl = "test";
	console.log("Called " + actionUrl);
    //$.getJSON("updateMxGPU.json", function(data) {
	$.post(actionUrl, function(data) {
		if (!data.jsonMap.result) {
			logError(actionUrl, data.jsonMap);
			reportError("Update Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
		// Pass result to callback function and force refresh of UI
		callback(data);
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException("500 Internal Server Error", "An error occurred while updating an MxGPU's partitions.",
					null, null, null);
			// Call callback function to force refresh of UI
			callback();
	});
};



//deferreds = a list of promises to wait for the resolution of
//results = the results from the promises associated with the deferreds, not necessarily in any particular order
//callback = the callback function to do when done
function processUpdateAllMxGPUs(deferreds, results, callback) {
    $.when.apply($, deferreds).then(function () {
        clearDetailedError();

        for (i = 0; i < results.length; i++) {
            //console.log("this is result[" + i + "]: " + JSON.stringify(results[i]));
            if (results[i].jsonMap) { //successful request, but could still be backend error
                if (results[i].jsonMap.result) {
                    //there's actually nothing to be done here. One callback at the end (likely refresh all).
                } else {
                    logError(null, results[i].jsonMap); //no easy way of knowing actionUrl here - but can add if need be
                    reportError("Update Error", data.jsonMap.errorMessage,
                        null, results[i].jsonMap, true);
                }
            } else {
                logFail("An error occurred while updating an MxGPU's partitions", results[i].jqXHR)
                reportException("500 Internal Server Error", "An error occurred while updating an MxGPU's partitions.",
					null, null, null, true);
            }
        }

        callback();
    }).fail(function (jqXHR, status, error) {
        //This is called if one of the deferreds fails to resolve - this should never happen.
        //resolve() is called on each of the deferreds whether the statement succeeds or fails.
        logFail("An unexpected error occurred while trying to update all MxGPU partitions.", jqXHR);
        reportException(error, "An unexpected error occurred while trying to update all MxGPU partitions. " +
            "WARNING: This statement should never be reached even in case of an update failing.",
		        null, status, null);
		// Call callback function to force refresh of UI
		callback();
    });
};

function getNonPassthroughGPUs(gpuList) {
	var nonPassthroughGPUs = [];
	var j = 0;
    for (var i = 0; i < gpuList.length; i++) {
    	if (gpuList[i].maxVfNumber > 0) {
    		nonPassthroughGPUs[j++] = gpuList[i];
    	}
    }
    return nonPassthroughGPUs;
}

function updateAllMxGPUs(hostId, gpuList, vfCount, callback) {
    var deferreds = [];
    var actionUrl;
    var results = [];
    var nonPassthroughGPUs = getNonPassthroughGPUs(gpuList);
    var numToResolve = nonPassthroughGPUs.length;
    
    for (var i = 0; i < nonPassthroughGPUs.length; i++) {
        deferreds[i] = $.Deferred();
    	
        //actionUrl = ((i % 2 === 0) ? i : "") + "updateMxGPU.json";
        actionUrl = ns.webContextPath + "/rest/services/updateMxGPU/" + hostId +
                "?gpuId=" + nonPassthroughGPUs[i].gpuId + "&vfCount=" + vfCount;

	    $.post(actionUrl, function (data) {
	        results.push(data);
	        deferreds[i - numToResolve].resolve(data, i - numToResolve);
	        numToResolve--;
	    }).fail(function (jqXHR, status, error) {
	        results.push({"jqXHR":jqXHR, "status":status, "error":error});
	        deferreds[i - numToResolve].resolve(jqXHR, i - numToResolve);
	        numToResolve--;
	    });
    }

    processUpdateAllMxGPUs(deferreds, results, callback);
};


//deferreds = a list of promises to wait for the resolution of
//results = the results from the promises associated with the deferreds, not necessarily in any particular order
//unassign - indicates if we are assigning or unassigning VFs with this call
//callback = the callback function to do when done. Will be passed an array of accumulated errors.
function processUnassignAssignVFs(deferreds, results, unassign, callback) {
    var errors = [];

    $.when.apply($, deferreds).then(function () {
        clearDetailedError();

        for (i = 0; i < results.length; i++) {
            //console.log("this is result[" + i + "]: " + JSON.stringify(results[i]));
            if (results[i].jsonMap) { //successful request, but could still be backend error
                if (results[i].jsonMap.result) {
                    //there's actually nothing to be done here. One callback at the end (likely refresh all).
                } else {
                    logError(null, results[i].jsonMap); //no easy way of knowing actionUrl here - but can add if need be
                    errors.push({
                        "title": unassign ? "Unassign mxGPU from VM Error" : "Assign mxGPU to VM Error",
                        "message": unassign ? "An error occurred while unassigning an mxGPU from a VM." :
                        "An error occurred while assigning an mxGPU to a VM.",
                        "jsonMap": results[i].jsonMap
                    });
                }
            } else {
                logFail(unassign ? "An error occurred while unassigning an mxGPU from a VM." :
                    "An error occurred while assigning an mxGPU to a VM.", results[i].jqXHR);
                errors.push({
                    "title": "500 Internal Server Error",
                    "message": unassign ? "An error occurred while unassigning an mxGPU from a VM." :
                    "An error occurred while assigning an mxGPU to a VM.",
                });
            }
        }
        
        callback(errors);
    }).fail(function (jqXHR, status, error) {
        //This is called if one of the deferreds fails to resolve - this should never happen.
        //resolve() is called on each of the deferreds whether the statement succeeds or fails.
        logFail("An unexpected error occurred while trying to " + (unassign ? "unassign" : "assign" +
                "MxGPUs from VMs.", jqXHR));
        reportException(error, "An unexpected error occurred while trying to " + (unassign ? "unassign" : "assign") +
            "MxGPUs from VMs.", "WARNING: This statement should never be reached even in case of an assignment failing.",
		        null, status, null);
    });
};



//This method either unassigns or assigns a list of VM-VF assignments. assignments is an array of VM IDs
//if unassigning, and an array of {vmId, vfId} if assigning (indicated by the unassign variable).
//percentToAdvance is used by the progress bar. This represents what percentage the bar should
//advance for ONE operation. This will be variable based on the length of the assignments, HOWEVER,
//It cannot be computed in this method because sometimes unassignments and assignments are run back to back
//and in this case it is preferable if the bar accounts for both of these sets of operations, instead
//of resetting in between.
function unassignAssignVFs(hostId, assignments, unassign, percentToAdvance, callback) {
    var deferreds = [];
    var actionUrl;
    var results = [];
    var numToResolve = assignments.length;

    for (var i = 0; i < assignments.length; i++) {
        deferreds[i] = $.Deferred();
        //actionUrl = "https://vsphere-dev02.jonahgroup.com/ui/mxgpui/rest/services/assignVF/urn:vmomi:HostSystem:host-9:c8b0a77b-def0-4947-af73-2de7fb9d0a27?vmId=vm00020abcd&vfId=00000:87:02.0";
        //ationUrl = ((i % 2 === 0) ? "assignVFSuccess.json" :"assignVF.json");
        var actionData;
        if (unassign) {
            actionUrl = ns.webContextPath + "/rest/services/unassignVF/" + hostId;
            actionData = {vmId: assignments[i]};
        } else {
            actionUrl = ns.webContextPath + "/rest/services/assignVF/" + hostId;
            actionData = {vmId: assignments[i].vmId, vfId: assignments[i].vfId};
        }

        $.ajax({
        	dataType: "json",
        	url: actionUrl,
        	method: "POST",
        	data: actionData,
        	success: function (data) {
            	console.log("Action successful: " + actionUrl);
                advanceProgressBar(percentToAdvance);
                results.push(data);
                deferreds[i - numToResolve].resolve(data, i - numToResolve);
                numToResolve--;
            },
            error: function (jqXHR, status, error) {
            	console.log("Action failed: " + actionUrl);
                advanceProgressBar(percentToAdvance);
                results.push({ "jqXHR": jqXHR, "status": status, "error": error });
                deferreds[i - numToResolve].resolve(jqXHR, i - numToResolve);
                numToResolve--;
            }
        });
    }

    processUnassignAssignVFs(deferreds, results, unassign, callback);
};


//Take a list of VM_CHANGES and, for each entry, unassign the VM from the given VF.
//Note that gpuList will be modified.
function processUnassignData(changes, gpuList) {
    var unassignments = [];
    var i, j, vmId, gpuIndex, found;

    for (i = 0; i < changes.length; i++) {
        //index of gpuList.length index means No GPU
        if (changes[i].previousGPUIndex !== gpuList.length &&
                (changes[i].previousGPUIndex !== changes[i].newGPUIndex)) {
            found = false;

            vmId = VM_DATA.vmList[changes[i].vmIndex].vmId;
            gpuIndex = changes[i].previousGPUIndex;
            for (j = 0; j < gpuList[gpuIndex].vfList.length; j++) {
                if (gpuList[gpuIndex].vfList[j].vfStatus !== STATUS_MAPPING[0].vfStatus &&
                        gpuList[gpuIndex].vfList[j].vm.vmId === vmId) {
                    gpuList[gpuIndex].vfList[j].vfStatus = STATUS_MAPPING[0].vfStatus; //UNASSIGNED
                    gpuList[gpuIndex].vfList[j].vm = null;
                    found = true;
                    unassignments.push(vmId);
                    break;
                }
            }

            if (!found) {
                console.log("WARNING: Could not find VF in GPU " + gpuList[gpuIndex].gpuId +
                    " assigned to VM " + vmId + ".");
            }
        }
    }

    return unassignments;
};


//Take a list of VM_CHANGES (vmId and newGPUIndex) and, for each entry, find a VF
//for the VM in the selected GPU.
//gpuList will be modified.
function processAssignData(changes, gpuList, errors) {
    var assignments = [];
    var i, j, vmId, gpuIndex, found;

    for (i = 0; i < changes.length; i++) {
        if (changes[i].newGPUIndex !== gpuList.length &&
                (changes[i].previousGPUIndex !== changes[i].newGPUIndex)) {
            found = false;

            vmId = VM_DATA.vmList[changes[i].vmIndex].vmId;
            gpuIndex = changes[i].newGPUIndex;
            for (j = 0; j < gpuList[gpuIndex].vfList.length; j++) {
                if (gpuList[gpuIndex].vfList[j].vfStatus === STATUS_MAPPING[0].vfStatus) { //UNASSIGNED
                    gpuList[gpuIndex].vfList[j].vfStatus = STATUS_MAPPING[1].vfStatus; //ASSIGNED
                    //don't bother assigning the VM - the refresh will take care of this
                    assignments.push({ "vmId": vmId, "vfId": gpuList[gpuIndex].vfList[j].vfId });
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log("WARNING: Could not assign VM " + vmId + " to GPU " + gpuList[gpuIndex].gpuId +
                    ". Not enough mxGPUs available.");
                errors.push({
                    "title": "Assign MxGPU to VM Error",
                    "message": "Could not assign VM " + vmId + " to GPU " + gpuList[gpuIndex].gpuId + 
                    ". Not enough mxGPUs available."
                });
            }
        }
    }

    return assignments;
};



//This method takes a list of VMs (not altered) and a list of GPUs (will be altered)
//and assigns unassigned VMs to unassigned VFs in the GPU list.
//vmIndex is the index in the vmList - it advances whenever a VM is assigned, and stops
//at the next unassigned VM.
//With this index, the method loops through the entire list of GPUs and their VFs, and assigns
//VM-VF associations when a free VF is found.
//The function returns the list of assignments as in processAssignData
function autoAssign(vmList, gpuList, errors) {
    var assignments = [];
    var i, j;
    var vmIndex = 0;

    // Find the first available VM
    while ((vmIndex < vmList.length)
    	&& ((vmList[vmIndex].hasOwnProperty("vfId") &&
            vmList[vmIndex].vfId !== null &&
            vmList[vmIndex].vfId !== "") ||
            vmList[vmIndex].isPoweredOn)) {	// Can't assign VMs that are powered on
        vmIndex++;
    }
    
    // Check that we didn't exhaust the list
    if (vmIndex >= vmList.length) {
        console.log("No unassigned VMs to auto-assign");
        showAlert("No VMs to Assign", "There are no available VMs to auto assign.");
        return assignments; //no unassigned VMs
    }
    
    // Match up available VFs with available VMs
    for (i = 0; i < gpuList.length; i++) {
        for (j = 0; j < gpuList[i].vfList.length; j++) {
            if (gpuList[i].vfList[j].vfStatus === STATUS_MAPPING[0].vfStatus) {
                gpuList[i].vfList[j].vfStatus = STATUS_MAPPING[1].vfStatus;

                // Assign the VM to the current GPU
                if (vmIndex < vmList.length) {
                    console.log("AUTO ASSIGN will assign VM " + vmList[vmIndex].vmId + " to VF " + gpuList[i].vfList[j].vfId);
                    assignments.push({ "vmId": vmList[vmIndex].vmId, "vfId": gpuList[i].vfList[j].vfId });
                    vmIndex++;
                }

                // Find the next available VM
                while ((vmIndex < vmList.length)
                	&& ((vmList[vmIndex].hasOwnProperty("vfId") &&
                        vmList[vmIndex].vfId !== null &&
                        vmList[vmIndex].vfId !== "") ||
                        vmList[vmIndex].isPoweredOn)) {
                    vmIndex++;
                }

                if (vmIndex >= vmList.length) {
                    break;
                }
            }
        }
        if (vmIndex >= vmList.length) {
            break;
        }
    }

    if (vmIndex < vmList.length) {
        var numNotAssigned = 0;
        for (i = vmIndex; i < vmList.length; i++) {
            if (!( (vmList[vmIndex].hasOwnProperty("vfId")) &&
                        (vmList[vmIndex].vfId !== null) && (vmList[vmIndex].vfId !== "") )) {
                numNotAssigned++;
            }
        }
        errors.numNotAssigned = numNotAssigned;
        console.log("AUTO ASSIGN: Could not assign all VMs to MxGPU because there were insufficient available mxGPUs, or some VMs were powered on."); //not really an error, but log it
    }
    
    return assignments;
};

