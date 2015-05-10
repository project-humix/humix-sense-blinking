var domainSocket = '/tmp/humix-sense-blinking';
var sensorName   = 'humix-sense-blinking';
var natChannel   = 'humix-sense-blinking';

var net  = require('net');

var client = net.connect({path: domainSocket});

client.end();
client.unref();
