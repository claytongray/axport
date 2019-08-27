var bodyParser = require('body-parser');
var express = require("express");
// var cors = require('cors');

var app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());




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

// let viewport_sizing_device_size = {
//     "mobile": { width: 375, height: 667 },
//     "desktop": { width: 1024, height: 768 },
//     "desktop_big": { width: 1440, height: 768 }
// };

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

async function screenshot_a_link(options) {
    var secretLink = options.page;
    var filename = options.filename;
    var viewport = options.viewport;
    var fullPage = options.fullPage;
    var waitTime = options.waitTime;
    var prototypePassword = options.prototypePassword;

    console.log("screenshot_a_link");
    console.log(secretLink);
    var timerStart = Date.now();

    // just allowing for 1 viewport, but keeping the logic for multiple for future iterations
    var viewports = [viewport];

    // launch the browser.
    let browser = await puppeteer.launch({ headless: true });
   
    // cycle through all viewports
    for (let i = 0; i < viewports.length; i++) {

        var vp = viewports[i];
        vp.width = Number(vp.width);

        // new tab
        var page2 = await browser.newPage();


        console.log("selected viewport, vp: ", vp);

        // set the viewport based on which viewport we're doing now.
        await page2.setViewport( vp );

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

                // console.log(" viewport_sizing[ viewportName ]",  viewport_sizing[ viewportName ]);
                console.log(" new height",  newHeight);

                // Set the new viewport based on that. 

                await page2.setViewport( { width: vp.width, height: newHeight} );

                // Reload
                await page2.reload(secretLink);

                // Wait
                await page2.waitForSelector('body');
                await page2.waitFor(Number(waitTime));

                // update the viewport object for the new height
                viewports[i].height = newHeight;

            }


            // var folder;
            
            // if (viewportName == "mobile") {
            //     folder = "mobile/";
            // }
            
            // if (viewportName == "desktop") {
            //     folder = "desktop/";
            // }
            
            // if (viewportName == "desktop_big") {
            //     folder = "desktop_big/";
            // }

            // await page2.waitForNavigation({ waitUntil: 'load' });
            await page2.screenshot({ path: 'public/screenshots/'+filename+'.png', fullPage: fullPage });
        }


        catch (error) {

            let generationTime = await (Date.now()-timerStart) / 1000;

            return {
                status: "error", 
                error: error, 
                page: secretLink, 
                filename: filename+'.png', 
                time: generationTime, 
                fullPage: fullPage
            };
        }

        // // create better image title based on title

        // await page.screenshot({ path: './image2.png', fullPage: true });
        await page2.close();
    }

    
    await browser.close();

    // await res.json({"success":"success", "page": secretLink, "filename": filename+'.png'});

    let generationTime = await (Date.now()-timerStart) / 1000;

    return {
        status: "success", 
        page: secretLink, 
        filename: filename+'.png', 
        time: generationTime, 
        totalShots: 1, 
        viewports: viewports, 
        fullPage: fullPage
    }
}

async function screenshot_multiple(options) {
    var previewUrl = options.previewUrl;
    var nodes = options.nodes;
    var viewports = options.viewports;
    var fullPage = options.fullPage;
    var waitTime = options.waitTime;
    var prototypePassword = options.prototypePassword;
    var res = options.res;

    var timerStart = Date.now();

    // array of page secret links
    var secretLinks = [];

    // let's gather all the secret links

    // we'll load the basic preview page with the left panel
    // then: 
        // let it load, grab the secret link

    let browser = await puppeteer.launch({ headless: true });
    let previewPage = await browser.newPage();
    await previewPage.goto(previewUrl);
    await previewPage.waitForSelector('body');


    // check to see if we're on public and asking for password
    var documentTitle = await previewPage.evaluate(() => {
       return document.title; 
    });

    // password protected?
    if (documentTitle.toLowerCase().indexOf("prototype password") > -1) {
        console.log("password protected");
        // password protected
        // take the first input, add the password and submit.
        try {
            await previewPage.evaluate((password) => { 
                document.querySelector('input[type="text"]').value = password; 
                document.querySelector('div[data-label="Login"]').click();
            }, prototypePassword);
        }
        catch (error) {
            let generationTime = await (Date.now()-timerStart) / 1000;

            return {
                status: "error", 
                error: error, 
                page: nodeUrl, 
                filename: nodeUrl, 
                time: generationTime, 
                fullPage: fullPage
            };
        }

    }

    // the frame our pages will load into. 
    const frame = previewPage.frames().find(fr => fr.name() === 'mainFrame');
     
    for (let i = 0; i < nodes.length; i++) {
        var nodeUrl = nodes[i];

        // find the sitemapPageLink with the nodeurl of the node we're looping through
        console.log("try to click " + nodeUrl);
        try {
            await previewPage.evaluate((nodeUrl) => { document.querySelector('.sitemapPageLink[nodeurl="'+nodeUrl+'"]').click(); }, nodeUrl);
        } 
        catch (error) {
            let generationTime = await (Date.now()-timerStart) / 1000;

            return {
                status: "error", 
                error: error, 
                page: nodeUrl, 
                filename: nodeUrl, 
                time: generationTime, 
                fullPage: fullPage
            };
        }
        await previewPage.waitFor(1000);
            // await link.click();
        await frame.waitForSelector('body');
        // await frame.waitForNavigation();

        var secretLink = await previewPage.evaluate(() => {
           return document.getElementById('mainFrame').contentWindow.location.href;
        });

        var filename = await previewPage.evaluate( () => {
            return document.getElementsByClassName('sitemapHighlight')[0].getElementsByClassName('sitemapPageName')[0].innerHTML.replace("&amp;", "&");
        });

        await secretLinks.push({secretLink: secretLink, filename: filename});

    }

    await previewPage.close();
    await browser.close();

    console.log("secretLinks", secretLinks);
    var images = [];

    // now that we have the secret links, let's screenshot each one.
    for (var i=0; secretLinks.length > i; i++) {
        var screenshotResponse = await screenshot_a_link(secretLinks[i].secretLink, secretLinks[i].filename, viewports, fullPage, waitTime);
        await images.push( {folder: viewports[0], filename: screenshotResponse.filename} );
    }

    console.log("successfully generated "+images.length+" images");

    let generationTime = await (Date.now()-timerStart) / 1000;

    return {status: "success", page:previewUrl, images: images, totalShots: images.length, time: generationTime, viewport: viewports[0], fullPage: fullPage};
}

