var express = require('express.io');
var graph = require('fbgraph');
var	conf = require("../config").facebook;

//get your access token from https://developers.facebook.com/tools/explorer
if (conf.access_token) {
	graph.setAccessToken(conf.access_token);
	graph.get("Official.YellowBook/likes", function(err, res) {
		console.log(res);
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
