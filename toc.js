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
(function (ol) {
    if (!ol) {
        return;
    }
    var isABBR = function (str, abbr) {
            var letters = abbr.toUpperCase().split(""),
                first = letters.shift(),
                rg = new RegExp("^[" + first.toLowerCase() + first + "][a-z]*"
                    + letters.join("[a-z]*") + "[a-z]*$");
            return !!String(str).match(rg);
        },
        score = function (me, search) {
            me = String(me);
            search = String(search);
            var score = 0,
                chunk;
            if (me == search) {
                return 1;
            }
            if (!me || !search) {
                return 0;
            }
            if (isABBR(me, search)) {
                return .9;
            }
            score = 0;
            chunk = me.toLowerCase();
            for (var j, i = 0, ii = search.length; i < ii; i++) {
                j = chunk.indexOf(search.charAt(i));
                if (~j) {
                    chunk = chunk.substring(j + 1);
                    score += 1 / (j + 1);
                }
            }
            score = Math.max(score / ii - Math.abs(me.length - ii) / me.length / 2, 0);
            return score;
        };
    var lis = ol.getElementsByTagName("span"),
        names = [],
        rgName = /[^\.\(]*(?=(\(\))?$)/;
    for (var i = 0, ii = lis.length; i < ii; i++) {
        names[i] = {
            li: lis[i].parentNode.parentNode,
            text: lis[i].innerHTML.match(rgName)[0]
        };
    }
    var input = document.getElementById("dr-filter"),
        sorter = function (a, b) {
            return b.weight - a.weight;
        };
    input.onclick =
    input.onchange =
    input.onkeydown =
    input.onkeyup = function () {
        var v = input.value,
            res = [];
        if (v.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                res[i] = {
                    li: names[i].li,
                    weight: score(names[i].text, v)
                };
            }
            res.sort(sorter);
        } else {
            res = names;
        }
        for (i = 0, ii = res.length; i < ii; i++) {
            ol.appendChild(res[i].li);
        }
    };
})(document.getElementById("dr-toc"));