// Use JQuery's $(document).ready to execute the script when the document is loaded.
// All variables and functions are also hidden from the global scope.
$(document).ready(
		function() {
			// Namespace shortcut
			var ns = com_amd_mxgpui;

			// Get current object and return if document is loaded
			// before context is set
			var objectId = null;
			if (WEB_PLATFORM) {
				objectId = WEB_PLATFORM.getObjectId();
			}
			
			if (!objectId) {
				$("#exitMxGPUI").click(
						function() {
							console.log("Exiting with no objectId");
							WEB_PLATFORM
							.sendNavigationRequest("vsphere.core.controlcenter.domainView");
				});
			} else {
				$("#exitMxGPUI").click(
						function() {
							console.log("Exiting with objectId " + objectId);
							WEB_PLATFORM
							.sendNavigationRequest("vsphere.core.host.summary", objectId);
							//.sendNavigationRequest("vsphere.core.host.manageViews", objectId);
				});
//				
//				// Navigate to other views using their extensionId
//				$("#gotoVM").click(
//						function() {
//							WEB_PLATFORM
//							.sendNavigationRequest("com.amd.mxgpui.host.manage.mxgpuiVM", objectId);
//				});
//				$("#gotoGPU").click(
//						function() {
//							WEB_PLATFORM
//							.sendNavigationRequest("com.amd.mxgpui.host.manage.mxgpuiGPU", objectId);
//				});
			}
			
			// Clean up global variables whenever the user leaves MxGPUI by
			// clicking on vSphere Client links or by clicking on Exit MxGPUI
			var parent = window.parent;
			var previous = parent.onhashchange;
			parent.onhashchange = function() {
				parent.onhashchange = previous;
				parent.console.log("Cleaning global variables");
//				alert("WARNING: Leaving MxGPU Control Center.\nAny uncommitted changes will be lost.");
				cleanGlobals();
				if (previous != null) {
					previous();
				}
			};
		});
