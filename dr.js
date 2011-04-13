/*
 * Dr.js 0.0.3 - Simple JavaScript Documentation
 *
 * Copyright (c) 2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
var fs = require("fs"),
    path = require("path"),
    docit = require("./doc.js"),
    _ref = require("child_process"),
    spawn = _ref.spawn,
    exec = _ref.exec;
function getPath(filepath) {
    return "docs/" + path.basename(filepath, path.extname(filepath));
}

exec("mkdir -p docs");
exec("cp " + __dirname + "/dr.css docs/dr.css");

var files = process.ARGV.slice(0);
files.splice(0, 2);

files.forEach(function (filename) {
    console.log("\nTrust me, I am a Dr.js\n\nProcessing " + filename);
    fs.readFile(filename, "utf-8", function(error, code) {
        if (error) {
            throw error;
        }
        var res = docit(code, filename);
        console.log("Found \033[32m" + res.sections + "\033[0m sections.");
        console.log("Processing \033[32m" + res.loc + "\033[0m lines of code...");
        if (res.sections && res.doc) {
            fs.writeFile(getPath(filename) + ".html", res.doc, function () {
                fs.writeFile(getPath(filename) + "-src.html", res.source, function () {
                    console.log("Saved to \033[32m" + getPath(filename) + "\033[0m and \033[32m" + getPath(filename, 1) + "\033[0m\n");
                });
            });
        } else {
            console.log("\033[31mNo comments in Dr.js format found\033[0m");
        }
    });
});

