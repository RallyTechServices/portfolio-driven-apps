var module = module;
//this keeps the module file from doing anything inside the jasmine tests.
//We could avoid this by making all the source be in a specific directory, but that would break backwards compatibility.
if (module) {
    module.exports = function (grunt) {
        'use strict';
        var auth_file_name = 'auth.json';

        var config, debug, environment, spec, port;
        grunt.loadNpmTasks('grunt-contrib-jasmine');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-connect');

        grunt.registerTask('test', ['jshint', 'jasmine']);
        grunt.registerTask('default', ['test']);
        grunt.registerTask('test:debug', ['jasmine:app:build', 'connect']);

        spec = grunt.option('spec') || '*';
        port = grunt.option('port') || 7357;
        debug = grunt.option('debug') || false;
        config = grunt.file.readJSON('config.json');


        if ( grunt.file.exists(auth_file_name) ) {
            var auth = grunt.file.readJSON(auth_file_name);
            config.auth = auth
        } else {
            grunt.log.writeln("");
            grunt.log.writeln("WARNING: no auth.json file");
        }
        grunt.registerTask('install', 'Deploy the app to a rally instance', function() {

            if ( ! config.auth ) {
                grunt.log.writeln("To deploy, define server, username and password in auth.json file");
                return;
            }
            var valid = true;
            if ( !config.auth.server || config.auth.server == "" ) {
                grunt.log.writeln("To deploy, server must be defined in the auth.json file");
                valid = false;
            }

            if ( !config.auth.username || config.auth.username == "" ) {
                grunt.log.writeln("To deploy, username must be defined in the auth.json file");
                valid = false;
            }

            if ( !config.auth.password || config.auth.password == "" ) {
                grunt.log.writeln("To deploy, password must be defined in the auth.json file");
                valid = false;
            }

            if ( !valid ) { return; }

            var done = this.async();
            var request = require('request');

            var j = request.jar();
            request.defaults({jar: j});

            var installApp = function(page_oid,panel_oid) {
                var html = grunt.file.read('deploy/App.html');

                var uri = config.auth.server + "/slm/dashboard/changepanelsettings.sp";
                grunt.log.writeln('URI:', uri);
//            grunt.log.writeln('Page OID', page_oid);
//            grunt.log.writeln('Panel OID', panel_oid);

                var parameters = {
                    cpoid:10909656256,
                    _slug:'/custom/' + page_oid
                };

                var payload = {
                    oid: panel_oid,
                    settings: JSON.stringify({
                        "title": config.name,
                        "project": null,
                        "content": html,
                        "autoResize": true
                    }),
                    dashboardName: 'myhome' + page_oid
                };

                grunt.log.writeln('Installing app:', config.auth.server + "/#/custom/" + page_oid);

                var options = {
                    uri: uri,
                    form: payload,
                    qs: parameters,
                    jar: j
                };

                request.post(options, function(error,response,body){
                    if ( response.statusCode != 200 ) {
                        grunt.log.writeln('oops');
                    }
                    //grunt.log.writeln('response body', body);
                    grunt.log.writeln('done');
                });
            };

            var makeApp = function(key,page_oid) {
                var uri = config.auth.server + "/slm/dashboard/addpanel.sp";
//            grunt.log.writeln('URI:', uri);

                var parameters = {
                    cpoid:10909656256,
                    _slug:'/custom/' + page_oid
                };

                var payload = {
                    panelDefinitionOid:431632107,
                    col:0,
                    index:0,
                    dashboardName: 'myhome' + page_oid
                };

                grunt.log.writeln('Creating app on page', page_oid);

                var options = {
                    uri: uri,
                    form: payload,
                    qs: parameters,
                    jar: j
                };

                request.post(options, function(error,response,body){
                    if ( response.statusCode != 200 ) {
                        grunt.log.writeln('oops');
                    }
                    //grunt.log.writeln('response body', body);
                    // looking for
                    // {"oid":52337581989}
                    var response_object = JSON.parse(body);

                    // save IDs:
                    grunt.log.writeln('Save IDs');
                    config.auth.pageOid = page_oid;
                    config.auth.panelOid = response_object.oid;
                    grunt.file.write(auth_file_name,JSON.stringify(config.auth,null,'\t') + "\r\n");

                    grunt.log.writeln('Created panel with oid:', response_object.oid);
                    installApp(page_oid,response_object.oid);
                });
            };

            var makePage = function(key) {
                var uri = config.auth.server + "/slm/wt/edit/create.sp";
                var parameters = {
                    cpoid:729766,
                    key: key
                };

                var payload = {
                    name: "*" + config.name,
                    editorMode: 'create',
                    pid: 'myhome',
                    oid: 6440917,
                    timeboxFilter:'none'
                };

                grunt.log.writeln('Creating page:', payload.name);

                var options = {
                    uri: uri,
                    form: payload,
                    qs: parameters,
                    jar: j
                };

                request.post(options, function(error,response,body){
                    //grunt.log.writeln('responseCode:', response.statusCode);
                    if ( response.statusCode != 200 ) {
                        grunt.log.writeln('oops');
                        //grunt.log.writeln('--', response.headers);
                        //grunt.log.writeln('--', response.request.headers);
                        //grunt.log.writeln('--', response.request.body);
                    }
                    //grunt.log.writeln('response:', response);
                    //grunt.log.writeln('response body', body);
                    // looking for
                    // <input type="hidden" name="oid" value="52337144851"/>
                    var page_oid = body.replace(/(.|[\r\n])*name="oid"/,"").replace(/"\/\>(.|[\r\n])*/,"").replace(/.*"/,"");

                    grunt.log.writeln('Created', payload.name, " at oid:", page_oid);

                    makeApp(key,page_oid)
                });
            };

            var uri = config.auth.server + "/slm/webservice/v2.0/security/authorize";

            var options = {
                uri: uri,
                method:'GET',
                auth: { 'user': config.auth.username, 'pass': config.auth.password, 'sendImmediately': true }
            };

            grunt.log.writeln('Authenticating on ', config.auth.server, ' as ', config.auth.username);

            request.get(options, function(error,response,body){
                    if ( response.statusCode != 200 ) {
                        grunt.log.writeln('oops: couldn not log in');
                    } else {
                        var json = JSON.parse(body);
                        var key = json.OperationResult.SecurityToken;

                        var cookie = response.headers['set-cookie'];

                        for ( var i=0; i<cookie.length; i++ ) {
                            j.setCookie(request.cookie(cookie[i]),config.auth.server);
                        }

                        if (!config.auth.pageOid && !config.auth.panelOid) {
                            makePage(key);
                        } else {
                            installApp(config.auth.pageOid, config.auth.panelOid);
                        }
                    }
                }
            );


        });



        return grunt.initConfig({

            pkg: grunt.file.readJSON('package.json'),

            jasmine: {
                app: {
                    src: config.javascript,
                    options: {
                        styles: config.css,
                        vendor:[
                          'node_modules/rally-sdk2-test-utils/src/sdk/' + config.sdk + '/sdk-debug.js',
                          'node_modules/rally-sdk2-test-utils/dist/sdk2-test-utils.js'
                        ],
                        template: 'node_modules/rally-sdk2-test-utils/lib/specs.tmpl',
                        specs: "test/**/" + spec + "Spec.js",
                        keepRunner: true
                    }
                }
            },

            jshint: {
                all: ['test/**/*.js']
            },

            connect: {
                server: {
                    options: {
                        port: port,
                        open: {
                            target: 'http://localhost:' + port + '/_SpecRunner.html'
                        },
                        keepalive: true
                    }
                }
            }
        });
    };



}
