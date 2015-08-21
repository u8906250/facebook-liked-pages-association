var express = require('express.io');
var graph = require('fbgraph');
var conf = require("../config").facebook;
var MAX_LIKED_PAGES = 65535;

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

function liked_pages_dump (liked_pages)
{
	for (i=0; i<MAX_LIKED_PAGES; i++) {
		if (typeof liked_pages[i] != "undefined"){
			console.log(i + " " + liked_pages[i].id + " " + liked_pages[i].name + " " + liked_pages[i].count);
		}
	}
}

//get your access token from https://developers.facebook.com/tools/explorer
if (conf.access_token) {
	graph.setAccessToken(conf.access_token);
	var start_page = "Official.YellowBook";
	var liked_pages = new Array(MAX_LIKED_PAGES);
	graph.get(start_page, function(err, res) {
		if (res.id && res.name) {
			liked_pages[res.id%MAX_LIKED_PAGES] = {"id":res.id, "name":res.name, "count":1};
		}
		graph.get(start_page+"/likes", function(err, res) {
			res.data.forEach(function(entry) {
				if (entry.id && entry.name) {
					idx = liked_pages_bucket_get (entry.id%MAX_LIKED_PAGES, MAX_LIKED_PAGES, entry.id);
					if (idx == MAX_LIKED_PAGES) {
						idx = liked_pages_bucket_get (0, entry.id%MAX_LIKED_PAGES, entry.id);
						if (idx  == entry.id%MAX_LIKED_PAGES) {
							//FIXME out of buckets
							return;
						}
					}
					if (typeof liked_pages[idx] == "undefined"){
						liked_pages[idx] = {"id":entry.id, "name":entry.name, "count":1};
					} else {
						liked_pages[idx].count ++;
					}
				}
			});
			liked_pages_dump(liked_pages);
		});
	});
	//TODO acccess token will expire in hours, to keep alive by get https://graph.facebook.com/me?access_token=xxxxx
}

/*
var app = express().http().io();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	res.render('index');
});
app.get('/auth/facebook', function(req, res) {
	if (!req.query.code) {
		var authUrl = graph.getOauthUrl({
			"client_id":     conf.client_id,
			"redirect_uri":  conf.redirect_uri,
			"scope":         conf.scope
		});

		if (!req.query.error) {
			res.redirect(authUrl);
		} else {
			res.send('access denied');
		}
		return;
	}
	graph.authorize({
		"client_id":      conf.client_id,
		"redirect_uri":   conf.redirect_uri,
		"client_secret":  conf.client_secret,
		"code":           req.query.code
	}, function (err, facebookRes) {
		res.redirect('/UserHasLoggedIn');
	});
});
app.get('/UserHasLoggedIn', function(req, res) {
	res.render("index");
	//FIXME manual test Official.YellowBook liked pages
	graph.get("Official.YellowBook/likes", function(err, res) {
		console.log(res);
	});
});

app.listen(7076);
*/
