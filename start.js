var domainSocket = '/tmp/humix-sense-blinking';
var sensorName   = 'humix-sense-blinking';
var natChannel   = 'humix-sense-blinking';
var workDir      = '/home/yhwang/humix/humix-sense/controls/humix-sense-blinking';
var pythonSCript = 'blinking.py';
var GPIOPin      = 4;
var processing   = false;
var isClosed     = true;

var net  = require('net');
var fs   = require('fs');
var ps   = require('child_process');
var nats = require('nats').connect();//connect immediately

//unlink domainSocket anyway
try {
    fs.unlinkSync(domainSocket);
} catch (e) {}

//the following server is only used for shutdown service
//once someone connects to the domain socket and close
//this service will shutdown
var server = net.createServer(function(conn) { 
    conn.on('end', function () {
        nats.close();
        fs.unlinkSync(domainSocket);
        server.unref();
    });
});

server.on('error', function (err) {
    console.error('failed to start service,' + err);
    nats.close();
    fs.unlinkSync(domainSocket);
    server.unref();
});

try {
    server.listen(domainSocket, function() {
        console.log('start to listen on ' + domainSocket);
    });
} catch (e) {
    console.error('failed to start service,' + err);
    nats.close();
    fs.unlinkSync(domainSocket);
    server.unref();
}

var psOpt = {
    'cwd' : workDir,
    'stdio' : ['inherit', 'ignore', 'ignore']
    //'stdio' : ['inherit', 'ignore', 'inherit']
};
//receive and process commands
nats.subscribe(natChannel, function(msg) {
    console.error('Received a message: ' + msg);
    processing = true;
    try {
        switch (msg) {
            case('blink'):
                ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' blink 2', psOpt);
                break;
            case('open'):
                ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' open', psOpt);
                isClosed = false;
                break;
            case('close'):
                ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' close', psOpt);
                isClosed = true;
                break;
            case('half'):
                ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' half', psOpt);
                isClosed = true;
                break;
            default:
                break;
        }
    } catch (e) {
        console.error('execution of command:' + msg + ' failed');
    }
    processing = false;
});


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomBlink() {
    var nextRandom = getRandomInt(10, 15);
    if ( processing || isClosed  ) {
        console.error('skipped random blink');
    } else {
        try {
            ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' blink 2', psOpt);
        } catch (e) {
            console.error('random blink failed');
        }
    }
    setTimeout(randomBlink, nextRandom*1000);
}

//ok lets open the eyes and start random blink
try {
    ps.execSync('sudo python ' + pythonSCript + ' ' + GPIOPin + ' open', psOpt);
    isClosed = false;
    setTimeout(randomBlink, getRandomInt(10, 15) * 1000);
} catch (e) {
    console.error('initial open failed');
}
