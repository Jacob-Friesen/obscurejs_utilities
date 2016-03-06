Obscure JavaScript Utilities
============================

Utilities used to produce extra content for obscurejavascript.tumblr.com:

* **update_most_popular.js:** Searches all tumblr posts for the 10 most popular by note count then outputs an HTML file. This HTML file is then included by iFrame in Obscure JavaScript.

update_most_popular.js
----------------------
Used to create a most popular page:

--debug Show debug printouts
-o The file to output the formatted data to

**Example**

    node update_most_popular.js --debug true -o most_popular.html
