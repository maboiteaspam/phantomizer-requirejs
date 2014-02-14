# phantomizer-requirejs v0.1.x

> RequireJS support for Phantomizer project

phantomizer-requirejs is a grunt task specialized
in optimizing javascript / css style assets given a Phantomizer project
using RequireJS tool.


Find out more about RequireJS

https://github.com/jrburke/requirejs

Find out more about Phantomizer

http://github.com/maboiteaspam/phantomizer


#### Example config

```javascript
{
  'phantomizer-requirejs': {         // Task
    confess: {                  // Target
      options: {                 // Target options
            src_paths: [],
            project_dir: '',
            vendors_path: '',
            almond_path: '',
            meta_file: '',

            out: '',
            logLevel: 4,
            optimize: 'uglify',
            excludeShallows: [],
            paths: {
                "almond":"path/to/almond",
                "vendors":"path/to/vendors",
                "yours":"path/to/yours",
            }
            "wrap": true,
            "name": "almond",
      }
    },
  'phantomizer-requirecss': {         // Task
    confess: {                  // Target
      options: {                 // Target options
            src_paths: [],
            project_dir: '',
            meta_file: '',

            out: '',
            logLevel: 4,
            optimizeCss: 'standard'
      }
    }
  }
}

```


## Release History


---

