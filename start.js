var domainSocket = '/tmp/humix-sense-blinking';
var sensorName   = 'humix-sense-blinking';
var natChannel   = 'humix.sense.eyelid.commands';
var workDir      = '/home/pi/humix/humix-sense/controls/humix-sense-blinking';
var pythonScript = workDir + '/blinking.py';
var GPIOPin      = 26;
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
    'stdio' : 'inherit'
//    'stdio' : ['inherit', 'ignore', 'ignore']
//    'stdio' : ['inherit', 'inherit', 'inherit']
};
//receive and process commands
nats.subscribe(natChannel, function(msg) {
    console.error('Received a message: ' + msg);
    processing = true;
    var jsonObj = JSON.parse(msg);
    var action = jsonObj.action;
    try {
        switch (action) {
            case('blink'):
                ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' blink 2', { 'cwd' : workDir, 'stdio': 'inherit'} );
                break;
            case('open'):
                ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' open', { 'cwd' : workDir, 'stdio': 'inherit'} );
                isClosed = false;
                break;
            case('close'):
                ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' close', { 'cwd' : workDir, 'stdio': 'inherit'} );
                isClosed = true;
                break;
            case('half'):
                ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' half', { 'cwd' : workDir, 'stdio': 'inherit'});
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
    var nextRandom = getRandomInt(8, 12);
    if ( processing || isClosed  ) {
        console.error('skipped random blink');
    } else {
        try {
            ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' blink 2', { 'cwd' : workDir, 'stdio': 'inherit'});
        } catch (e) {
            console.error('random blink failed' + e);
        }
    }
    setTimeout(randomBlink, nextRandom*1000);
}

//ok be sure to close the eye and wait for the signal to open
try {
    ps.execSync('sudo python ' + pythonScript + ' ' + GPIOPin + ' close', { 'cwd' : workDir, 'stdio': 'inherit'});
    isClosed = true;
    //still enable the random blink
    setTimeout(randomBlink, getRandomInt(8, 12) * 1000);
} catch (e) {
    console.error('initial open failed' + e);
}
