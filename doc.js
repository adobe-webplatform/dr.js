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
 * Dr.js 0.1.1 - Simple JavaScript Documentation
 *
 * Author: Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 */
var fs = require("fs"),
    path = require("path"),
    markdown = require("markdown").markdown,
    eve = require("eve");
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
        rlink = /(^|\s)@([\w\.\_\$]*[\w\_\$])/g,
        ramp = /&(?!\w+;|#\d+;|#x[\da-f]+;)/gi,
        rantiwrap = /^<([^>]+)>(.*)<\/\1>$/,
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
        sections = [],
        current = sections,
        prev = sections,
        utoc = {},
        chunks = {},
        out = {};
    if (!main) {
        return {};
    }
    function esc(text) {
        return markdown.toHTML(String(text))
            .replace(rantiwrap, "$2")
            .replace(ramp, '<em class="amp">&amp;</em>')
            .replace(rlink, '$1<a href="#$2" class="dr-link">$2</a>');
    }

    eve.on("doc.*.list", function (mod, text) {
        if (this != "-") {
            current = prev;
        }
    });
    eve.on("doc.*.json", function (mod, text) {
        if (this != "o") {
            current = prev;
        }
    });
    eve.on("doc.*.text", function (mod, text) {
        if (this != "*") {
            current = prev;
        }
    });
    eve.on("doc.*.code", function (mod, text) {
        if (this != "|") {
            current = prev;
        }
    });
    eve.on("doc.s*.*", function (mod, text) {
        if (mode != "text") {
            prev = current;
            var arr = [""];
            current.push({text: arr});
            current = arr;
        }
        if (text) {
            current[current.length - 1] += esc(text) + "\n";
        } else {
            current.push("");
        }
        mode = "text";
    });
    eve.on("doc.s|.*", function (mod, text) {
        if (mode != "code") {
            prev = current;
            var arr = [];
            current.push({code: arr});
            current = arr;
        }
        current.push(text);
        mode = "code";
    });
    eve.on("doc.s#.*", function (mod, text) {
        current.push({html: text + "\n"});
        mode = "html";
    });
    eve.on("doc.s>.*", function (mod, text) {
        mode != "head" && (html += '<h3>');
        current.push({head: esc(text)});
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
        mode = "";
    });
    eve.on("doc.end.*", function (mod, text) {
    });
    eve.on("doc.s=.*", function (mod, text) {
        var split = text.split(/(\s*[\(\)]\s*)/);
        split.shift();
        split.shift();
        var types = split.shift().split(/\s*\|\s*/);
        split.shift();
        current.push({rtrn: {
            type: types,
            desc: esc(split.join(""))
        }});
        mode = "";
    });
    eve.on("doc.s-.*", function (mod, text) {
        itemData.params = itemData.params || [];
        if (mode != "list") {
            itemData.params.push([]);
            prev = current;
            var arr = [];
            current.push({attr: arr});
            current = arr;
        }
        var optional,
            data = itemData.params[itemData.params.length - 1];
        text = text.replace(/#optional\s*/g, function () {
            optional = true;
            return "";
        });
        var split = text.split(/(\s*[\(\)]\s*)/),
            item = {};
        data.push((optional ? "[" : "") + split[0] + (optional ? "]" : ""));
        item.name = split.shift();
        split.shift();
        if (optional) {
            item.optional = true;
        }
        var types = split.shift().split(/\s*\|\s*/);
        split.shift();
        item.type = types;
        var stypes = [];
        item.desc = esc(split.join(""));
        current.push(item);
        mode = "list";
    });
    eve.on("doc.so.*", function (mod, text) {
        if (mode != "json") {
            prev = current;
            var arr = [];
            current.push({json: arr});
            current = arr;
        }
        var desc = text.match(/^\s*([^\(\s]+)\s*\(([^\)]+)\)\s*(.*?)\s*$/),
            start = text.match(/\s*\{\s*$/),
            end = text.match(/\s*\}\s*,?\s*$/),
            item = {};
        if (desc) {
            item.key = desc[1];
            item.type = desc[2].split(/\s*\|\s*/);
            item.desc = esc(desc[3]);
            var types = desc[2].split(/\s*\|\s*/);
        } else if (!end) {
            item = text;
        }
        if (start) {
            item = {
                start: text
            };
        }
        if (end) {
            item = {
                end: text
            };
        }
        current.push(item);
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
        if (doc.match(beginrg)) {
            inside = firstline = true;
            pointer = root;
            itemData = {};
            html = "";
            mode = "";
            continue;
        }
        if (doc.match(endrg) && inside) {
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
                    sections.push(current = prev = [itemData]);
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
        var level = [], name, chunk, brackets;
        for (var node in pointer) {
            level.push(node);
        }
        level.sort();
        for (var j = 0, jj = level.length; j < jj; j++) {
            lvl.push(level[j]);
            name = lvl.join(".");
            itemData = {};
            eve("doc.item", pointer[level[j]]);
            itemData.title = name;
            if (itemData.type && itemData.type.indexOf("method") + 1) {
                if (itemData.params) {
                    if (itemData.params.length == 1) {
                        brackets = "(" + itemData.params[0].join(", ") + ")";
                    } else if (!itemData.params.length) {
                        brackets = "()";
                    } else {
                        brackets = "(\u2026)";
                    }
                } else {
                    brackets = "()";
                }
            }
            itemData.name = name + (brackets || "");
            var indent = 0;
            name.replace(/\./g, function () {
                indent++;
            });
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
    out.toc = TOC;
    out.out = sections;
    // console.log(JSON.stringify(sections));
    out.title = Title ? Title[1] : "";
    eve.unbind("doc.*");
    return out;
};