// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/*
 * Dr.js 0.0.10 - Simple JavaScript Documentation
 *
 * Author: Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 */
var fs = require("fs"),
    path = require("path"),
    docit = require("./doc.js"),
    format = require("./formatter.js"),
    _ref = require("child_process"),
    // spawn = _ref.spawn,
    exec = _ref.exec;

function getPath(filepath) {
    return "docs/" + path.basename(filepath, path.extname(filepath));
}
function ss(num) {
    return num == 1 ? "" : "s";
}
/*\
 * Overview
 * This is JavaScript tool for creating documentation for your JavaScript files.
 * It’s written in nodejs and very easy to use:
 *
 * `node dr.js <custom>.json`
 *
 * Format of custom.json is as follows:
 | {
 |     "title": "MyProject",
 |     "output": "path/to/final/doc.html",
 |     "scripts": ["jquery.js"], // optional scripts to include into final doc
 |     "files": [{
 |         "url": "path/to/file.js",
 |         "link": "https://github.com/optional/link/to/file.js"
 |     }]
 | }
 * Script runs over given files in search for special format of comments
 > Comments format
 * Each comment section starts with the following line:
 | /*\
 * And ends with this one:
 | \&#x2a;/
 * Each line in a comment block is starting with a symbol that represents type of the line.
 *
 * “`*`” means plain text with markdown support
 *
 * “`|`” means line of JavaScript code
 *
 * “`-`” means parameter description
 *
 * “`>`” means sub header
 * 
 * “`o`” means object description
 *
 * “`#`” means HTML. Following text will be taken as is and put into resulting
 * document without any changes
 *
 * First line is always a name of a section. Dr.js will analise the names and
 * build the tree of objects and methods. The output will be alphabetised.
 *
 * Lets look at the example:
 |  /*\
 |   * Raphael.bezierBBox
 |   [ method ]
 |   **
 |   * Utility method
 |   **
 |   * Return bounding box of a given cubic bezier curve
 |   > Parameters
 |   - p1x (number) x of the first point of the curve
 |   - p1y (number) y of the first point of the curve
 |   - c1x (number) x of the first anchor of the curve
 |   - c1y (number) y of the first anchor of the curve
 |   - c2x (number) x of the second anchor of the curve
 |   - c2y (number) y of the second anchor of the curve
 |   - p2x (number) x of the second point of the curve
 |   - p2y (number) y of the second point of the curve
 |   * or
 |   - bez (array) array of six points for bezier curve
 |   = (object) point information in format:
 |   o {
 |   o     min: {
 |   o         x: (number) x coordinate of the left point
 |   o         y: (number) y coordinate of the top point
 |   o     }
 |   o     max: {
 |   o         x: (number) x coordinate of the right point
 |   o         y: (number) y coordinate of the bottom point
 |   o     }
 |   o }
 |  \&#x2a;/

\*/

var files = process.argv.slice(0),
    ref,
    srcs = [],
    chunks = {},
    title = "",
    output = "",
    scripts = [],
    fileName,
    toc = [];
files.splice(0, 2);
ref = files[0];
if (!files.length) {
    console.log("\nUsage: node dr <conf.json>");
}

