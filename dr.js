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

module.exports = function(files, targetDir, reporter) {
    
    
    exec("mkdir -p " + path.resolve(targetDir, "docs"));
    exec("cp " + __dirname + "/dr.css " + path.resolve(targetDir, "docs/dr.css"));

    files.forEach(function (filename) {
        reporter || console.log("\nTrust me, I am a Dr.js\n\nProcessing " + filename);
        fs.readFile(filename, "utf-8", function(error, code) {
            if (error) {
                throw error;
            }
            var res = docit(code, filename);
            if (res && res.sections && res.doc) {
                reporter || console.log("Found \033[32m" + res.sections + "\033[0m sections.");
                reporter || console.log("Processing \033[32m" + res.loc + "\033[0m lines of code...");

                fs.writeFile(path.resolve(targetDir, getPath(filename) + ".html"), res.doc, function () {
                    fs.writeFile(path.resolve(targetDir, getPath(filename) + "-src.html"), res.source, function () {
                        (reporter ? reporter : console.log)("Saved to \033[32m" + getPath(filename) + "\033[0m and \033[32m" + getPath(filename, 1) + "\033[0m\n");
                    });
                });
            } else {
                (reporter ? reporter : console.log)("\033[31mNo comments in Dr.js format found\033[0m");
            }
        });
    });
};