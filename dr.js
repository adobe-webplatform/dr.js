var fs = require("fs"),
    path = require("path"),
    eve = require("./eve.js").eve,
    _ref = require("child_process"),
    spawn = _ref.spawn,
    exec = _ref.exec;
function getPath(filepath) {
    return "docs/" + path.basename(filepath, path.extname(filepath)) + ".html";
}
function docit(txt) {
    var Title = txt.match(/^\s*(?:\/\*(?:\s*\*)?|\/\/)\s*("[^"]+"|\S+)/),
        rdoc = /\/\*\\[\s\S]*?\\\*\//g,
        rdoc2 = /^\/\*\\\n\s*\*\s+(.*)\n([\s\S]*)\\\*\/$/,
        rows = /^\s*(\S)(?:(?!\n)\s(.*))?$/mg,
        rcode = /`([^`]+)`/g,
        rkeywords = /\b(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|undefined)\b/g,
        rstrings = /("[^"]*?(?:\\"[^"]*?)*")/g,
        roperators = /( \= | \- | \+ | \* | \&\& | \|\| | \/ | == | === )/g,
        rdigits = /(\b(0[xX][\da-fA-F]+)|((\.\d+|\b\d+(\.\d+)?)(?:e[-+]?\d+)?))\b/g,
        rcomments = /(\/\/.*?(?:\n|$)|\/\*(?:.|\s)*?\*\/)$/gm,
        main = txt.match(rdoc),
        root = {},
        mode,
        html,
        list = [[]],
        curlist = list[0],
        clas = "";
    if (!main) {
        return;
    }

    function esc(text) {
        return String(text).replace(/</g, "&lt;").replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '<em class="amp">&amp;</em>').replace(rcode, "<code>$1</code>").replace(/(^|\s)@([^@\s\]\)"'”’]+)/g, '$1<a href="#$2" class="dr-link">$2</a>');
    }

    eve.on("*.list", function (mod, text) {
        this != "-" && (html += "</dl>\n");
    });
    eve.on("*.text", function (mod, text) {
        this != "*" && (html += "</p>\n");
    });
    eve.on("*.head", function (mod, text) {
        this != "*" && (html += "</p>\n");
    });
    eve.on("*.code", function (mod, text) {
        this != "|" && (html += "</code></pre>\n");
    });
    eve.on("s*.*", function (mod, text) {
        mode != "text" && (html += "<p>");
        if (text) {
            html += esc(text);
        } else {
            html += "</p>\n<p>";
        }
        mode = "text";
    });
    eve.on("s|.*", function (mod, text) {
        mode != "code" && (html += '<pre class="javascript code"><code>');
        html += text.replace(/</g, "&lt;").replace(/&/g, "&amp;").replace(rkeywords, "<b>$1</b>").replace(rstrings, "<i>$1</i>").replace(roperators, '<span class="s">$1</span>').replace(rdigits, '<span class="d">$1</span>').replace(rcomments, '<span class="c">$1</span>') + "\n";
        mode = "code";
    });
    eve.on("s#.*", function (mod, text) {
        html += text + "\n";
        mode = "html";
    });
    eve.on("s>.*", function (mod, text) {
        mode != "head" && (html += '<p class="header">');
        html += esc(text) + "\n";
        mode = "head";
    });
    eve.on("s[.*", function (mod, text) {
        var type;
        text = esc(text).replace(/\(([^\)]+)\)/, function (all, t) {
            type = t;
            return "";
        });
        itemData.type = esc(text).replace(/\s*\]\s*$/, "").split(/\s*,\s*/);
        clas = itemData.clas = "dr-" + itemData.type.join(" dr-");
        html += '<div class="' + clas + '">';
        type && (html += '<em class="dr-type dr-type-' + type + '">' + type + '</em>');
        mode = "";
    });
    eve.on("end.*", function (mod, text) {
        clas && (html += "</div>");
    });
    eve.on("s=.*", function (mod, text) {
        var split = text.split(/(\s*[\(\)]\s*)/);
        split.shift();
        split.shift();
        var types = split.shift().split(/\s*\|\s*/);
        split.shift();
        html += '<p class="dr-returns"><strong class="dr-title">Returns:</strong> ';
        for (var i = 0, ii = types.length; i < ii; i++) {
            types[i] = '<em class="dr-type-' + types[i] + '">' + types[i] + '</em>';
        }
        html += types.join(" ") + ' <span class="dr-description">' + esc(split.join("")) + "</span></p>\n";
        mode = "";
    });
    eve.on("s-.*", function (mod, text) {
        itemData.params = itemData.params || [];
        if (mode != "list") {
            html += '<dl class="dr-parameters">';
            itemData.params.push([]);
        }
        var optional,
            data = itemData.params[itemData.params.length - 1];
        text = text.replace(/#optional\s*/g, function () {
            optional = true;
            return "";
        });
        split = text.split(/(\s*[\(\)]\s*)/);
        data.push((optional ? "[" : "") + split[0] + (optional ? "]" : ""));
        html += '<dt class="dr-param' + (optional ? " optional" : "") + '">' + split.shift() + '</dt>\n';
        split.shift();
        if (optional) {
            html += '<dd class="dr-optional">optional</dd>\n';
        }
        var types = split.shift().split(/\s*\|\s*/);
        split.shift();
        html += '<dd class="dr-type">';
        for (var i = 0, ii = types.length; i < ii; i++) {
            types[i] = '<em class="dr-type-' + types[i] + '">' + types[i] + '</em>';
        }
        html += types.join(" ") + '</dd>\n<dd class="dr-description">' + (esc(split.join("")) || "&#160;") + '</dd>\n';
        mode = "list";
    });

    console.log("Found " + main.length + " sections.");

    for (var i = 0, ii = main.length; i < ii; i++) {
        var doc = main[i],
            split = doc.match(rdoc2),
            item = {};
        mode = "";
        html = "";
        itemData = {};
        if (!split) {
            continue;
        }
        var title = split[1].split("."),
            pointer = root;
        for (var j = 0, jj = title.length; j < jj; j++) {
            pointer = pointer[title[j]] = pointer[title[j]] || {};
        }
        split[2].replace(rows, function (all, symbol, text) {
            eve("s" + symbol + "." + mode, symbol, mode, text);
        });
        eve("end." + mode, null, mode, "");
        (function (value, Clas, data, pointer) {
            eve.on("item", function (point) {
                if (this == pointer) {
                    html += value;
                    itemData = data;
                }
            });
        })(html, clas, itemData, pointer);
        clas = "";
    }
    html = "";
    var lvl = [],
        toc = '<ol class="dr-toc">',
        itemData,
        res = "";
    var runner = function (pointer, hx) {
        var level = [], name;
        for (var node in pointer) {
            level.push(node);
        }
        level.sort();
        for (var j = 0, jj = level.length; j < jj; j++) {
            lvl.push(level[j]);
            name = lvl.join(".");
            html = "";
            itemData = {};
            eve("item", pointer[level[j]]);
            res += "<h" + hx + ' id="' + name + '" class="' + itemData.clas + '"><a href="#' + name + '" class="dr-hash">&#x2693;</a>' + name;
            if (itemData.type && itemData.type.indexOf("method") + 1) {
                if (itemData.params) {
                    if (itemData.params.length == 1) {
                        res += "(" + itemData.params[0].join(", ") + ")";
                    } else if (!itemData.params.length) {
                        res += "()";
                    } else {
                        res += "(\u2026)";
                    }
                } else {
                    res += "()";
                }
            }
            res += "</h" + hx + '>\n' + html;
            var indent = 0;
            name.replace(/\./g, function () {
                indent ++;
            });
            toc += '<li class="dr-lvl' + indent + '"><a href="#' + name + '" class="' + itemData.clas + '"><span>' + name;
            if (itemData.type && itemData.type.indexOf("method") + 1) {
                toc += "()";
            }
            toc += '</span></a></li>';
            runner(pointer[level[j]], hx + 1);
            lvl.pop();
        }
    };
    runner(root, 2);
    toc += "</ol>";
    return '<!DOCTYPE html>\n<!-- Generated with Dr.js -->\n<html lang="en"><head><meta charset="utf-8"><title>' + (Title ? Title[1] : "") + ' Reference</title><link rel="stylesheet" href="dr.css"></head><body><div class="dr-doc">' + toc + '<h1>' + (Title ? Title[1] : "") + ' Reference</h1>' + res + "</div></body></html>";
}

exec("mkdir -p docs");
exec("cp " + __dirname + "/dr.css docs/dr.css");

var files = process.ARGV.slice(0);
files.splice(0, 2);

files.forEach(function (filename) {
    console.log("Processing " + filename);
    fs.readFile(filename, "utf-8", function(error, code) {
        if (error) {
            throw error;
        }
        fs.writeFile(getPath(filename), docit(code) || "No docs found", function () {
            console.log("Saved to " + getPath(filename));
        });
    });
});

