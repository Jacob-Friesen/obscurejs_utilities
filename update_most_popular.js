'use strict';

var async = require('async'),
    fs = require('fs'),
    http = require('http'),
    yargs = require('yargs'),
    _ = require('lodash');

// argument parsing
var argv = require('yargs').argv;

var DEBUG = argv.debug,
    OUTPUT_FILE = argv.o;

var CONSUMER_KEY = 'zKpNzvLkw45CKlKsb0FtdyxDKWwchQAg7qiRFnkcEotPYzzwFu',
    BLOG = 'obscurejavascript.tumblr.com',
    TUMBLR_MAX_BLOGS = 20,
    MOST_POPULAR = 10,
    CSS_FILE = 'most_popular.css';

var debug = function() {
    if (DEBUG) {
        console.log.apply(this, arguments);
    }
};

/** 
 * @desc
 * Make a request to a specific location with an optional offset. If successful, the parsed response is returned. If an
 * error, it is directly thrown,
 *
 * @param location {string} The tumblr location to send to.
 * @param offset {integer} The offset optional parameter.
 * @param callback {function(response)} Called with the parsed response from JSON.
 */
var makeRequest = function(location, offset, callback) {
    var url = '/v2/blog/'+BLOG+location+'?api_key='+CONSUMER_KEY;
    if (offset) {
        url += '&offset=' + offset;
    }
    debug('Request:', url);

    var req = http.request({
        host: 'api.tumblr.com',
        port: 80,
        path: url,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }, function(res) {
        var output = '';
        debug('Status Code: ' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var parsed = JSON.parse(output);

            if (parsed.meta.status === 200) {
                if (_.isFunction(callback)) {
                    callback(parsed.response);
                }
            } else {
                throw('Error ' + parsed.meta.status + ':' + parsed.meta.msg);
            }
        });
    });

    req.on('error', function(err) {
        console.log('error: ' + err.message);
    });

    req.end();
};

// General flow

/** 
 * @desc
 * Returns a set of formatted posts based on the ones passed in.
 *
 * @param posts {array[object]} A set of posts/.
 * @param callback {function} Called with the formatted posts.
 * @param callback {null, formattedPosts} Posts with just the title, notes and url.
 */
var getPostSet = function(posts, callback, formattedPosts) {
    formattedPosts = formattedPosts.concat(posts.map(function(post) {
        return {
            title: post.title,
            notes: post.note_count,
            url: post.short_url
        };
    }));

    if (_.isFunction(callback)) {
        callback(null, formattedPosts);
    }
};

/** 
 * @desc
 * Calls the callback with all the formatted posts.
 *
 * @param posts {number} maxPosts The maximum number of posts that can be fetched per request.
 * @param callback {function(result)} Called with all the formatted posts.
 * @param callback {null, formattedPosts} Posts with just the title, notes and url.
 */
var getAllPosts = function(maxPosts, callback) {
    var requests = [],
        formattedPosts = [];

    for (var offset = 0; offset <= maxPosts; offset += TUMBLR_MAX_BLOGS) {
        (function(offset) {
            requests.push(function(callback) {
                makeRequest('/posts', offset, function(data) {
                    getPostSet(data.posts, callback, formattedPosts);
                });
            });
        })(offset);
    }

    async.parallel(requests, function(err, results) {
        if (err) {
            throw(err);
        }

        if (_.isFunction(callback)) {
            callback(_.flatten(results, true));
        }
    });
}


/** 
 * @desc
 * Retrieves the n most popular posts.
 *
 * @param posts {array[object]} posts A set of posts to order. See getPostSet() for the formatting.
 * @param n {number} The number of popular posts to retrieve.
 */
var mostPopular = function(posts, n, callback) {
    if (DEBUG) {
        posts.forEach(function(post) {
            debug(post.notes, post.title);
        });
    }

    posts.sort(function(postA, postB) {
        return postA.notes - postB.notes;
    });

    if (_.isFunction(callback)) {
        callback(posts.slice(-1 * n).reverse());
    }
};

/** 
 * @desc
 * Creates HTML for the given set of posts.
 *
 * @param posts {array[object]} posts A set of posts to extract from.
 *
 * @returns {string} The html.
 */
var makeHtml = function(posts) {
    var html = '';

    html += '<!-- Last generated: '+new Date()+'-->\n';
    html += '<head><link rel="stylesheet" type="text/css" href="'+CSS_FILE+'"/></head>\n';
    html += '<base target="_parent"/>'
    html += '<div class="most-popular-sidebar">\n';
    html += '  <h3 class="most-popular-title">Top '+posts.length+' Posts By Notes</h3>\n';
    html += '  <ul class="most-popular-blogs">\n';
    posts.forEach(function(post) {
        html += '    <li class="blog">\n';
        html += '      <b title="notes">'+post.notes+'</b>|&nbsp;';
        html += '<a class="blog-link" title="'+post.title+'" href="'+post.url+'">'+post.title+'</a>\n';
        html += '    </li>\n';
    });
    html += '  </ul>\n';
    html += '</div>\n';

    return html;
};

console.log('Retrieving posts and formatting posts...');

// Get the total number of posts then search through all posts to get the most popular
makeRequest('/info', null, function(data) {
    var totalPosts = data.blog.posts;

    debug('There are ' + totalPosts + ' total posts.');
    getAllPosts(totalPosts, _.partialRight(mostPopular, MOST_POPULAR, function(posts) {
        if(!_.isEmpty(OUTPUT_FILE)) {
            console.log('Writing posts to the', OUTPUT_FILE, 'file...');

            var html = makeHtml(posts);
            debug('HTML\n', html);

            fs.writeFileSync(OUTPUT_FILE, html);

            console.log('Posts written to', OUTPUT_FILE + '.');
        } else {
            debug('No file specified. Writing to console');
            console.log(posts);
        }
    }));
});
