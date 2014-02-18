'use strict';

module.exports = function(grunt) {
  //-
  var ph_libutil  = require("phantomizer-libutil");
  var path        = require("path");
  var requirejs   = require('requirejs');

  var HtmlUtils       = ph_libutil.html_utils;

  var requiresjs_handler = function(){

    var options = this.options({
      src_paths: [],
      project_dir: '',
      vendors_path: '',
      almond_path: '',
      meta_file: '',

      out: '',
      logLevel: 4
    });

    var out_file = options.out;
    var meta_file = options.meta_file;
    var vendors_path = options.vendors_path;
    var wbm_path = options.wbm_path;
    var almond_path = options.almond_path;

    var src_paths = options.src_paths || [];
    grunt.verbose.writeflags(options, 'Options');



    var Phantomizer = ph_libutil.Phantomizer;
    var phantomizer = new Phantomizer(process.cwd(),grunt);
    var meta_manager = phantomizer.get_meta_manager();

    if( meta_manager.is_fresh(meta_file) == false ){

      var entry = meta_manager.create([])

      var done = this.async();

      var finish = function(res, m){
        if( res == true ){
          grunt.log.ok(m)
        }else{
          grunt.log.error(m)
        }
        done(res == true);
      }

      var current_grunt_task = this.nameArgs;
      var current_grunt_opt = this.options();


      var excluded_options = [
        'src_paths',
        'almond_path',
        'vendors_path',
        'meta_file'
      ];
      var rjs_options = {}
      for( var n in options ){
        if( excluded_options.indexOf(n) == -1 )
          rjs_options[n] = options[n]
      }
      if( rjs_options.paths ){
        if( rjs_options.name=="almond" ){
          rjs_options.paths.almond = almond_path;
        }
        rjs_options.paths.vendors = vendors_path;
        rjs_options.paths.wbm = wbm_path;
      }

      requirejs.optimize(rjs_options, function(response) {
        try{
          var lines = parse_output(response);
          for( var n in lines ){
            var msg = lines[n];
            var p_html_entry = meta_manager.load(src_paths);
            entry.load_dependencies( p_html_entry.dependences );
            entry.load_dependencies([msg]);
          }

          entry.load_dependencies([__filename]);

          entry.require_task(current_grunt_task, current_grunt_opt);
          entry.save(meta_file, function(err){
            if (err) finish(false, err);
            else finish(true, "Created "+out_file);
          })
        }catch(ex){
          finish(false, ex);
        }
      });
    }else{
      grunt.log.ok("the build is fresh\n\t"+out_file)
    }
  }

  function parse_output(output){
    var do_log = false;
    var lines = output.split("\n");
    output = [];
    for( var n in lines ){
      var msg = lines[n];
      if( msg == "----------------" ){
        do_log = true;
      }else if( do_log && msg != "" ){
        output.push(msg);
      }
    }
    return output;
  }


  grunt.registerMultiTask("phantomizer-requirejs", "Builds js dependencies of a requirejs file", requiresjs_handler);

  grunt.registerMultiTask("phantomizer-requirecss", "Builds css dependencies", requiresjs_handler);

  grunt.registerMultiTask("phantomizer-css-imgmerge", "Merge image for css files", function(){
    //-
    var HtmlUtils = ph_libutil.html_utils;

    var options = this.options();

    var paths = options.paths || false;
    var out_file = options.out_file || false;
    var meta_file = options.meta_file || false;


    var Phantomizer = ph_libutil.Phantomizer;
    var phantomizer = new Phantomizer(process.cwd(),grunt);
    var meta_manager = phantomizer.get_meta_manager();

    var in_request  = options.in_request || false;
    var in_file     = must_find_in_paths(paths, in_request);
    var base_url    = find_base_url(paths, in_request);
    var abs_url     = find_abs_request(paths, in_request);

    var map = options.map || {
      /*
       abs_tgt_img_url:[
       file_path_component
       ,file_path_component1
       ,file_path_component2
       }
       */
    }
    grunt.verbose.writeflags(options, 'Options');

    if( meta_manager.is_fresh(meta_file) == false ){

      var css_content = grunt.file.read(in_file);

      var entry = meta_manager.create([]);
      var p_meta_file = abs_url+"";
      if(  meta_manager.has( p_meta_file ) ){
        var p_html_entry = meta_manager.load( p_meta_file );
        entry.load_dependencies(p_html_entry.dependences);
        for(var k in p_html_entry.build){
          var p_task_name = p_html_entry.build[k];
          var p_task_opt = p_html_entry.tasks_opts[p_task_name];
          entry.require_task(p_task_name, p_task_opt);
        }
      }
      entry.load_dependencies([in_file])

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
                  var img_meta = meta_manager.load(tgt_img+"")

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

      var current_grunt_task = this.nameArgs;
      var current_grunt_opt = this.options();
      entry.append_dependency(in_file)
      entry.append_dependency(__filename)

      entry.require_task(current_grunt_task, current_grunt_opt);
      entry.save(meta_file);

      grunt.file.write(out_file, css_content);
      grunt.log.ok("Created "+out_file);

    }else{
      grunt.log.ok("the build is fresh\n\t"+in_file)
    }
  });

  grunt.registerMultiTask("phantomizer-dir-css-imgmerge", "Directory Merge image for css", function(){

    var options = this.options();

    var paths = options.paths || false;
    var out_dir = options.out_dir || false;

    var map = options.map || {
      /*
       abs_tgt_img_url:[
       file_path_component
       ,file_path_component1
       ,file_path_component2
       }
       */
    }

    var Phantomizer = ph_libutil.Phantomizer;
    var phantomizer = new Phantomizer(process.cwd(),grunt);
    var meta_manager = phantomizer.get_meta_manager();

    var current_grunt_task = this.nameArgs;
    var current_grunt_opt = this.options();

    if( paths.toLowerCase)paths=[paths]

    for( var n in paths ){
      var p = paths[n];
      var css = grunt.file.expand(p+"**/*.css");
      for( var k in css ){
        var css_file = css[k];
        var out_file = out_dir+"/"+path.relative(p, css_file);
        img_merge_css_file(meta_manager, css_file, out_file, p, map, paths,current_grunt_task,current_grunt_opt);

      }
    }
    grunt.log.ok();
  });


  function img_merge_css_file(meta_manager, in_file, out_file, base_url, map, paths,current_grunt_task,current_grunt_opt){
    var css_content = grunt.file.read(in_file);
    var entry = meta_manager.create([]);

    var abs_url = "/"+path.relative(base_url, in_file);
    var css_base_url = path.dirname(abs_url)+"/";

    var p_html_entry = meta_manager.load( abs_url+"" );
    entry.load_dependencies(p_html_entry.dependences);

    var new_css_content = apply_img_merge(meta_manager, css_content, css_base_url, map, paths, entry);

    if( new_css_content != css_content ){
      entry.append_dependency(__filename);
      entry.append_dependency(in_file);

      entry.require_task(current_grunt_task, current_grunt_opt);
      entry.save(abs_url+"");

      grunt.file.write(out_file, css_content);
      grunt.log.ok("File parsed\n\t"+out_file);
    }else{
      grunt.log.ok("Nothing to change\n\t"+out_file);
    }
  }
  function apply_img_merge(meta_manager, css_content, base_url, map, paths, entry){

    var img_rules = HtmlUtils.find_img_rules(css_content, base_url);
    for( var n in img_rules ){
      var node = img_rules[n];
      var css_img_asrc = node.asrc;
      var css_img_f = must_find_in_paths(paths, node.asrc);

      if( css_img_f != false ){
        for( var tgt_img in map ){
          for( var k in map[tgt_img] ){
            var file_component = map[tgt_img][k];
            if( file_component == css_img_asrc ){
              // background:url('http://biscuithead.ie/images/logo.png') center no-repeat;
              var r = new RegExp("background(-image)?\\s*:\\s*url\\s*(\\(\\s*[\"'][^\"'']+[\"']\\s*\\))(\\s+[0-9]px)?(\\s+[0-9]px)?[^;]*;","i")
              var matches = node.img.match(r)
              if( matches != null ){
                var img_meta = meta_manager.load(tgt_img+"")

                entry.load_dependencies(img_meta.dependences);

                var x = img_meta.extras.map[css_img_f].x;
                var y = img_meta.extras.map[css_img_f].y;

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

                css_content = css_content.replace(matches[0], n_rule);
              }
            }
          }
        }
      }
    }

    return css_content;
  }



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