if (files.length == 1 && path.extname(ref) == ".json") {
    var pth = ref.substring(0, ref.length - path.basename(ref).length),
        json = JSON.parse(fs.readFileSync(files[0], "utf-8"));
    title = json.title;
    files = [];
    for (var i = 0, ii = json.files && json.files.length; i < ii; i++) {
        files.push(path.resolve(pth, json.files[i].url));
        srcs.push(json.files[i].link);
    }
    output = path.resolve(pth, json.output) || "";
    pth = output.substring(0, output.length - path.basename(output).length)
    exec("mkdir " + pth + "js " + pth + "css " + pth + "fonts " + pth + "img");
    exec("cp " + __dirname + "/node_modules/topcoat/css/topcoat-mobile-light.css " + pth + "css/topcoat-desktop-light.css");
    exec("cp " + __dirname + "/node_modules/topcoat/demo/css/main.css " + pth + "css/main.css");
    exec("cp " + __dirname + "/third-party/prism.css " + pth + "css/prism.css");
    exec("cp " + __dirname + "/third-party/prism.js " + pth + "js/prism.js");
    exec("cp " + __dirname + "/node_modules/topcoat/demo/fonts/* " + pth + "fonts");
    exec("cp " + __dirname + "/node_modules/topcoat/img/search.svg " + pth + "img/search.svg");
    exec("cp " + __dirname + "/node_modules/topcoat/img/search_dark.svg " + pth + "img/search_dark.svg");
    exec("cp " + __dirname + "/dr.css " + pth + "css/dr.css");
    // exec("cp " + __dirname + "/dr-print.css " + pth + "dr-print.css");
    scripts = json.scripts || [];
}
console.log("\nTrust me, I am a Dr.js\n");
for (i = 0, ii = files.length; i < ii; i++) {
    var filename = files[i];
    fileName = fileName || filename;
    console.log("Processing " + filename);
    var code = fs.readFileSync(filename, "utf-8"),
        res = docit(code, filename, srcs[i]);
    if (res.sections && res.source) {
        toc = toc.concat(res.toc);
        for (var key in res.chunks) if (res.chunks.hasOwnProperty(key) && !chunks[key]) {
            chunks[key] = res.chunks[key];
        }
        title = title || res.title;
        console.log("Found \033[32m" + res.sections + "\033[0m section" + ss(res.sections) + ".");
        console.log("Processing \033[32m" + res.loc + "\033[0m line" + ss(res.loc) + " of code...");
        srcs[i] || (function (filename) {
            fs.writeFile(getPath(filename) + "-src.html", res.source, function () {
                console.log("Source saved to \033[32m" + getPath(filename) + "-src.html\033[0m\n");
            });
        })(filename);
    } else {
        console.log("\033[33m⚠  No comments in Dr.js format found\033[0m");
    }
}
var TOC = "",
    RES = "";
toc.sort(function (a, b) {
    if (a.name == b.name) {
        return 0;
    }
    if (a.name < b.name) {
        return -1;
    }
    return 1;
});
for (i = 0, ii = toc.length; i < ii; i++) if (i == ii - 1 || toc[i].name != toc[i + 1].name) {
    TOC += format('<li class="dr-lvl{indent}"><a href="#{name}" class="{clas}"><span>{name}{brackets}</span></a></li>', toc[i]);
    RES += chunks[toc[i].name] || "";
}
var html = '<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset="utf-8">\n    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">\n    <title>' + title + ' API Reference</title>\n    <meta name="viewport" content="user-scalable=no,initial-scale = 1.0,maximum-scale = 1.0">\n    <link rel="stylesheet" href="fonts/stylesheet.css"><link rel="stylesheet" href="css/topcoat-desktop-light.css">\n    <link rel="stylesheet" href="css/main.css">\n    <link rel="stylesheet" href="css/dr.css">\n    <link rel="stylesheet" href="css/prism.css"><!--[if lt IE 9]>\n    <script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script><![endif]-->\n  </head>\n  <body class="light">\n    <div id="wrapper">\n      <div class="max-width">\n        <div id="sideNav">\n          <div class="combo">\n              <input type="search" id="dr-filter" value="" placeholder="search" class="topcoat-search-input">\n          </div>\n          <div id="pageNav"><ol id="dr-toc">' + TOC + '</ol></div>\n        </div>\n      </div>\n      <div id="site">\n        <header id="main-header">\n          <div class="max-width">\n            <hgroup>\n              <h1>' + title + '</h1>\n              <p>API Reference</p>\n            </hgroup>\n          </div>\n        </header>\n        <div id="content" class="max-width">' + RES + '</div>\n        <footer></footer>\n      </div>\n    </div>\n    <script src="//use.edgefonts.net/source-sans-pro:n3,n4,n6;source-code-pro:n3.js"></script>\n    <script src="js/prism.js"></script>\n';
// var html = '<!DOCTYPE html>\n<!-- Generated with Dr.js -->\n<html lang="en">' +
//     '<head><meta charset="utf-8"><title>' + title + ' Reference</title>\n' +
//     '<link rel="stylesheet" href="dr.css" media="screen">\n' +
//     '<link rel="stylesheet" href="dr-print.css" media="print"></head>\n' +
//     '<body id="dr-js"><div id="dr"><ol class="dr-toc" id="dr-toc">' + TOC +
//     '</ol><div class="dr-doc"><h1>' + title + ' Reference</h1>' + RES +
//     "</div></div>\n";
for (i = 0, ii = scripts.length; i < ii; i++) {
    html += '<script src="' + scripts[i] + '"></script>\n';
}
html += "<script>" + fs.readFileSync(__dirname + "/toc-min.js", "utf-8") + "</script>\n</body></html>";
fs.writeFile(output || (getPath(fileName) + ".html"), html, function () {
    console.log("Saved to \033[32m" + (output || getPath(fileName) + ".html") + "\033[0m\n");
});
