# dr.js

The doctor is a tiny documentation builder focused on providing top notch documentation for JavaScript libraries and applications.

## Getting Started

First install `dr.js` from npm:

```
npm install dr-js -g
```

Installing the package globally will provide you a `dr-js` command-line executable, which means you can then generate documentation for any file with appropriate comments by running the following:

```
dr-js file1.js file2.js file3.js
```

The doctor will then parse each of the specified files and create a `docs` folder in the current working directory in which it will place a documentation file and a source file of any files that have dr.js comments:

## Comment Syntax Overview

A dr.js comment section is a block comment similar to the one shown below:

```js
/*\
 * itemname
 [ itemtype ]
 **
 * Description of the itemname
 **
 > Arguments
 **
 - arg1 (string) The first argument
 - arg2 (number) The second argument
 - callback (function) A callback function 
 **
 = (object) the return value for the function
 **
 **
\*/
```