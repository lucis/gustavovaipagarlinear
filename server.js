#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var app = express();
var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.get('/lu', function (req, res) {
    res.writeHead(302, {
    'Location': 'http://ludelutriz-luciannojunior.rhcloud.com/'
    });
    res.end();
});

app.get('/', function (req, res) {
    res.writeHead(302, {
    'Location': 'http://facebook.com/lutrizfotos'
    });
    res.end();
});
app.listen(port, ipaddress, function () {
    console.log('Server is on, bitches!');
});