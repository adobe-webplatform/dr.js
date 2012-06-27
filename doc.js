/*
 * Dr.js 0.0.6 - Simple JavaScript Documentation
 *
 * Copyright (c) 2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
var fs = require("fs"),
    path = require("path"),
    eve = require("./eve.js");
/*\
 * dr
 [ method ]
 **
 * Parses comments from the given string and generates two HTML sources.
 **
 > Arguments
 **
 - txt (string) source code
 - filename (string) filename of the given source
 **
 = (object)
 o {
 o     sections (number) number of comment sections found
 o     loc (number) number of lines of code in source file
 o     doc (string) HTML for the documentation file
 o     source (string) HTML for the highlighted source file, it will be linked from the doc as `basename + "-src.html"`, i.e. if filename is “dr.js”, then it will be “dr-src.html”
 o }
\*/
module.exports = function (txt, filename, sourceFileName) {
    var Title = txt.match(/^[^"]*"([^"]+)"/),
        rdoc = /\/\*\\[\s\S]*?\\\*\//g,
        rdoc2 = /^\/\*\\\n\s*\*\s+(.*)\n([\s\S]*)\\\*\/$/,
        rows = /^\s*(\S)(?:(?!\n)\s(.*))?$/,
        rcode = /`([^`]+)`/g,
        rkeywords = /\b(abstract|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|undefined)\b/g,
        rstrings = /("[^"]*?(?:\\"[^"]*?)*"|'[^']*?(?:\\'[^']*?)*')/g,
        roperators = /( \= | \- | \+ | % | \* | \&\& | \&amp;\&amp; | \& | \&amp; | \|\| | \| | \/ | == | === )/g,
        rdigits = /(\b(0[xX][\da-fA-F]+)|((\.\d+|\b\d+(\.\d+)?)(?:e[-+]?\d+)?))\b/g,
        rcomments = /(\/\/.*?(?:\n|$)|\/\*(?:.|\s)*?\*\/)$/g,
        rhref = /(https?:\/\/[^\s"]+[\d\w_\-\/])/g,
        rlink = /(^|\s)@([\w\.\_\$]*[\w\_\$])/g,
        ramp = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,
        main = txt.match(rdoc),
        root = {},
        mode,
        html,
        jsonLevel = 0,
        src = "",
        list = [[]],
        curlist = list[0],
        srcfilename = sourceFileName || (path.basename(filename, path.extname(filename)) + "-src.html"),
        clas = "",
        TOC = [],
        utoc = {},
        chunks = {},
        out = {};
    if (!main) {
        return {};
    }

    function esc(text) {
        return String(text).replace(/</g, "&lt;").replace(ramp, '<em class="amp">&amp;</em>').replace(rcode, "<code>$1</code>").replace(rlink, '$1<a href="#$2" class="dr-link">$2</a>').replace(rhref, '<a href="$1" rel="external">$1</a>');
    }
    function syntax(text) {
        return text.replace(/</g, "&lt;").replace(ramp, "&amp;").replace(rkeywords, "<b>$1</b>").replace(rstrings, "<i>$1</i>").replace(roperators, '<span class="s">$1</span>').replace(rdigits, '<span class="d">$1</span>').replace(rcomments, '<span class="c">$1</span>') + "\n";
    }
    function syntaxSrc(text) {
        var isend = text.match(/\*\//);
        if (text.match(/\/\*/)) {
            syntaxSrc.inc = true;
        }
        var out = text.replace(/</g, "&lt;").replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, "&amp;").replace(rkeywords, "<b>$1</b>").replace(rstrings, "<i>$1</i>").replace(roperators, '<span class="s">$1</span>').replace(rdigits, '<span class="d">$1</span>').replace(/(\/\*(?:.(?!\*\/))+(?:\*\/)?)/g, '<span class="c">$1</span>').replace(rcomments, '<span class="c">$1</span>') + "\n";
        if (syntaxSrc.inc) {
            out = out.replace(/(^.*\*\/)/, '<span class="c">$1</span>');
            if (!isend) {
                out = '<span class="c">' + out + '</span>';
            }
        }
        if (isend) {
            syntaxSrc.inc = false;
        }
        return out;
    }

    eve.on("doc.*.list", function (mod, text) {
        this != "-" && (html += "</dl>\n");
    });
    eve.on("doc.*.json", function (mod, text) {
        this != "o" && (html += "</ol>\n");
    });
    eve.on("doc.*.text", function (mod, text) {
        this != "*" && (html += "</p>\n");
    });
    eve.on("doc.*.head", function (mod, text) {
        this != "*" && (html += "</p>\n");
    });
    eve.on("doc.*.code", function (mod, text) {
        this != "|" && (html += "</code></pre>\n");
    });
    eve.on("doc.s*.*", function (mod, text) {
        mode != "text" && (html += "<p>");
        if (text) {
            html += esc(text) + "\n";
        } else {
            html += "</p>\n<p>";
        }
        mode = "text";
    });
    eve.on("doc.s|.*", function (mod, text) {
        mode != "code" && (html += '<pre class="javascript code"><code>');
        html += syntax(text);
        mode = "code";
    });
    eve.on("doc.s#.*", function (mod, text) {
        html += text + "\n";
        mode = "html";
    });
    eve.on("doc.s>.*", function (mod, text) {
        mode != "head" && (html += '<p class="header">');
        html += esc(text) + "\n";
        mode = "head";
    });
    eve.on("doc.s[.*", function (mod, text) {
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
    eve.on("doc.end.*", function (mod, text) {
        clas && (html += "</div>");
    });
    eve.on("doc.s=.*", function (mod, text) {
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
    eve.on("doc.s-.*", function (mod, text) {
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
        var split = text.split(/(\s*[\(\)]\s*)/);
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
    eve.on("doc.so.*", function (mod, text) {
        if (mode != "json") {
            html += '<ol class="dr-json">';
        }
        var desc = text.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/),
            start = text.match(/\s*\{\s*$/),
            end = text.match(/\s*\}\s*,?\s*$/);
        !end && (html += "<li>");
        if (desc) {
            html += '<span class="dr-json-key">' + desc[1] + '</span>';
            var types = desc[2].split(/\s*\|\s*/);
            html += '<span class="dr-type">';
            for (var i = 0, ii = types.length; i < ii; i++) {
                types[i] = '<em class="dr-type-' + types[i] + '">' + types[i] + '</em>';
            }
            html += types.join(" ") + '</span><span class="dr-json-description">' + (esc(desc[3]) || "&#160;") + '</span>\n';
        } else {
            !end && (html += text);
        }
        if (start) {
            html += '<ol class="dr-json">';
        }
        if (end) {
            html += '</ol></li><li>' + text + '</li>';
        }
        mode = "json";
    });

    out.sections = main.length;

    main = txt.split("\n");

    out.loc = main.length;

    var beginrg = /^\s*\/\*\\\s*$/,
        endrg = /^\s*\\\*\/\s*$/,
        line = 0,
        pointer,
        firstline = false,
        inside = false;

    for (var i = 0, ii = main.length; i < ii; i++) {
        var doc = main[i];
        line++;
        src += '<code id="L' + line + '"><span class="ln">' + line + '</span>' + syntaxSrc(doc) + '</code>';
        if (doc.match(beginrg)) {
            inside = firstline = true;
            pointer = root;
            itemData = {};
            html = "";
            mode = "";
            continue;
        }
        if (doc.match(endrg)) {
            inside = false;
            eve("doc.end." + mode, null, mode, "");
            itemData.line = line + 1;
            (function (value, Clas, data, pointer) {
                eve.on("doc.item", function () {
                    if (this == pointer) {
                        html += value;
                        itemData = data;
                    }
                });
            })(html, clas, itemData, pointer);
            clas = "";
            continue;
        }
        if (inside) {
            var title,
                data = doc.match(rows);
            if (data) {
                var symbol = data[1],
                    text = data[2];
                if (symbol == "*" && firstline) {
                    firstline = false;
                    title = text.split(".");
                    for (var j = 0, jj = title.length; j < jj; j++) {
                        pointer = pointer[title[j]] = pointer[title[j]] || {};
                    }
                } else {
                    eve("doc.s" + symbol + "." + mode, symbol, mode, text);
                }
            }
        }
    }
    html = "";
    var lvl = [],
        toc = "",
        itemData,
        res = "";
    var runner = function (pointer, hx) {
        var level = [], name, chunk;
        for (var node in pointer) {
            level.push(node);
        }
        level.sort();
        for (var j = 0, jj = level.length; j < jj; j++) {
            lvl.push(level[j]);
            name = lvl.join(".");
            html = "";
            chunk = "";
            itemData = {};
            eve("doc.item", pointer[level[j]]);
            chunk += '<div class="' + name.replace(/\./g, "-") + '-section"><h' + hx + ' id="' + name + '" class="' + itemData.clas + '"><i class="dr-trixie">&#160;</i>' + name;
            if (itemData.type && itemData.type.indexOf("method") + 1) {
                if (itemData.params) {
                    if (itemData.params.length == 1) {
                        chunk += "(" + itemData.params[0].join(", ") + ")";
                    } else if (!itemData.params.length) {
                        chunk += "()";
                    } else {
                        chunk += "(\u2026)";
                    }
                } else {
                    chunk += "()";
                }
            }
            chunk += '<a href="#' + name + '" title="Link to this section" class="dr-hash">&#x2693;</a>';
            itemData.line && (chunk += '<a class="dr-sourceline" title="Go to line ' + itemData.line + ' in the source" href="' + srcfilename + '#L' + itemData.line + '">&#x27ad;</a>');
            chunk += '</h' + hx + '>\n';
            chunk += '<div class="extra" id="' + name + '-extra"></div></div>';
            chunk += html;
            chunks[name] = chunks[name] || "";
            chunks[name] += chunk;
            res += chunk;
            var indent = 0;
            name.replace(/\./g, function () {
                indent++;
            });
            toc += '<li class="dr-lvl' + indent + '"><a href="#' + name + '" class="' + itemData.clas + '"><span>' + name;
            if (itemData.type && itemData.type.indexOf("method") + 1) {
                toc += "()";
            }
            toc += '</span></a></li>';
            if (!utoc[name]) {
                TOC.push({
                    indent: indent,
                    name: name,
                    clas: itemData.clas,
                    brackets: itemData.type && itemData.type.indexOf("method") + 1 ? "()" : ""
                });
                utoc[name] = 1;
            }
            runner(pointer[level[j]], hx + 1);
            lvl.pop();
        }
    };

    runner(root, 2);
    out.chunks = chunks;
    out.toc = TOC;
    out.title = Title ? Title[1] : "";
    out.source = '<!DOCTYPE html>\n<!-- Generated with Dr.js -->\n<html lang="en"><head><meta charset="utf-8"><title>' + path.basename(filename) + '</title><link rel="stylesheet" href="dr.css"></head><body id="src-dr-js">' + src + '</body></html>';
    eve.unbind("doc.*");
    return out;
};