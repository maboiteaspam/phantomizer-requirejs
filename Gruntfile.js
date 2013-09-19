
module.exports = function(grunt) {

    var d = __dirname+"/vendors/phantomizer-requirejs";

    var in_dir = d+"/demo/in/";

    var out_dir = d+"/demo/out/";
    var meta_dir = d+"/demo/out/";


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')

        ,"out_dir":out_dir
        ,"meta_dir":meta_dir

        ,'phantomizer-requirejs': {
            options: {
                "baseUrl": in_dir+"/js"
                ,"paths": {
                    "almond": in_dir+"/js/almond-0.2.5"
                    ,"jquery": in_dir+"/js/jquery-1.10.2.min"
                }
                ,"optimize": "none"
                ,"wrap": true
                ,"name": "almond"
            }
            ,test: {
                "options":{
                    "out": "<%= out_dir %>/js/customer-ui-build.js"
                    ,"meta": "<%= meta_dir %>/customer-ui-build.js.meta"
                    ,"include": ["customer-ui"]
                    ,"insertRequire": ["customer-ui"]
                }
            }
            ,testmin: {
                options:{
                    "optimize": "uglify"
                    ,"out": "<%= out_dir %>/js/customer-ui-build-min.js"
                    ,"meta": "<%= meta_dir %>/customer-ui-build-min.js.meta"
                    ,"include": ["customer-ui"]
                    ,"insertRequire": ["customer-ui"]
                }
            }
        }
        //-
        ,'phantomizer-requirecss': {
            options: {
                "optimizeCss": "none"
            }
            ,test: {
                "options":{
                    "cssIn": in_dir+"/css/header.css"
                    ,"out": "<%= out_dir %>/css/header-build.js"
                    ,"meta": "<%= meta_dir %>/header-build.js.meta"
                    ,"picture_merge": {
                        'img-opt2.png':['img.png','img-2.png']
                    }
                }
            }
            ,testmin: {
                options:{
                    "cssIn": in_dir+"/css/header.css"
                    ,"optimizeCss": "standard"
                    ,"out": "<%= out_dir %>/css/header-build-min.css"
                    ,"meta": "<%= meta_dir %>/header-build-min.css.meta"
                }
            }
        }
        //-
        ,'phantomizer-css-imgmerge': {
            options: {
            }
            ,test: {
                "options":{
                    "in_request": "/css/header.css"
                    ,"out_file":"<%= out_dir %>/css/header-merge.css"
                    ,"meta_file":"<%= meta_dir %>/css/heade-merger.css.meta"
                    ,"meta_dir":"<%= meta_dir %>"
                    ,"map": {
                        '/images/img-opt2.png':['/images/img.png','/images/img-2.png']
                    }
                    ,"paths": [in_dir,out_dir]
                }
            }
            ,testmin: {
                options:{
                    "in_request": "/css/header.css"
                    ,"out_file":"<%= out_dir %>/css/header-merge.css"
                    ,"meta_file":"<%= meta_dir %>/css/heade-merger.css.meta"
                    ,"meta_dir":"<%= meta_dir %>"
                    ,"map": {
                        '/images/img-opt2.png':['/images/img.png','/images/img-2.png']
                    }
                    ,"paths": [in_dir,out_dir]
                }
            }
        }
    });

    grunt.loadNpmTasks('phantomizer-requirejs');


    grunt.registerTask('default',
        [
            'phantomizer-requirejs:testmin'
            ,'phantomizer-requirecss:testmin'
        ]);
};
