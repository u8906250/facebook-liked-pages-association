var express = require('express.io');
var graph = require('fbgraph');
var conf = require("../config").facebook; //setup your own config.js
var MAX_LIKED_PAGES = 65535;
var MAX_LIKED_PAGES_GET = 10000;
var MAX_LIKED_PAGES_TOP = 50;
var LIKED_PAGES_START_NAME = "thinkTW";
var liked_pages_get_count = 0;
var liked_pages_sorted = 0;

function liked_pages_bucket_get (start, end, liked_pages, id)
{
	for (i=start; i<end; i++) {
		if (typeof liked_pages[i] == "undefined"){
			break;
		}
		if (liked_pages[i].id == id) {
			break;
		}
	}
	return i;
}

function liked_pages_dump (liked_pages, max)
{
	for (i=0; i<MAX_LIKED_PAGES && i<max; i++) {
		if (typeof liked_pages[i] != "undefined"){
			console.log(i + " " + liked_pages[i].id + " " + liked_pages[i].name + " " + liked_pages[i].count);
		}
	}
}

function liked_pages_compare(a,b) {
	if (a.count < b.count)
		return 1;
	if (a.count > b.count)
		return -1;
	return 0;
}

function liked_pages_get (liked_pages, name)
{
	if (liked_pages_get_count >= MAX_LIKED_PAGES_GET)
		return;
	liked_pages_get_count ++;
	graph.get(name+"/likes", function(err, res) {
		if (res && res.data) {
			for (j=0; j<res.data.length; j++) {
				if (liked_pages_get_count >= MAX_LIKED_PAGES_GET)
					break;	
				entry = res.data[j];
				if (entry.id && entry.name) {
					idx = liked_pages_bucket_get (entry.id%MAX_LIKED_PAGES, MAX_LIKED_PAGES, entry.id);

					if (idx == MAX_LIKED_PAGES) {
						idx = liked_pages_bucket_get (0, entry.id%MAX_LIKED_PAGES, entry.id);
						if (idx  == entry.id%MAX_LIKED_PAGES) {
							//FIXME out of buckets
							//console.log("out of buckets");
							break;
						}
					}
					if (typeof liked_pages[idx] == "undefined"){
						liked_pages[idx] = {"id":entry.id, "name":entry.name, "count":1};
						liked_pages_get(liked_pages, entry.id);
					} else {
						liked_pages[idx].count ++;
					}
				}
			}
		}
	});
}

//get your access token from https://developers.facebook.com/tools/explorer
if (conf.access_token) {
	graph.setAccessToken(conf.access_token);
	var start_name = LIKED_PAGES_START_NAME;
	var liked_pages = new Array(MAX_LIKED_PAGES);
	graph.get(start_name, function(err, res) {
		if (res.id && res.name) {
			liked_pages[res.id%MAX_LIKED_PAGES] = {"id":res.id, "name":res.name, "count":1};
			liked_pages_get(liked_pages, start_name);
		}
	});
	//TODO acccess token will expire in hours, to keep alive by get https://graph.facebook.com/me?access_token=xxxxx
}




var app = express().http().io();

app.use(express.cookieParser())
app.use(express.session({secret: 'test123'}))

app.io.route('ready', function(req) {
	req.io.emit('talk', {liked_pages_max_count: MAX_LIKED_PAGES_GET, liked_pages_top: MAX_LIKED_PAGES_TOP, liked_pages_start_name: LIKED_PAGES_START_NAME});
});

app.io.route('liked_pages', function(req) {
	if (liked_pages_get_count < MAX_LIKED_PAGES_GET) {
		req.io.emit('talk', {liked_pages_count: liked_pages_get_count});
	} else {
		if (!liked_pages_sorted) {
			liked_pages.sort(liked_pages_compare);
		}
		req.io.emit('talk', {liked_pages: liked_pages.slice(0, MAX_LIKED_PAGES_TOP)});
	}
});

app.get('/', function(req, res) {
	if (req.session.loginDate === undefined) {
		req.session.loginDate = new Date().toString();
	}
	res.sendfile(__dirname + '/views/client.html')
})

app.listen(7076)
