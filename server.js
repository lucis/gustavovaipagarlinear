var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res,json({
        "no ar": "sim"
    });
});
app.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function () {
    console.log("estamos no ar");
});