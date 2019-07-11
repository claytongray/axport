var express = require("express");
// var cors = require('cors');
var app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// const cors = (req, res, next) => {

//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
//     res.header("Access-Control-Allow-Headers", "Origin, Content-Type");

//     next();
// };


// app.use(cors);
// app.use(express.json());

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

let viewport_sizing_device_size = {
    "mobile": { width: 375, height: 667 },
    "desktop": { width: 1024, height: 768 },
    "desktop_big": { width: 1440, height: 768 }
};

async function screenshot_a_link(secretLink, filename, res, viewports, fullPage, waitTime) {
  console.log("screenshot_a_link");
  console.log(secretLink);
  var timerStart = Date.now();

  var viewport_sizing = viewport_sizing_device_size;


    let browser = await puppeteer.launch({ headless: true });
   
    for (let i = 0; i < viewports.length; i++) {
        var page2 = await browser.newPage();

        // "mobile", "desktop", "desktop_big"
        var viewportName = viewports[i];

        console.log("height",  viewport_sizing[ viewportName ].height);

        // set the viewport based on which viewport we're doing now.
        await page2.setViewport( viewport_sizing[ viewportName ] );

        // we can emulate phone, but has retina screens which makes things blurry.
        // await page2.emulate(iPhone8);

        try {

            await page2.goto(secretLink)

            console.log("waitTime", waitTime);

            await page2.waitForSelector('body');
            // await page2.waitForNavigation('domcontentloaded');

            await page2.waitFor(Number(waitTime));

            console.log("are we doing a full page?", fullPage);

            /* True Full Page
            
                Since some page behave oddly when you resize them, we have to create a perfectly sized page first
                1. So we load the page, let the DOM load, find out the document height.
                2. Then reload with the document height set. 
                This ensures the page loads without any need for resizing.

            */

            if (fullPage) {

                // get document height, we'll use that for the reload.

                var documentHeight = await page2.evaluate(() => {
                   return document.documentElement.scrollHeight; 
                });

                var newHeight = documentHeight;

                console.log(" viewport_sizing[ viewportName ]",  viewport_sizing[ viewportName ]);
                console.log(" new height",  newHeight);

                // Set the new viewport based on that. 

                await page2.setViewport( { width: viewport_sizing[ viewportName ].width, height: newHeight} );

                // Reload
                await page2.reload(secretLink);

                // Wait
                await page2.waitForSelector('body');
                await page2.waitFor(Number(waitTime));

            }


            var folder;
            
            if (viewportName == "mobile") {
                folder = "mobile/";
            }
            
            if (viewportName == "desktop") {
                folder = "desktop/";
            }
            
            if (viewportName == "desktop_big") {
                folder = "desktop_big/";
            }

            // await page2.waitForNavigation({ waitUntil: 'load' });
            await page2.screenshot({ path: 'public/screenshots/'+folder+filename+'.png', fullPage: fullPage });
        }


        catch (error) {

            let generationTime = await (Date.now()-timerStart) / 1000;

            res.render("error", {error: error, page: secretLink, filename: filename+'.png', time: generationTime, fullPage: fullPage});
        }

        // // create better image title based on title

        // await page.screenshot({ path: './image2.png', fullPage: true });
        await page2.close();
    }

    
    await browser.close();

    // await res.json({"success":"success", "page": secretLink, "filename": filename+'.png'});

    let generationTime = await (Date.now()-timerStart) / 1000;

    await res.render("success", {page: secretLink, filename: filename+'.png', time: generationTime, totalShots: viewports.length, viewports: viewports, fullPage: fullPage});
}

var toTitleCase = function (str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
        str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
};
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

app.get("/", (req, res, next) => {

	// var response = {'response':'nothing', page: req.query.page};
	var page = req.query.page;
    var globalVars = req.query.globalVars;
    var mobile = req.query.viewport_mobile || true;
    var desktop = req.query.viewport_desktop || false;
    var desktop_big = req.query.viewport_desktop_big || false;
    var multiple = req.query.multiple || false;
    var waitTime = req.query.wait || 1000;

    // tack on the global variables
    page = page+"#"+globalVars;

    // fullpage default
    var fullPage = true;

    if (req.query.fullpage == "false") {
        fullPage = false;
    }

    var filename;

    // var viewports = {
    //     mobile: mobile,
    //     desktop: desktop,
    //     desktop_big: desktop_big
    // }

    // gather the viewports we're doing. (most likely just 1, mobile)
    var viewports = [];
    if (mobile != "false") { viewports.push('mobile'); }
    if (desktop) { viewports.push('desktop'); }
    if (desktop_big) { viewports.push('desktop_big'); }

    console.log(viewports);

    // if (multiple) {

    // } else {

    // }

    if (req.query.filename && req.query.filename != "") {
        filename = decodeURIComponent((req.query.filename + '').replace(/\+/g, '%20'));
    } else {
        // try to make a better looking filename
        filename = req.query.page.match(/([^\/]+)(?=\.\w+$)/gm).toString();
        filename = replaceAll(filename, "_", " ");
        filename = toTitleCase(filename);
    }

	
    // res.json({mobile: mobile, desktop: desktop, desktop_big: desktop_big, page: page, filename: filename+'.png'});


	screenshot_a_link(page, filename, res, viewports, fullPage, waitTime);

    // res.send("test");

});

app.post("/multiple", (req, res, next) => {

    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type");

    // var fs = require("fs");

    // fs.readFile("temp.txt", function(err, buf) {
    //   console.log(buf.toString());
    // });
    console.log(req.body);

    res.send(req.body);


});

app.get("/multiple", (req, res, next) => {
    
    res.render("success_multiple", {});

});

// app.get("/:page", (req, res, next) => {
//  res.json({
//      page: req.params['page']
//  }); 

// });

app.listen(3000, () => {
 console.log("Server running on port 3000");
});
