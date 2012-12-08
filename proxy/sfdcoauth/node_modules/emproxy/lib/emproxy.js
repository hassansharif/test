"use strict";
var http = require('http');
var util = require('util');
var portfinder = require('portfinder');
var domain = require('domain');

var settings = new Object();
exports.settings = settings;
exports.settings.defaultTimeout = 300000;

var verbose;
var processDirective;

var timeOfLastRequest = new Date();
var initialConfig;

exports.init = function init(afterInit_cb) {
    readStdinOrArgs(function(initialText) {
        try {
            initialConfig = JSON.parse(initialText);
            settings.initialConfig = initialConfig;
        } catch(err) {
            console.log('Initial configuration data was not JSON.');
            console.log('Config data was: ');
            console.log(initialText);
            return;
        }

        verbose = initialConfig.verbose;

        afterInit_cb(initialConfig);
    });
}

exports.start = function start(processDirective_cb) {

    processDirective = processDirective_cb;

    // find a free port to start server
    portfinder.basePort = initialConfig.basePort || 9000;
    portfinder.getPort(function (err, port) {
        if(err) {
            console.log('Error finding available port for proxy: ');
            console.dir(e);
            return;
        }

        var apoptosisTimeout = initialConfig.timeout_param || exports.settings.defaultTimeout;

        http.createServer(onRequest).listen(port,null,function() {
            // The MMS expects the port number to be the first string written to stdout
            console.log("port: " + port);
            console.log('Server listening at URL http://localhost:'+port);
            console.log('Will exit after ' + apoptosisTimeout + 'ms idle time.');
            if(verbose) {
                console.log('Verbose logging on.');
                console.log('Initial configuration:');
                console.log(util.inspect(settings.initialConfig,false,null));
            }
        });

        // setup automatic termination after a timeout period of idleness
        setInterval(function apoptosisTimer() {
            var currentTime = new Date();
            if(currentTime.getTime() - timeOfLastRequest.getTime() > apoptosisTimeout) {
                console.log("Proxy exiting normally because there have been no new requests in the last " + apoptosisTimeout + " ms");
                process.exit(0);
            }
        }, 15000); // Check every 15 seconds

    });
}

function readStdinOrArgs(callback) {

    // Note that user-supplied args start at index 2
    if (process.argv.length >= 4) {
        if (process.argv[2] === "-config") {
            callback(process.argv[3]);
            return;
        }
    }
    var chunks = [];
    var stdin = process.stdin;
    stdin.resume();

    stdin.setEncoding('utf8');

    stdin.on('data', function(data) {
        chunks.push(data);
    });

    stdin.on('end', function() {
        var doc = chunks.join('');
        callback(doc);
    });
}

function onRequest(request, response) {
    timeOfLastRequest = new Date();

    var postData = "";

    request.setEncoding("utf8");

    request.addListener("data", function(postDataChunk) {
        postData += postDataChunk;
    });

    request.addListener("end", function() {

        response.writeHead(200, {"Content-Type": "application/json"});
        // Always return a 200 -- errors will be reported in body

        var requestDomain = domain.createDomain();
        requestDomain.run(function() {

            requestDomain.on('error', function(err) {
                var RestResponse = {targetType:'RestResponse',status:'ERROR',errors:[]};
                RestResponse.errors.push({targetType:'CdmError',errorCode:'integration.parseRequest',errorMessage:err.message,badRequest:postData,stack:err.stack})
                response.end(JSON.stringify(RestResponse, null, '\t')+'\n');
            });

            var requestData = JSON.parse(postData);
            processDirective(requestData,function(err,responseData){
                if(err) {
                    if(!err.errorCode) {
                        err.errorCode = 'integration.processDirective';
                    }
                    var RestResponse = {targetType:'RestResponse',status:'ERROR',errors:[]};

                    // Remove password and token from request credentials for logging
                    if(requestData.options && requestData.options.credentials) {
                        requestData.options.credentials = {
                            username: requestData.options.credentials.username
                        };
                    }

                    RestResponse.errors.push({targetType:'CdmError',errorCode:err.errorCode,errorMessage:err.message,badRequest:requestData,err:err})

                    console.log('Proxy returning error to MMS:');
                    //console.log(util.inspect(RestResponse,false,null));
                    console.dir(RestResponse);

                    response.end(JSON.stringify(RestResponse, null, '\t')+'\n');
                } else {
                    // Do some error checking in case processDirective is badly behaved
                    if(typeof responseData === 'undefined') {
                        responseData = new Object();
                        console.log('Undefined response returned for request: ' + postData);
                    } else if(responseData === null) {
                        responseData = new Object();
                        console.log('Null response returned for request: ' + postData);
                    } else if(responseData === '') {
                        responseData = new Object();
                        console.log('Empty string response returned for request: ' + postData);
                    }

                    var responseString = JSON.stringify(responseData, null, '\t')+'\n';

//                    if(verbose) {
//                        console.log('VERBOSE, REQUEST: ' + postData + ' RESPONSE: ' + responseString);
//                    }

                    response.end(responseString);
                }
            });
        });
    });
}
