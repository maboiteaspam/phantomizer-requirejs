'use strict';

module.exports = function(grunt) {

    var requiresjs_handler = function(){
        var requirejs = require('requirejs')

        var ph_libutil = require("phantomizer-libutil");
        var meta = ph_libutil.meta;

        var wd = process.cwd()
        var meta_manager = new meta( wd )

        var options = this.options({
            logLevel: 4 //SILENT
        });

        var out_file = options.out
        var meta_file = options.meta
        var meta_dir = options.meta_dir
        var src_paths = options.src_paths || []
        grunt.verbose.writeflags(options, 'Options')

        if( meta_manager.is_fresh(options.meta) == false ){

            var entry = meta_manager.create([])

            var done = this.async();

            var finish = function(res, m){
                if( res == true ){
                    grunt.log.ok(m)
                    done(true);
                }else{
                    grunt.log.error(m)
                    done(false);
                }
            }

            var current_grunt_task = this.nameArgs
            var current_grunt_opt = this.options()


            delete options.src_paths;
            delete options.meta_dir;
            delete options.meta;
            var rjs_options = {}
            for( var n in options ){
                rjs_options[n] = options[n]
            }
            requirejs.optimize(rjs_options, function(response) {
                try{
                    var do_log = false;
                    var lines = response.split("\n")
                    for( var n in lines ){
                        var msg = lines[n]
                        if( msg == "----------------" ){
                            do_log = true
                            // in_file = lines[n-1]
                        }else if( do_log && msg != "" ){
                            var p_meta_file = find_abs_request(src_paths, msg)
                            if( p_meta_file != false && grunt.file.exists(meta_dir+p_meta_file+".meta") ){
                                var p_html_entry = meta_manager.load(meta_dir+p_meta_file+".meta")
                                entry.load_dependencies(p_html_entry.dependences)
                            }else{
                                entry.load_dependencies([msg])
                            }
                        }
                    }

                    if ( grunt.file.exists(process.cwd()+"/Gruntfile.js")) {
                        entry.load_dependencies([process.cwd()+"/Gruntfile.js"])
                    }
                    entry.load_dependencies([__filename])

                    entry.require_task(current_grunt_task, current_grunt_opt)
                    entry.save(meta_file, function(err){
                        if (err) finish(false, err);
                        else finish(true, "Created "+out_file);
                    })
                }catch(ex){
                    finish(false, ex);
                }
            });
        }else{
            grunt.log.ok("the build is fresh")
        }
    }

    grunt.registerMultiTask("phantomizer-requirejs", "Builds js dependencies of a requirejs file", requiresjs_handler);

    grunt.registerMultiTask("phantomizer-requirecss", "Builds css dependencies", requiresjs_handler);

    grunt.registerMultiTask("phantomizer-css-imgmerge", "Merge image for css files", function(){
        //-
        var ph_libutil = require("phantomizer-libutil");
        var HtmlUtils = ph_libutil.html_utils;
        var MetaFactory = ph_libutil.meta;
        var MetaManager = new MetaFactory( process.cwd() )

        var options = this.options();

        var paths = options.paths || false
        var out_file = options.out_file || false
        var meta_file = options.meta_file || false
        var meta_dir = options.meta_dir || false

        var in_request  = options.in_request || false
        var in_file     = must_find_in_paths(paths, in_request)
        var base_url    = find_base_url(paths, in_request)
        var abs_url     = find_abs_request(paths, in_request)

        var map = options.map || {
            /*
                abs_tgt_img_url:[
                    file_path_component
                    ,file_path_component1
                    ,file_path_component2
                }
             */
        }
        grunt.verbose.writeflags(options, 'Options')

        if( MetaManager.is_fresh(meta_file) == false ){

            var css_content = grunt.file.read(in_file)
            var entry = MetaManager.create([])
            var p_meta_file = find_in_paths([meta_dir], abs_url+".meta")
            if( p_meta_file != false ){
                var p_html_entry = MetaManager.load( p_meta_file )
                entry.load_dependencies(p_html_entry.dependences)
            }else{
                entry.load_dependencies([in_file])
            }

            var img_rules = HtmlUtils.find_img_rules(css_content, base_url)
            for( var n in img_rules ){
                var node = img_rules[n]
                var css_img_f = must_find_in_paths(paths, node.asrc)
                if( css_img_f != false ){
                    for( var tgt_img in map ){
                        for( var k in map[tgt_img] ){
                            var file_component = map[tgt_img][k]
                            if( file_component == css_img_f ){
                                // background:url('http://biscuithead.ie/images/logo.png') center no-repeat;
                                var r = new RegExp("background\\s*:\\s*url\\s*(\\(\\s*[\"'][^\"'']+[\"']\\s*\\))(\\s+[0-9]px)?(\\s+[0-9]px)?[^;]*;","i")
                                var matches = node.img.match(r)
                                if( matches != null ){
                                    var img_meta = MetaManager.load(meta_dir+tgt_img+".meta")

                                    entry.load_dependencies(img_meta.dependences)

                                    var x = img_meta.extras.map[file_component].x
                                    var y = img_meta.extras.map[file_component].y

                                    var n_rule = matches[0]

                                    // must be done in reverse order
                                    var oy = 0
                                    if( matches[4] ){
                                        oy = parseFloat(matches[4])
                                        n_rule = n_rule.replace(r[4], "-"+(y+oy)+"px")
                                    }else{
                                        n_rule = n_rule.replace(matches[1], matches[1]+"  -"+(y+oy)+"px")
                                    }
                                    var ox = 0
                                    if( matches[3] ){
                                        ox = parseFloat(matches[3])
                                        n_rule = n_rule.replace(matches[3], "-"+(x+ox)+"px")
                                    }else{
                                        n_rule = n_rule.replace(matches[1], matches[1]+"  -"+(x+ox)+"px")
                                    }

                                    n_rule = n_rule.replace(node.src, "/"+tgt_img)

                                    css_content = css_content.replace(matches[0], n_rule)
                                }
                            }
                        }
                    }
                }
            }

            var current_grunt_task = this.nameArgs
            var current_grunt_opt = this.options()
            if ( grunt.file.exists(process.cwd()+"/Gruntfile.js")) {
                entry.load_dependencies([process.cwd()+"/Gruntfile.js"])
            }
            entry.load_dependencies([in_file, __filename])

            entry.require_task(current_grunt_task, current_grunt_opt)
            entry.save(meta_file)

            grunt.file.write(out_file, css_content)
            grunt.log.ok("Created "+out_file)

        }else{
            grunt.log.ok("the build is fresh")
        }



    });



    function must_find_in_paths(paths, src){
        var retour = find_in_paths(paths, src)
        if( retour == false ){
            grunt.log.error("File not found : "+src)
        }
        return retour
    }
    function find_abs_request(paths, src){
        var Path = require("path");
        if( grunt.file.exists(src) ){
            var f = Path.resolve(src)
            for( var t in paths ){
                if(f.substring(0,paths[t].length) == paths[t] ){
                    return f.substr(paths[t].length)
                }
            }
        }
        for( var t in paths ){
            if( grunt.file.exists(paths[t]+src) ){
                var f = Path.resolve(paths[t]+src)
                return f.substr(paths[t].length)
            }
        }
        return false
    }

    function find_base_url(paths, src){
        var Path = require("path");
        var abs_request = find_abs_request(paths, src)
        if( abs_request != false )
            abs_request = Path.dirname(abs_request)+"/"
        return abs_request
    }

    function find_in_paths(paths, src){
        var Path = require("path");
        for( var t in paths ){
            if( grunt.file.exists(paths[t]+src) ){
                return Path.resolve(paths[t]+src)
            }
        }
        return false
    }
};