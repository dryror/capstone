var ui = {};
(function() {
	ui.fetch = {
		// Local variables
		request: null,
		callback: null,
		toSend: null,
		requestQueue: [],
		
		// Handle the corresponding HTTP request
		loadData: function(url, toSend, callback) {
			// Move the current request to upload queue if the request handler is serving others
			if (this.request) {
				this.requestQueue.push({url: url, toSend: toSend, callback: callback});
				return;
			}
			
			this.request = Titanium.Network.createHTTPClient();
			this.callback = callback;
			this.toSend = toSend;
			
			this.request.onload = this.onload;
			this.request.onerror = this.onerror;
			
			this.request.open('POST', url);
			this.request.setRequestHeader("enctype", "multipart/form-data");
			this.request.setRequestHeader("User-Agent","myUserAgent");
			this.request.send(this.toSend);
		},
		
		// Success callback for handling the response
		onload: function() {
			var response = (this.status == 200) ? this.responseText : null;
			if (typeof(ui.fetch.callback) == "function") ui.fetch.callback(response);
			ui.fetch.processNextRequest();
		},
		
		// Error callback handler
		onerror: function(e) {
			ui.fetch.processNextRequest;
			// TODO: handle errors better
		}
	};
	
	// Process the next request of upload queue
	ui.fetch.processNextRequest = function() {
		ui.fetch.request = null;
		var nextRequest = ui.fetch.requestQueue.shift();
		if(nextRequest) ui.fetch.loadData(nextRequest.url, nextRequest.toSend, nextRequest.callback);
	};

})();