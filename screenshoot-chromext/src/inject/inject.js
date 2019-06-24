chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// $('body').append('<div style="position:fixed; top:0; right:0;"><a href="'+secretLink+'">TEST</a></div>');

		var div = document.createElement( 'div' );

		//append all elements
		document.body.appendChild( div );


		//set attributes for div
		div.id = 'screenshoot_container';
		div.innerHTML = '<strong class="directive">Screenshot this page:</strong><br />';

		// Screenshot Button - 375
		var button375 = document.createElement( 'button' );
		button375.id="screenshot_button_375";
		button375.setAttribute('data-size', '375');
		button375.innerHTML = "375";
		div.appendChild( button375 );

		// Screenshot Button - 1024
		var button1024 = document.createElement( 'button' );
		button1024.id="screenshot_button_1024";
		button1024.setAttribute('data-size', '1024');
		button1024.innerHTML = "1024";
		div.appendChild( button1024 );

		// Screenshot Button - 1440
		var button1440 = document.createElement( 'button' );
		button1440.id="screenshot_button_1440";
		button1440.setAttribute('data-size', '1440');
		button1440.innerHTML = "1440";
		div.appendChild( button1440 );

		// Screenshot Button - All
		var buttonAll = document.createElement( 'button' );
		buttonAll.id="screenshot_button_all";
		buttonAll.setAttribute('data-size', 'all');
		buttonAll.innerHTML = "All";
		div.appendChild( buttonAll );

		// options
		var optDiv = document.createElement('div');
		optDiv.id = "screenshot_options";
		div.appendChild(optDiv);


		/* Full page checkbox */

		// full page checkbox
		var fplabel = document.createElement('label');
		fplabel.id = "fullpage-label";

		// add the fullpage checkbox
		fplabel.innerHTML = '<input type="checkbox" value="true" id="fullpage_checkbox" /> Full Page';
		optDiv.appendChild(fplabel);

		// update checkbox state
		chrome.storage.sync.get('fullpage', function(data) {
			console.log("get checked status", data, data.fullpage);
		    document.getElementById('fullpage_checkbox').checked = data.fullpage;
		});

		var fpcb = document.getElementById('fullpage_checkbox');

		fpcb.addEventListener('change', function (e) {
			console.log("change");
			console.log(e.target.checked);
			chrome.storage.sync.set({ fullpage: e.target.checked });
		});


		/* Hide / Show Panel */

		// add hiding and showing to match the column.
		var hideButton = document.getElementById('interfaceControlFrameMinimizeButton');
		hideButton.addEventListener('click', function (e) {
			div.style.display = "none";
		});

		// show the panel again. This button lives inside of an iframe.
		var showIframe = document.getElementById('expandFrame');
		showIframe.contentDocument.getElementById('maximizePanel').addEventListener('click', function (e) { 
			div.style.display = "block"; 
		});



		/* Individual Page Checkboxes */

		$('.sitemapNode.sitemapLeafNode .sitemapPageLinkContainer').each(function (i, leafNode) {
			$(leafNode).prepend('<input type="checkbox" value="'+ $(leafNode).find('.sitemapPageLink').attr('nodeurl') +'" class="selectNode" />');
		});

		// update link
		$('.selectNode').click(function (e) {
			var checked = $('.selectNode:checked');

			if (checked.length > 0) {
				$('#screenshoot_container .directive').text('Screenshot ('+checked.length+') pages:');
			} else {
				$('#screenshoot_container .directive').text('Screenshot this page:');
			}

		});


		// var fpcb = document.createElement('input');
		// fpcb.id = "fullpage_checkbox";
		// fpcb.type = "checkbox";
		// fpcb.value = "true";
		// fpcb.checked = true;
		// fplabel.appendChild(fpcb);

		function viewportButtonClick(e) {
			// get filename
			// get secret link

			// console.log(e);
			// console.log(e.target);
			// console.log(e.currentTarget);

			/* Multiple Screenshots? */
			var checked = $('.selectNode:checked');

			if (checked.length > 88) {
				// a lot of screenshots
				/*
				// with multiple, we just ajax over to our service and wait for a url back.
				$('#screenshoot_container .directive').text("Loading...");
				// $('#screenshoot_container button').prop('disabled', true);

				var checkedNodes = [];
				checked.each(function (i, checkbox) {
					checkedNodes.push( $(checkbox).val() );
				});

				console.log("checkedNodes", checkedNodes);

				var url = "http://localhost:3000/multiple";
				var data = {
					'size': e.target.getAttribute('data-size'),
					'fullPage': (document.getElementById('fullpage_checkbox').checked),
					'nodes': checkedNodes
				};

				// chrome.runtime.sendMessage({contentScriptQuery: "multiSelect", data:data});


					console.log("fire the ajax");

					$.ajax({
						type: "POST",
						url: url,
						// mode: "cors",
						crossDomain: true,
						data: JSON.stringify(data),
						dataType: "json"
					})
					.done(function (msg) {
						console.log("message:" , msg);
					})
					.fail(function (jqxhr, textStatus) {
					  // alert( "Request failed: " + textStatus );
					  console.log(textStatus);
					})
					.always(function(var1, var2) {
						console.log("always", var1, var2);
					});

				*/

			} else {
				// not as many screenshots

				// double check the secret link is available
				if (document.getElementById("sitemapLinkWithPlayer")) {

					// get global variables
					var frameUrl = document.getElementById('mainFrame').contentWindow.location.href;
					var globalVars = "";
					var parts = frameUrl.split("#");
					console.log(frameUrl);
					console.log(parts);
					if (parts.length > 1) {
						// we have some global variables
						globalVars = parts[1];
					}


					// get secret link 
					// this is the unique static page that is just the screen
					var secretLink =  document.getElementById("sitemapLinkWithPlayer").value;

					// console.log("secretLink", secretLink);

					// get filename
					var filename;
					if (document.getElementsByClassName('sitemapHighlight').length > 0) {
						filename = document.getElementsByClassName('sitemapHighlight')[0].getElementsByClassName('sitemapPageName')[0].innerHTML;
					}

					// construct the base url and add on the global variables from above.
					var href = "http://localhost:3000/?page="+secretLink+"&globalVars="+encodeURIComponent(globalVars);

					if (e.target.id == "screenshot_button_375") {
						href = href+"&viewport_mobile=true";
					}

					if (e.target.id == "screenshot_button_1024") {
						href = href+"&viewport_mobile=false&viewport_desktop=true";
					}

					if (e.target.id == "screenshot_button_1440") {
						href = href+"&viewport_mobile=false&viewport_desktop_big=true";
					}

					if (e.target.id == "screenshot_button_all") {
						href = href+"&viewport_mobile=true&viewport_desktop=true&viewport_desktop_big=true";
					}

					var fullpage = document.getElementById('fullpage_checkbox');
					if (!fullpage.checked) {
						href = href+"&fullpage=false";
					}

					if (filename) {
						href = href+"&filename="+filename;
					}

					var multiSelect = false;
					var checkedNodes = [];
					if (checked.length > 0) {
						multiSelect = true;

						href = href + "&multiple=true";

						checked.each(function (i, checkbox) {
							checkedNodes.push( $(checkbox).val() );
							href = href + "&cn[]=" + encodeURIComponent($(checkbox).val());
						});

					}



					console.log("href", href);


					// create link, click it, and remove it.
					var a = document.createElement( 'a' );
					div.appendChild( a );
					a.id ="gotoScreenshot";
					a.href = href;
					a.target = "_blank";
					document.getElementById('gotoScreenshot').click();
					a.remove();

				} else {
					alert("Could not find secret link. Please try again.");
				}
			}

			
		}

		document.getElementById('screenshot_button_375').addEventListener('click', viewportButtonClick);
		document.getElementById('screenshot_button_1024').addEventListener('click', viewportButtonClick);
		document.getElementById('screenshot_button_1440').addEventListener('click', viewportButtonClick);

		document.getElementById('screenshot_button_all').addEventListener('click', viewportButtonClick);






	}
	}, 10);
});