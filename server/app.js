#!/bin/env node
const path = require('path');
const http = require('http');
const express = require('express');

const urlPathRoot = process.env.urlPathRoot || '';

// ----------
// Note if hosting on IIS using iisnode then httpPort is not used
//    and the port is determined during server start
const httpIp = '0.0.0.0';
const httpPort = 3000;

// ----------
var App = {
	// ----------
	initializeApp: function () {
		if (process.env.IISNODE_VERSION) {
			this.port = process.env.PORT;
			this.onIis = true;
		} else {
			this.port = httpPort;
			this.onIis = false;
		}

		this.app = express();
	},

	// ----------
	initializeServer: function () {
		// express.static options (express.static(root, [options]))
		//    (see http://expressjs.com/en/4x/api.html#express.static)
		// 		{
		// 			dotfiles: 'ignore',
		// 			etag: true,
		// 			extensions: false,
		// 			fallthrough: true,
		// 			immutable: false,
		// 			index: 'index.html',
		// 			lastModified: true,
		// 			maxAge: 0,
		// 			redirect: true,
		// 			setHeaders: function(res, path, stat) {}
		// 		}
		this.app.use(urlPathRoot + '/', express.static(path.join(__dirname, '../site')));
		this.app.use(urlPathRoot + '/builds', express.static(path.join(__dirname, '../builds')));
		this.app.use(urlPathRoot + '/docs', express.static(path.join(__dirname, '../docs')));
		this.app.use(urlPathRoot + '/demo', express.static(path.join(__dirname, '../demo')));
	},

	// ----------
	start: function () {
		var self = this;

		var startHttp = function () {
			if (self.onIis) {
				http.createServer(self.app).listen(self.port, httpIp, () => {
					console.log(
						'%s: Node HTTP server started on port %s ...\niisnode version: %s\nurlPathRoot: %s',
						Date(Date.now()),
						self.port,
						process.env.IISNODE_VERSION,
						urlPathRoot + '/'
					);
				});
			} else {
				http.createServer(self.app).listen(self.port, httpIp, () => {
					console.log(
						'%s: Node HTTP server started on http://%s:%s ...\nurlPathRoot: %s',
						Date(Date.now()),
						httpIp,
						self.port,
						urlPathRoot + '/'
					);
				});
			}
		};

		this.initializeApp();

		this.initializeServer();

		startHttp();
	}
};

// ----------
App.start();
