#!/bin/env node
var express = require('express');
var request = require('request');
var app = express();

app.get('/', function (req, res) {
    request({
    url: 'https://pre.ufcg.edu.br:8443/ControleAcademicoOnline/Controlador', //URL to hit
    method: 'POST',
    //Lets post the following key/values as form
    form: { login: '115110125', senha: 'nicolas9', command: 'AlunoLogin' }
}, function(error, response, body){
    res.send(error);
    res.send(body);
});
});

app.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function () {
    console.log("estamos no ar");
});