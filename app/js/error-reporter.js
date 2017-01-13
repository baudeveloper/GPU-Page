// Log an error to the console
//
// actionUrl = action in which the error occurred
// jsonMap = JSON containing the error code, error message and related object ID
function logError(actionUrl, jsonMap) {
	console.log("ERROR in: " + actionUrl
			+ "\nError code: " + jsonMap.errorCode
			+ "\nError message: "+ jsonMap.errorMessage
			+ "\nObject ID: " + jsonMap.errorObjectId);
};

// Log an unchecked exception to the console
//
// actionUrl = action in which the error occurred
// error = error code
// responseJSON = JSON containing the error message and stackTrace
function logException(actionUrl, error, responseJSON) {
    console.log("ERROR in: " + actionUrl
			+ "\nAction status: " + error
			+ "\nError: " + responseJSON.message
			+ "\nStack trace: " + responseJSON.stackTrace);
};

function logFail(message, jqXHR) {
    console.log("ERROR: " + message +
        "\njqXHR: " + JSON.stringify(jqXHR));
};

function clearDetailedError() {
    var errDialog = $("#errorDialog");
    errDialog.find(".modal-body").html("");
};

// Set the content and show the modal error dialog
// 
// errorTitle = title of modal dialog (nullable)
// friendlyErrorMessage = helpful text about the error (nullable)
// actionUrl = action in which the error occurred (nullable)
// errorCode = error code (nullable)
// errorDescription = detailed description of error (nullable)
// errorObjectId = ID of object for which the error occurred (nullable)
// append - if true, append this to the current error, don't start a new one
function reportDetailedError(errorTitle, friendlyErrorMessage, actionUrl, errorCode, errorDescription, errorObjectId, append) {
	var errDialog = $("#errorDialog");
	
	if (errorTitle) {
		errDialog.find(".modal-title").text(errorTitle);
	} else {
		errDialog.find(".modal-title").text("MxGPU Control Center Error");
	}
	
	var htmlContent = "";
	
	if (friendlyErrorMessage)
		htmlContent += "<p>" + friendlyErrorMessage + "</p>";
	
	if (errorCode)
		htmlContent += "<p><b>Error code:</b> " + errorCode + "</p>";
	
	if (errorDescription)
		htmlContent += "<p><b>Error:</b> " + errorDescription + "</p>";
	
	if (errorObjectId)
		htmlContent += "<p><b>ID:</b> " + errorObjectId + "</p>";
	
	if (actionUrl)
	    htmlContent += "<p><b>Action:</b> " + actionUrl + "</p>";

	htmlContent += "<hr>";
	
	if (append) {
	    errDialog.find(".modal-body").append(htmlContent);
	    errDialog.find(".modal-title").text("Error Messages");
	} else {
	    errDialog.find(".modal-body").html(htmlContent);
	}

	errDialog.modal("show");
};

// Display an error message in a modal dialog
//
// errorTitle = title of modal dialog
// friendlyErrorMessage = helpful text about the error
// actionUrl = action in which the error occurred
// jsonMap = JSON containing the error code, error message and related object ID
function reportError(errorTitle, friendlyErrorMessage, actionUrl, jsonMap, append) {
	reportDetailedError(errorTitle, friendlyErrorMessage, actionUrl,
		null, null, jsonMap.errorObjectId, append);
};

// Display an unchecked exception in a modal dialog
//
// errorTitle = title of modal dialog
// friendlyErrorMessage = helpful text about the error
// actionUrl = action in which the error occurred
// status = action status (error code)
// message = detailed description of error 
function reportException(errorTitle, friendlyErrorMessage, actionUrl, status, message, append) {
	reportDetailedError(errorTitle, friendlyErrorMessage, actionUrl, null, null, null, append);
};

// Use a modal dialog to show an alert
//
// alertTitle = title of modal dialog
// alertContent = HTML content to display in the modal dialog's body
function showAlert(alertTitle, alertContent) {
	var alertDialog = $("#alertDialog");
	
	if (alertTitle) {
		alertDialog.find(".modal-title").text(alertTitle);
	} else {
		alertDialog.find(".modal-title").text("MxGPU Control Center");
	}
	
	alertDialog.find(".modal-body").html(alertContent);
	alertDialog.modal("show");
};


// Use a modal dialog as a confirm dialog
//
// confirmTitle = title of modal dialog
// confirmContent = HTML content to display in the modal dialog's body
// confirmAction = function to call if the user presses "OK" button
function showConfirm(confirmTitle, confirmContent, confirmAction) {
	var confirmDialog = $("#confirmDialog");
	
	if (confirmTitle) {
		confirmDialog.find(".modal-title").text(confirmTitle);
	} else {
		confirmDialog.find(".modal-title").text("MxGPU Control Center");
	}
	
	confirmDialog.find(".modal-body").html(confirmContent);
	confirmDialog.modal("show");
	
	$('#confirmDialog').modal();
	
	// There seems to be a bug in the Bootstrap modals where previous
	// actions bound to the click event linger and get invoked at
	// subsequent uses of the modal dialog, so this unbind call clears those.
	$('#confirmOKBtn').unbind( "click" );
	$('#confirmOKBtn').on('click', confirmAction);
};
