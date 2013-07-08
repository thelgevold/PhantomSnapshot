/*
The MIT License (MIT)

Copyright (c) 2013 Torgeir Helgevold

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

var server = require('webserver').create();

var args = require('system').args;
if (args.length !== 2) {
    console.log('Please provide a valid server url (including port) ex: 127.0.0.1:8080');
    phantom.exit();
}

var serverUrl = args[1];

var fileId = new Number(0);;

function parsePostParameters(postCollection) {
    var post = 
    {
        format: postCollection["format"] || null,
        url: postCollection["url"] || null,
    };

    post.IsPdf = function () {
        if (post.format === "pdf") {
            return true;
        }
        return false;
    };

    post.IsImage = function () {
        if (post.format === "png" || post.format === "jpeg") {
            return true;
        }
        return false;
    };

    return post;
}

function createTempFileName() {
    fileId++;
    return "tempFile" + fileId + (new Date()).getTime() + ".pdf";
}

function exportFromUrl(response, post) {
    var page = require('webpage').create();
    page.open(post.url, function (status) {

        console.log(status);

        if (status == "fail") {
            response.headers = {
                'Cache': 'no-cache',
                'Content-Type': 'text/plain',
            };

            response.statusCode = 400;
            response.write("Error");
            response.close();
        }

        if (post.IsImage() === true) {
            var content = page.renderBase64(post.format);
            response.write(content);

            response.statusCode = 200;
            response.close();
        }

        else if (post.IsPdf() === true) {

            var tempFileName = createTempFileName();

            page.render(tempFileName);

            var fs = require('fs');

            var pdfStream = fs.open(tempFileName, 'rb')
            var pdfContent = pdfStream.read();

            response.headers = {
                'Cache': 'no-cache',
                'Content-Type': 'application/pdf'
            };

            response.setEncoding("binary");
            response.write(pdfContent);

            pdfStream.close();
            fs.remove(tempFileName);

            response.statusCode = 200;
            response.close();
        }
    });
}

console.log("Starting export server @ " + serverUrl);

var service = server.listen(serverUrl, function (request, response) {
    
    var post = parsePostParameters(request.post);
    
    exportFromUrl(response, post);
    
 });