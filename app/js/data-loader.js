// Namespace shortcut
var ns = com_amd_mxgpui;

// Load a host's MxGPUs and their virtual functions (VFs)
//
// hostId = host's identifier (URI)
// startIndex = starting index of hosts to load (for pagination)
// size = number of hosts to load (page size)
// callback = function to process the results
function getMxGPUs(hostId, start, size, callback) {
	var actionUrl = ns.webContextPath + "/rest/services/getMxGPUsForHost/" + encodeURIComponent(hostId) + "?start=" + start + "&size=" + size;
	console.log("Called " + actionUrl);

	$.post(actionUrl, function(data) {
		if (data.jsonMap.result) {
			// Use the following two lines to print out full JSON to the console
			// var str = JSON.stringify(data.jsonMap.result, null, 2);
			// console.log(str);
			// Use this line to print out the object so it can be navigated via the console
			// console.log(data.jsonMap.result);
			// Pass result to callback function
			callback(data);
		} else {
			logError(actionUrl, data.jsonMap);
			reportError("MxGPU Load Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading MxGPUs for a host.",
					actionUrl, jqXHR.status, jqXHR.responseJSON.message);
	});
};

// Load a host's VMs and their virtual functions (VFs)
//
// hostId = host's identifier (URI)
// startIndex = starting index of hosts to load (for pagination)
// size = number of hosts to load (page size)
// callback = function to process the results
function getVMsForHost(hostId, start, size, callback) {
	var actionUrl = ns.webContextPath + "/rest/services/getVMsForHost/" + encodeURIComponent(hostId) + "?start=" + start + "&size=" + size;
	console.log("Called " + actionUrl);

	$.post(actionUrl, function(data) {
		if (data.jsonMap.result) {
			// Use the following two lines to print out full JSON to the console
			// var str = JSON.stringify(data.jsonMap.result, null, 2);
			// console.log(str);
			// Use this line to print out the object so it can be navigated via the console
			// console.log(data.jsonMap.result);
			// Pass result to callback function
			callback(data);
		} else {
			logError(actionUrl, data.jsonMap);
			reportError("VM Load Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading VMs for a host.",
					actionUrl, jqXHR.status, jqXHR.responseJSON.message);
	});
};

// Load all data centers
//
// callback = function to process the results
function getDataCenters(callback) {
	var actionUrl = ns.webContextPath + "/rest/services/getDataCenters";
	console.log("Called " + actionUrl);

	$.post(actionUrl, function(data) {
		if (data.jsonMap.result) {
			// console.log(data.jsonMap.result);
			// Pass result to callback function
			callback(data);
		} else {
			logError(actionUrl, data.jsonMap);
			reportError("Data Center Load Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading data centers.",
					actionUrl, jqXHR.status, jqXHR.responseJSON.message);
	});
};


// Load all hosts for a data center
//
// dcId = data center's identifier (URI)
// callback = function to process the results
function getHostsForDataCenter(dcId, callback) {
	var actionUrl = ns.webContextPath + "/rest/services/getHostsForDataCenter/" + encodeURIComponent(dcId);
	console.log("Called " + actionUrl);
	
	$.post(actionUrl, function(data) {
		if (data.jsonMap.result) {
			// console.log(data.jsonMap.result);
			// Pass result to callback function
			callback(data);
		} else {
			logError(actionUrl, data.jsonMap);
			reportError("Host Load Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading hosts for a data center.",
					actionUrl, jqXHR.status, jqXHR.responseJSON.message);
	});
};

function getVFsForMxGPU(hostId, gpuId, callback) {
		
	var actionUrl = ns.webContextPath + "/rest/services/getVFsForGPU/" + encodeURIComponent(hostId) + "?gpuId=" + encodeURIComponent(gpuId);
	console.log("Called " + actionUrl);
	
	$.post(actionUrl, function(data) {
		if (data.jsonMap.result) {
			// console.log(data.jsonMap.result);
			// Pass result to callback function
			callback(data);
		} else {
			logError(actionUrl, data.jsonMap);
			reportError("MxGPU Partition Load Error", data.jsonMap.errorMessage, actionUrl, data.jsonMap);
		}
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading partitions for an MxGPU.",
					actionUrl, jqXHR.status, jqXHR.responseJSON.message);
	});
};


// Load the Host Name
function loadHostName(hostId, callback) {
	var actionUrl = ns.webContextPath + "/rest/services/getHostName/" + encodeURIComponent(hostId);
	console.log("Called " + actionUrl);

	// Get the name of the currently selected host
	$.post(actionUrl, function(hostName) {
		callback(hostName);
	}).fail(
		function(jqXHR, status, error) {
			logException(actionUrl, error, jqXHR.responseJSON);
			reportException(error, "An error occurred while loading the name for host ID "+ hostId,
				actionUrl, jqXHR.status, jqXHR.responseJSON.message);
		}
	);
};
