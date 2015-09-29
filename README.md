# dr.js
Tiny documentation builder

This is a JavaScript tool for creating documentation for your JavaScript files. It’s written in nodejs and very easy to use.

##Usage:

        node dr.js <custom>.json

Format of custom.json is as follows
```
{
    "title": "MyProject",
    "output": "path/to/final/doc.html",
    "scripts": ["jquery.js"], // optional scripts to include into final doc
    "files": [{
        "url": "path/to/file.js",
        "link": "https://github.com/optional/link/to/file.js"
    }]
}
```
Script runs over given files in search for special format of comment

##Comments format:

Each comment section starts with the following line:

        /*\

And ends with this one:

        \*/

Each line in a comment block is starting with a symbol that represents type of the line.

* `*` means plain text with markdown support
* `|` means line of JavaScript code
* `-` means parameter description
* `>` means sub header
* `o` means object description
* `#` means HTML. Following text will be taken as is and put into resulting document without any changes
* `= <type> [description]` means return-type of function with given description 

First line is always a name of a section. Dr.js will analyze the names and build the tree of objects and methods. The output will be alphabetised.

**Example:**

```
    * Raphael.bezierBBox
    [ method ]
    **
    * Utility method
    **
    * Return bounding box of a given cubic bezier curve
    > Parameters
    - p1x (number) x of the first point of the curve
    - p1y (number) y of the first point of the curve
    - c1x (number) x of the first anchor of the curve
    - c1y (number) y of the first anchor of the curve
    - c2x (number) x of the second anchor of the curve
    - c2y (number) y of the second anchor of the curve
    - p2x (number) x of the second point of the curve
    - p2y (number) y of the second point of the curve
    * or
    - bez (array) array of six points for bezier curve
    = (object) point information in format:
    o {
    o     min: {
    o         x: (number) x coordinate of the left point
    o         y: (number) y coordinate of the top point
    o     }
    o     max: {
    o         x: (number) x coordinate of the right point
    o         y: (number) y coordinate of the bottom point
    o     }
    o }
```

**Output:**

[<img src="https://www.googledrive.com/host/0B4MMNHlRfGSzRFFkZTNYNDYyVzQ">](Output)


##License
Apache 2.0. See [LICENSE](./LICENSE)

##Contribute
* [Fork](https://help.github.com/articles/fork-a-repo) the repo.
* Create a branch:

        git checkout -b my_branch

* Add your changes.
* Commit your changes:

        git commit -am "Added some awesome stuff"

* Push your branch:

        git push origin my_branch

* Make a [pull request](https://help.github.com/articles/using-pull-requests)

