var domainSocket = '/tmp/humix-sense-blinking';
var sensorName   = 'humix-sense-blinking';
var natChannel   = 'humix-sense-blinking';
var workDir      = '/home/yhwang/humix/humix-sense/controls/humix-sense-blinking';
var pythonSCript = 'blinking.py';

var nats = require('nats').connect();

nats.publish(natChannel, 'blink', function() {
    console.error('command sent');
    nats.close();
});


