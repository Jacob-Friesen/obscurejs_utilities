Obscure JavaScript Utilities
============================

Utilities used to produce extra content for obscurejavascript.tumblr.com:

* **update_most_popular.js:** Searches all tumblr posts for the 10 most popular by note count then outputs an HTML file. This HTML file is then included by iFrame in Obscure JavaScript.

update_most_popular.js
----------------------
Used to create a most popular page:

--debug Show debug printouts<br/>
--html The HTML file to output the formatted data to. If not specified the JSON to write HTML is printed to console<br/>
--css The CSS file to output the formatted data to. If not specified nothing is copied.


**Example**

    node update_most_popular.js --html ../portfolio_website/src/downloads/most_popular.html --css ../portfolio_website/src/downloads/most_popular.css
