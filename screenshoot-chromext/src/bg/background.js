// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
// chrome.extension.onMessage.addListener(
//   function(request, sender, sendResponse) {
//   	chrome.pageAction.show(sender.tab.id);
//     sendResponse();
//   });

// chrome.browserAction.onClicked.addListener(function(tab) { 
// 	alert('icon clicked');
// 	var newURL = "http://stackoverflow.com/";
// 	chrome.tabs.create({ url: newURL });  
// });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.contentScriptQuery == "multiSelect") {

	console.log("multiSelect");
	console.log(request.data);

      // var url = "https://another-site.com/price-query?itemId=" +
      //         encodeURIComponent(request.itemId);
      // fetch(url)
      //     .then(response => response.text())
      //     .then(text => parsePrice(text))
      //     .then(price => sendResponse(price))
      //     .catch(error => ...)
      // return true;  // Will respond asynchronously.

      var request = new XMLHttpRequest();

      request.open("POST", "http://localhost:3000/multiple", true);
      request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      request.onreadystatechange = function() {
        if (this.readyState == 4) {
          // port.postMessage({
          //   status: this.status,
          //   data: this.responseText,
          //   xhr: this
          // });
          console.log(this.responseText);
        }
      }
      request.send(JSON.stringify(request.data));


    }

  });