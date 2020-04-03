chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		var settingsHtml = '<strong>Screenshooting Settings</strong><br />'
		+ '	<p class="showOption withSelect">'
		+ '		<span class="label">Screenshot size</span><br />'
		+ '		<select class="" id="screenshoot-setting-adaptiveview" data-settingId="adaptiveView"></select>'
		+ '		<span class="helper-text">Either an adaptive view (if any) or the custom size below</span>'
		+ ' </p>'
		+ '	<p class="showOption withCheckbox" id="screenshoot-setting-fullpage-group">'
		+ '		<span class="overflowOptionCheckbox" id="screenshoot-setting-fullpage" data-settingId="fullpage"><input type="checkbox" id="screenshoot-checkbox-fullpage" /></span>'
		+ '		<span class="label">Full page height</span><br />'
		+ '		<span class="helper-text">Use height of page instead height of adaptive view.</span>'
		+ ' </p>'
		+ '	<p class="showOption withCheckbox">'
		+ '		<span class="overflowOptionCheckbox" id="screenshoot-setting-useVarsInFilename" data-settingId="useVarsInFilename"><input type="checkbox" id="screenshoot-checkbox-useGlobalVars" /></span>'
		+ '		<span class="label">Global vars in filename</span><br />'
		+ '		<span class="helper-text">Include global variables in the filename.</span>'
		+ ' </p>'
		+ '	<p class="showOption withText">'
		+ '		<span class="label">Wait time</span><br />'
		+ '		<input type="number" class="" id="screenshoot-setting-waittime" placeholder="Wait time (milliseconds)" value="" data-settingId="waitTime" />'
		+ '		<span class="helper-text">How many milliseconds to wait after page load to take the screenshot.</span>'
		+ ' </p>'
		+ '	<p class="showOption withText">'
		+ '		<span class="label">Custom w x h</span><br />'
		+ '		<input type="number" class="small-number" id="screenshoot-setting-customWidth" placeholder="width" value="" data-settingId="customWidth" /> x'
		+ '<input type="number" class="small-number" id="screenshoot-setting-customHeight" placeholder="height" value="" data-settingId="customHeight" />'
		+ '		<span class="helper-text">What width x height (pixels) to use when there is no adaptive view setup.</span>'
		+ ' </p>'
		+ '	<p class="showOption withCheckbox">'
		+ '		<span class="overflowOptionCheckbox" id="screenshoot-setting-scrollToPage" data-settingId="scrollToPage"><input type="checkbox" id="screenshoot-checkbox-scrollToPage" /></span>'
		+ '		<span class="label">Scroll to page</span><br />'
		+ '		<span class="helper-text">Once axshare loads, move the sitemap to the current highlighted page. (Only works on initial load)</span>'
		+ ' </p>';






		$(document).ready(function (e) {

			// whether to use ajax to do multiple screenshots
			var ajaxMultiple = false;

			// Axure version (equals either 8 or 9)
			var axureVersion = 8;

			if ($('#topPanel').length > 0) {
				axureVersion = 9;
			}

			// are there adaptive views on this page?
			var adaptiveViewsActive = false;

			// pattern we'll use to get the adaptive info from the dropdown
			var adaptiveViewRegex = /\(([0-9]*) \x ([a-z,0-9]*)/;

			// what the iframe link is.
			// We'll use this to check if the iframe is completed loading a new page or not.
			var iframeLink = "";

			// Axure 8 only, 
			// Default size for "Base"
			var ax8_baseSizes = {width: 375, height: 667};

			// User settings set in chrome
			var defaultSettings = {
				fullpage: false,
				waitTime: 200,
				useVarsInFilename: false,
				adaptiveView: {width: "default", height: "default"},
				scrollToPage: true,
				ax8_baseSizes: ax8_baseSizes,
				customSize: {width: 375, height: 667}
			}

			var settings = defaultSettings;

			function syncSettings () {
				chrome.storage.sync.set({ ScreenshootSettings : settings });
				// console.log("settings synced", settings);
			}


			function toggleDropdownCheckboxes(el) {
				var settingName;
				var checked;

				if (axureVersion >= 9) {
					settingName = $(el).attr('data-settingId');
					checked = ($(el).hasClass('selected'));
				} else {
					settingName = $(el).parent().attr('data-settingId');
					checked = (!$(el).prop('checked'));
				}

				// console.log("settingName", settingName);
				if ( checked ) {
					// selected, turn off
					if (axureVersion >= 9) {
						$(el).removeClass('selected');
					} else {
						$(el).prop('checked', '');
					}
					settings[settingName] = false;
				} else {
					// not selected, turn on
					if (axureVersion >= 9) {
						$(el).addClass('selected');
					} else {
						$(el).prop('checked', 'checked');
					}
					settings[settingName] = true;
				}
				syncSettings();
			}

			function changeSelectedSize(){
				var width = $('#screenshoot-setting-adaptiveview').find(":selected").attr('data-width');
				var height = $('#screenshoot-setting-adaptiveview').find(":selected").attr('data-height');

				// console.log("new width", width);

				// update button
				$('#screenshoot-button .viewport-name').text( width+"x"+height );

				// and update the sync settings
				settings.adaptiveView = {width: width, height: height};
				syncSettings();
			}



			function render() {
				/* 
					Render once we have our chrome settings
					So, if something is set true, mark the checkbox
					If there is a value, make sure the value is in put in
					This runs after we get the data back from chrome
					and we sync our object to those settings
				*/

				/* Build Tool */


				// console.log("settings", settings);


				if (axureVersion >= 9) {
					/* AXURE 9 */
					$('#screenshoot-toolbar-button, #screenshoot-settings').remove();

					$('#inspectControlFrameHeader').append('<li id="screenshoot-toolbar-button">'
						+ '	<a pluginid="screenshoot" title="Screenshot this page" id="screenshoot-button" class="ax9" style="display: none;"><span class="viewport-name"></span><span class="screenamount"></span></a>'
						+ '</li>');

					// Add our icon
					var imgURL = chrome.extension.getURL("images/export_16.png");
					$('#screenshoot-button').css({'background-image': "url("+imgURL+")"});

					// add settings to the "..." dropdown
					$('#interfaceScaleListContainer').after('<div id="screenshoot-settings" class="ax9"></div>');
					$('#screenshoot-settings').append(settingsHtml);


					

					/** LISTENERS **/

					// add click listeners for checkboxes
					$('.showOption.withCheckbox').click(function (e) {
						toggleDropdownCheckboxes($(e.currentTarget).find('.overflowOptionCheckbox'));
					});



				} else {
					/* AXURE 8 */

					// $('body').append('<div style="position:fixed; top:0; right:0;"><a href="'+secretLink+'">TEST</a></div>');

					$('#screenshoot_container').remove();

					$('#sitemapToolbar').after('<div id="screenshoot_container" class="ax8">'
						+ '	<div id="screenshoot-buttons">'
						+ '		<button id="screenshoot-button" style="display: none;"><i id="screenshoot-button-icon"></i> <span class="directive">Screenshot at</span> <span class="viewport-name"></span></button>'
						+ '		<button id="screenshoot-toggle-settings"><i id="screenshoot-toggle-settings-icon"></i></button>'
						+ '	</div>'
						+ '	<div id="screenshoot-settings" class="ax8">'
						+ 	settingsHtml
						+ '	</div>'
						+ '</div>');

					// Add our icons
					var ssIcon = chrome.extension.getURL("images/export_16.png");
					$('#screenshoot-button-icon').css({'background-image': "url("+ssIcon+")"});
					var ssGearIcon = chrome.extension.getURL("images/screenshot-gear-icon.svg");
					$('#screenshoot-toggle-settings-icon').css({'background-image': "url("+ssGearIcon+")"});



					// update setting for scrollToPage
					if (settings.scrollToPage) {
						$('#screenshoot-checkbox-scrollToPage').prop('checked', 'checked');
					} else {
						$('#screenshoot-checkbox-scrollToPage').prop('checked', false);
					}

					// move the searchbox into the main header
					$("#searchDiv").appendTo('#sitemapHeader');

					// listen for settings checkbox changes
					$('#screenshoot-settings input[type="checkbox"]').change(function (e) {
						toggleDropdownCheckboxes($(e.currentTarget));
					});


					// scroll to current page (just for fun)
					if ($('.sitemapHighlight').length > 0 && settings.scrollToPage) {
						// console.log("scrollToPage");

						// visual height of the box and current scrollTop
						var containerHeight = $('#sitemapTreeContainer').height();
						var containerScrollTop = $('#sitemapTreeContainer').scrollTop();

						// last current page
						var $lastPage = $('.sitemapNode.startScrollPage');
						// current page
						var $currentPage = $('.sitemapHighlight').parent();

						// where is the current page
						var pageOffset = $currentPage.offset().top;
						var targetScrollTop = pageOffset - 325;

						// do we even need to scroll?
						if ((targetScrollTop > (containerHeight - 250))) {
							// console.log("need to scroll because of 1", targetScrollTop, containerHeight - 250);
						}
						if (targetScrollTop < 210) {
							// console.log("need to scroll because of 2", targetScrollTop);
						}

						// only do it on the first one
						if ($lastPage.length == 0) {
							// if ((targetScrollTop > (containerHeight - 250)) )
							// if (targetScrollTop < 210 )

							// set to hidden so we get absolute scrollTop values.
							$('#sitemapTreeContainer').scrollTop(0)
							// $('#sitemapTreeContainer').css('overflow', 'hidden');


							// console.log("targetScrollTop", targetScrollTop );

							$('#sitemapTreeContainer').scrollTop( targetScrollTop ); //-160

							// $('#sitemapTreeContainer').css('overflow', 'auto');
							$currentPage.addClass('startScrollPage');
						}

					} else {
						if (settings.scrollToPage) {
							console.log("Current page not found in sitemap (Adjust publish settings!)");
						} else {
							// console.log("scrollToPage off");
						}

					}



					// Add listener to settings toggle
					$('#screenshoot-toggle-settings').click(function (e) {
						$('#screenshoot-settings').toggle();
					});


				}	

				// Prototype Password

				// if (liveAxshare) {
				// 	$('#screenshoot-settings').append('	<p class="showOption withText">'
				// 	+ '		<span class="label">Prototype password</span><br />'
				// 	+ '		<input type="password" class="" id="screenshoot-setting-prototypePassword" placeholder="Prototype password" value="" data-settingId="prototypePassword" />'
				// 	+ ' </p>');
				// }



				// add change listener to waitTime
				$('#screenshoot-setting-waittime').on('blur', function (e) {
					var val = $(e.currentTarget).val();
					settings.waitTime = val;
					syncSettings();
					$(e.currentTarget).off('keydown', waitTimeKeyboardListener);
				});

					function waitTimeKeyboardListener(e) {
						if (e.keyCode == 13) {
							$(e.currentTarget).blur();
						}
					}

					// add change listener to waitTime
					$('#screenshoot-setting-waittime').on('focus', function (e) {
						$(e.currentTarget).on('keydown', waitTimeKeyboardListener);
					});


				// Do we have adaptive views?
				adaptiveViewsActive = false;
				if ($('.adaptiveViewOption').length > 0) {
					if (axureVersion >= 9) {
						if ($('#interfaceAdaptiveViewsContainer').css('display') == "block") {
							adaptiveViewsActive = true;
						}
					} else {
						// Axure 8
						if ($('#adaptiveButton').length > 0) {
							adaptiveViewsActive = true;
						}
						
					}
				}

				// console.log("adaptive views?", adaptiveViewsActive);

				// update setting for full page
				if (settings.fullpage) {
					if (axureVersion >= 9) {
						// Axure 9
						$('#screenshoot-setting-fullpage').addClass('selected');
					} else {
						// Axure 8
						$('#screenshoot-checkbox-fullpage').prop('checked', 'checked');
					}
				}

				// update setting for Global Vars
				if (settings.useVarsInFilename) {
					if (axureVersion >= 9) {
						$('#screenshoot-setting-useVarsInFilename').addClass('selected');
					} else {
						// Axure 8
						$('#screenshoot-checkbox-useGlobalVars').prop('checked', 'checked');
					}
				}

				// show waitTime
				if (settings.waitTime) {
					$('#screenshoot-setting-waittime').val( settings.waitTime );
				}

				// Show adaptive view setting if there are adaptive views
				if (adaptiveViewsActive) {

					// grab all the views that aren't the default one
					var adaptiveViewWidths = [];
					var selectedSize;
					$('.adaptiveViewOption:not([val="auto"])').each( function (i, obj) {
						// grab the adaptive view text
						var text = $(obj).text();

						// grab the "val" which we'll check default from
						var val = $(obj).attr('val');

						// viewport width and height
						var width;
						var height;
						var base = "";

						if (val == "default" && (text.indexOf("Base") > -1)) {	
							// archive ()
							// base view, no height given
							base = " (Base)";
							if (settings.ax8_baseSizes) {
								width = settings.ax8_baseSizes.width;
								height = settings.ax8_baseSizes.height;
							} else {
								width = ax8_baseSizes.width;
								height = ax8_baseSizes.height;
							}
						} else {
							// Grab the widths from the text object
							var found = text.match(adaptiveViewRegex);
							width = found[1];
							height = found[2];
						}

						// see if we already have this width and height combo
						if ($('#screenshoot-setting-adaptiveview option[data-width="'+width+'"][data-height="'+height+'"]').length > 0) {
							return;
						}

						// Is this viewport selected for the user to screenshot with?
						// We defer to the settings but if not, we use the default view
						// to set the height

						var selected = "";

						// no chrome setting (and default?)
						if (settings.adaptiveView.width == "default" && val == "default") {
							// select the default object as the selected option
							selected = " selected";

							// and update the sync settings
							settings.adaptiveView = {width: width, height: height};
							syncSettings();

							// update the button
							$('#screenshoot-button .viewport-name').text( width+"x"+height );

							// set the selected size
							selectedSize = {width: width, height: height};

						} else if (width == settings.adaptiveView.width && height == settings.adaptiveView.height) {
							selected = " selected";

							// update the button
							$('#screenshoot-button .viewport-name').text( width+"x"+height );


							// set the selected size 
							selectedSize = {width: width, height: height};

						}

						// add that text to the array.
						adaptiveViewWidths.push({width: width, height: height});
						// add an option to the dropdown
						$('#screenshoot-setting-adaptiveview').append('<option value="'+width+'x'+height+'"'+selected+' data-width="'+width+'" data-height="'+height+'">'+width+' x '+height+base+'</option>');
					});

					// add listener to the adaptive dropdown
					$('#screenshoot-setting-adaptiveview').on('change', function (e) {
						changeSelectedSize();
					});



					// check if none are selected (probably switched projects)
					if (selectedSize == undefined) {
						// no adaptive views are selected, probably switched projects
						// or adaptive views changed and the selected one no longer exists. 
						// Go back to the default
						$('#screenshoot-setting-adaptiveview').trigger('change');
					}
				}

				// Add the custom size
				$('#screenshoot-setting-adaptiveview').append('<option value="custom">Custom size ()</option>');
				// if (settings.customSize == undefined || settings.customSize.width || settings.customSize.height == undefined ) {
				// 	console.log("undefined");
				// 	settings.customSize = {width: 375, height: 667};
				// }
				$('#screenshoot-setting-customWidth').val(settings.customSize.width);
				$('#screenshoot-setting-customHeight').val(settings.customSize.height);
				updateCustomSize();

				function updateCustomSize() {
					settings.customSize.width = $('#screenshoot-setting-customWidth').val();
					settings.customSize.height = $('#screenshoot-setting-customHeight').val();
					$('#screenshoot-setting-adaptiveview option[value="custom"]').attr('data-width', settings.customSize.width).attr('data-height', settings.customSize.height).text('Custom Size ('+settings.customSize.width+'x'+settings.customSize.height+')');
					changeSelectedSize();
				}
				$('#screenshoot-setting-customWidth, #screenshoot-setting-customHeight').blur(function (e) {
					updateCustomSize();
				});


				// show the button now that we're all linked up.
				$('#screenshoot-button').show();
				console.log("show the button");

				// add listener to screenshot button
				$('#screenshoot-button').click(function (e) {
					takeScreenshot(e);
				});

				// update iframe link to new page
				iframeLink = document.getElementById('mainFrame').contentWindow.location.href;

			} // end render


			// Get values from Chrome and render
			chrome.storage.sync.get('ScreenshootSettings', function(data) {
				// console.log("data", data);
			    if (data.ScreenshootSettings) {
			    	settings = data.ScreenshootSettings;

			    	// set up default values
			    	if (!settings.fullPage) { settings.fullPage = defaultSettings.fullPage; }
			    	if (!settings.waitTime) { settings.waitTime = defaultSettings.waitTime; }
			    	if (!settings.useVarsInFilename) { settings.useVarsInFilename = defaultSettings.useVarsInFilename; }
			    	if (!settings.adaptiveView) { settings.adaptiveView = defaultSettings.adaptiveView; }
			    	if (!settings.scrollToPage) { settings.scrollToPage = defaultSettings.scrollToPage; }
			    	if (!settings.ax8_baseSizes) { settings.ax8_baseSizes = defaultSettings.ax8_baseSizes; }
			    	if (!settings.customSize) { settings.customSize = defaultSettings.customSize; }

			    	// console.log("settings", settings);

			    } else {
			    	// let's set the intial settings
			    	syncSettings();
			    }


			    // update the dom now that we have the settings
			    render();

			});

			// $(window).on('hashchange', function() {
			// 	console.log("hashchange");
			// 	render();
			// });
			var loadTimes = 0;
			$('#mainFrame').on('load', function (e) {
				function checkIframeLoaded () {
					if (document.getElementById('mainFrame') && iframeLink != document.getElementById('mainFrame').contentWindow.location.href || loadTimes > 12) {
						// not the same
						// console.log("loaded");
						loadTimes = 0;
						clearInterval(checkIframeLoadStatus);
						render();
					} else {
						loadTimes++;
						// console.log("not loaded "+loadTimes);
					}
				}
				$('#screenshoot-button').hide();

				var checkIframeLoadStatus = setInterval(checkIframeLoaded, 250);
			});



			/* Individual Page Checkboxes */

			// pages
			$('.sitemapNode .sitemapPageLinkContainer').each(function (i, leafNode) {
				$('.sitemapPageLink', leafNode).before('<input type="checkbox" value="'+ $(leafNode).find('.sitemapPageLink').attr('nodeurl') +'" class="selectNode" />');
			});

			// expandable section pages
			// $('.sitemapNode.sitemapExpandableNode .sitemapPageLinkContainer').each(function (i, leafNode) {
			// 	$(leafNode).prepend('<input type="checkbox" value="'+ $(leafNode).find('.sitemapPageLink').attr('nodeurl') +'" class="selectNode" />');
			// })


			// Page checkbox checked. Now we're in multiple land
			// using mousedown because that's what the sitemapPageContainer listens for so we can stop propagation
			$('.selectNode').on('mousedown', function (e) {
				e.stopPropagation();
			});

			$('.selectNode').on('click', function (e) {
				var checked = $('.selectNode:checked');
				// e.currentTarget

				if (checked.length > 0) {
					if (axureVersion >= 9) {
						$('#screenshoot-button .screenamount').text('('+checked.length+') ');
					} else {
						// axure 8
						$('#screenshoot-button .directive').text('Screenshot ('+checked.length+') at');
					}
				} else {
					// reset the text
					if (axureVersion >= 9) {
						$('#screenshoot-button .screenamount').text('');
					} else {
						// axure 8
						$('#screenshoot_container .directive').text('Screenshot at');
					}
					
				}


				e.stopPropagation();
				// return false;
			});


			function takeScreenshot(e) {
				// get filename
				// get secret link

				/* Multiple Screenshots? */
				var checked = $('.selectNode:checked');

				// fullpage?
				var fullpage = false;
				if (axureVersion >= 9) {
					// Axure 9
					fullpage = ($('#screenshoot-setting-fullpage').hasClass('selected'));
				} else {
					// Axure 8
					fullpage = document.getElementById('screenshoot-checkbox-fullpage').checked;
				}

				// waitTime
				var waitTime = $('#screenshoot-setting-waittime').val();


				var checkedNodes = [];
				var href = "http://localhost:3000";

				if (checked.length >= 1) {
					// Multiple

					// set up the link
					// add this url as the preview page url
					var previewPageUrl = window.location.href;
					href += '/multiple?purl='+ previewPageUrl.replace("#", "&");


					checked.each(function (i, checkbox) {
						// checkedNodes.push( $(checkbox).val() );
						href += '&nodes='+$(checkbox).val();
					});

				} else {
					// Single

					var frame;
					// two frames?
					if ($('#secondFrame').length > 0) {
						frame = document.getElementById('secondFrame');
					} else {
						frame = document.getElementById('mainFrame');
					}

					// get global variables
					var frameUrl = frame.contentWindow.location.href;
					var globalVars = "";
					var parts = frameUrl.split("#");
					// console.log(frameUrl);
					// console.log(parts);
					if (parts.length > 1) {
						// we have some global variables
						globalVars = parts[1];
					}


					// get secret link 
					// this is the unique static page that is just the screen
					if (axureVersion >= 9) {}
					// var secretLink =  document.getElementById("sitemapLinkWithPlayer").value;
					var secretLink  = frameUrl;
					if (secretLink.indexOf("#") > -1) {
						secretLink = secretLink.split("#")[0];
					}

					// get filename
					var filename;
					if (document.getElementsByClassName('sitemapHighlight').length > 0) {
						filename = document.getElementsByClassName('sitemapHighlight')[0].getElementsByClassName('sitemapPageName')[0].innerHTML;
					}

					// construct the base url and add on the global variables from above.
					href += "/?page="+secretLink;

					if (globalVars) {
						href = href + "&globalVars="+encodeURIComponent(globalVars);
					}

					if (filename) {
						href = href+"&filename="+filename;
					}


				}

				/* Adaptive stuff */
				// Send over adaptive view info
				href = href + "&viewport_width="+settings.adaptiveView.width+"&viewport_height="+settings.adaptiveView.height;

				// Axure version, because why not
				href = href+"&axv="+axureVersion;

				// Fullpage
				if (fullpage) {
					href = href+"&fullpage=true";
				} else {
					href = href+"&fullpage=false";
				}

				// Wait Time
				if (waitTime != "") {
					href = href+"&wait="+waitTime;
				}

				// Global vars on filename?
				href += "&useVarsInFilename="+settings.useVarsInFilename;

				// prototype password
				href += "&prototypePassword=";



				// console.log("href", href);


				// create link, click it, and remove it.
				$('body').append('<a href="'+href+'" target="_blank" style="display:none;" id="gotoscreenshot"></a>');
				document.getElementById('gotoscreenshot').click();
				$('#gotoscreenshot').remove();
				
			}



		}); // end document ready




	}
	}, 10);
});

/*

TODO:

Content editable text:
$('.text span').prop('contenteditable', true);

*/