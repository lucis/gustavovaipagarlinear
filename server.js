#!/bin/env node
var express = require('express');
var request = require('request');
var app = express();

app.get('/', function (req, res) {
    request('http://www.google.com', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.send(body); 
        }
    });
});

app.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function () {
    console.log("estamos no ar");
});