app.get("/", (req, res, next) => {

	// var response = {'response':'nothing', page: req.query.page};
	var page = req.query.page;
    var globalVars = req.query.globalVars;
    var width = req.query.viewport_width
    var height = req.query.viewport_height;
    var waitTime = req.query.wait || 1000;
    var useVarsInFilename = req.query.useVarsInFilename;
    var prototypePassword = req.query.prototypePassword || "";
    var filename;

    // create the viewport object



    // tack on the global variables
    if (globalVars) {
        page = page+"#"+globalVars;
    }

    // fullpage default
    var fullPage = true;
    if (req.query.fullpage == "false") {
        fullPage = false;
    }

    // In case height isn't set up
    if (height == "any") {
        height = 667;
        fullPage = true;
    }
    if (height == undefined) {
        vp.height = 667;
        fullPage = true;
    }

    // Type cast as numbers and create viewport object
    var viewport = {width: Number(width),height: Number(height)};

    if (req.query.filename && req.query.filename != "") {
        filename = decodeURIComponent((req.query.filename + '').replace(/\+/g, '%20'));
    } else {
        // try to make a better looking filename
        filename = req.query.page.match(/([^\/]+)(?=\.\w+$)/gm).toString();
        filename = replaceAll(filename, "_", " ");
        filename = toTitleCase(filename);
    }

    // add viewport prefix to filename
    filename = viewport.width+"-"+filename;

    // add global vars to filename
    if (globalVars && useVarsInFilename) {
        var filenameVars = globalVars.replace("&CSUM=1", "").replace("=", "-");
        filename += " - " + filenameVars;
    }

    var options = {
        page : page,
        filename: filename,
        viewport: viewport,
        globalVars : globalVars,
        waitTime : waitTime,
        prototypePassword: prototypePassword,
        res: res,
        fullPage: fullPage
    }

    handleScreenshot(options);
});

async function handleScreenshot (options) {
    var screenshotResponse = await screenshot_a_link(options);
    if (screenshotResponse.status == "success") {
        console.log("success", screenshotResponse);
        await options.res.render("success", screenshotResponse);
    } else if (screenshotResponse.status == "error") {
        await options.res.render("error", screenshotResponse);
    }
}

async function handleMultiple (options) {

    var viewports = ['mobile'];

    var screenshotResponse = await screenshot_multiple(options);

    if (screenshotResponse.status == "success") {
        console.log("screenshotResponse", screenshotResponse);
        // await res.render("success_multiple", screenshotResponse);

        // send back response
        // var response = {
        //     status  : 200,
        //     success : 'Updated Successfully',
        //     images: screenshotResponse.images
        // }

        // res.end(JSON.stringify(response));

        res.render("success_multiple", screenshotResponse);

    } else if (screenshotResponse.status == "error") {
        // res.render("error", screenshotResponse);
        // send back response
        var response = {
            status  : 500,
            message : 'Something went wrong'
        }

        res.end(JSON.stringify(response));
    }
}

app.get("/multiple", (req, res, next) => {

    var nodes = req.query.nodes;
    var previewUrl = req.query.purl;
    var mobile = req.query.viewport_mobile || true;
    var desktop = req.query.viewport_desktop || false;
    var desktop_big = req.query.viewport_desktop_big || false;
    var waitTime = req.query.wait || 1000;

    var viewports = ['mobile'];

    // fullpage default
    var fullPage = true;
    if (req.query.fullpage == "false") {
        fullPage = false;
    }
    // console.log("req", req);
    var url_string = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(url_string);
    var url = new URL(url_string);
    nodes = url.searchParams.getAll("nodes");
    // console.log(options);


    console.log("nodes", nodes);

    var options = {
        previewUrl : previewUrl,
        nodes : nodes, 
        viewports : viewports, 
        fullPage : fullPage, 
        waitTime : waitTime, 
        prototypePassword : prototypePassword, 
        res : res
    }

    handleMultiple(options);
    

});

// app.get("/:page", (req, res, next) => {
//  res.json({
//      page: req.params['page']
//  }); 

// });

app.listen(3000, () => {
 console.log("Server running on port 3000");
});
