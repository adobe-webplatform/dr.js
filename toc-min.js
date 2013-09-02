!function(e){if(e){for(var t=function(e,t){var n=t.toUpperCase().split(""),r=n.shift(),a=RegExp("^["+r.toLowerCase()+r+"][a-z]*"+n.join("[a-z]*")+"[a-z]*$")
return!!(e+"").match(a)},n=function(e,n){e+="",n+=""
var r,a=0
if(e==n)return 1
if(!e||!n)return 0
if(t(e,n))return.9
a=0,r=e.toLowerCase()
for(var i,o=0,l=n.length;l>o;o++)i=r.indexOf(n.charAt(o)),~i&&(r=r.substring(i+1),a+=1/(i+1))
return a=Math.max(a/l-Math.abs(e.length-l)/e.length/2,0)},r=e.getElementsByTagName("span"),a=[],i=/[^\.\(]*(?=(\(\))?$)/,o=0,l=r.length;l>o;o++)a[o]={li:r[o].parentNode.parentNode,text:r[o].innerHTML.match(i)[0]}
var h=document.getElementById("dr-filter"),f=function(e,t){return t.weight-e.weight}
h.onclick=h.onchange=h.onkeydown=h.onkeyup=function(){var t=h.value,r=[]
if(t.length>1){for(var i=0,o=a.length;o>i;i++)r[i]={li:a[i].li,weight:n(a[i].text,t)}
r.sort(f)}else r=a
for(i=0,o=r.length;o>i;i++)e.appendChild(r[i].li)}}}(document.getElementById("dr-toc"))