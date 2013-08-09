var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

var cheerio = require('cheerio');
var sys = require('sys');
var exec = require('child_process').exec;

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var yeomanConfig = {
    app: 'src',
    dist: 'dist'
  };

  grunt.initConfig({
    yeoman: yeomanConfig,
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      temp: {
        files: [{
          dot: true,
          src: [
            '.tmp'
          ]
        }]
      }
    },
    useminPrepare: {
      options: {
        dest: '<%= yeoman.dist %>'
      },
      html: '<%= yeoman.app %>/index.html'
    },
    usemin: {
      options: {
        dirs: ['<%= yeoman.dist %>']
      },
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/css/{,*/}*.css']
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            'img/{,*/}*.{webp,gif}',
            'css/fonts/*'
          ]
        }]
      },
      styles: {
        expand: true,
        dot: true,
        cwd: '<%= yeoman.app %>/css',
        dest: '<%= yeoman.dist %>/css',
        src: '**/*.css'
      }
    },
    concat: {
      dist: {
        options: {
          banner: '<!-- AD ID: %eaid! -->\n\n',
          process: {
            data: {
              clickTracker: '%%CLICK_URL_UNESC%%',
              clickTrackerEsc: '%%CLICK_URL_ESC%%',
              clickTag: '%%DEST_URL%%'
            }
          }
        },
        files: {
          '<%= yeoman.dist %>/dfp.html': '<%= yeoman.dist %>/index.html'
        }
      },
      dev: {
        options: {
          banner: '<!DOCTYPE html>\n<html>\n<head>\n  <title><%= pkg.name %>: Test Page</title>\n</head>\n<body>\n\n',
          footer: '\n\n</body>\n</html>',
          process: {
            data: {
              clickTracker: '',
              clickTrackerEsc: '',
              clickTag: 'http://www.example.com'
            }
          }
        },
        files: {
          '<%= yeoman.dist %>/index.html': '<%= yeoman.dist %>/index.html'
        }
      }
    },
    htmlmin: {
      dist: {
        options: {
          //removeComments: true
          //collapseWhitespace: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: '*.html',
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    jshint: {
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: ['<%= yeoman.app %>/js/*.js']
      }
    },
    uglify: {
      options: {
        sourceMap: '<%= yeoman.dist %>/js/main.map.js'
      }
    },
    compass: {
      dist: {
        options: {
          config: 'config.rb'
        }
      }
    },
    watch: {
      options: {
        nospawn: true
      },
      build_html: {
        files: [],
        tasks: []
      },
      build_js: {
        files: ['<%= yeoman.app %>js/**/*.js'],
        tasks: ['build_js']
      },
      build_css: {
        files: ['<%= yeoman.app %>/sass/**/*.sass'],
        tasks: ['build_css']
      },
      tests: {
        files: ['test/**/*'],
        tasks: ['qunit']
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          '<%= yeoman.dist %>/*.html',
          '<%= yeoman.dist %>/js/*.js',
          '<%= yeoman.dist %>/css/*.css',
          '<%= yeoman.dist %>/img/*'
        ]
      }
    },
    connect: {
      options: {
        port: 5000,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, './dist')
            ];
          }
        }
      }
    },
    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      }
    },
    qunit: {
      all: ['test/**/*.html']
    },
    absolute: {
      dist: {
        src: '<%= yeoman.dist %>/dfp.html',
        path: 'wp-adv/test/mstest/grunt-test',
        www: 'http://www.washingtonpost.com',
        css: 'http://css.washingtonpost.com',
        img: 'http://img.wpdigital.net',
        js: 'http://js.washingtonpost.com'
      }
    }
  });

  grunt.registerMultiTask('absolute', 'Make URLs absolute', function(){

    console.log('Transforming relative URL\'s --> absolute URL\'s for: ' + this.data.src);

    var data = this.data;
    var src = data.src;
    var defaultBase = 'http://www.washingtonpost.com';
    var path = data.path.replace(/^\//, '').replace(/\/$/, '');
    var urls = {
      www: (data.www ? data.www.replace(/\/$/, '') : defaultBase) + '/' + path,
      img: (data.img ? data.img.replace(/\/$/, '') : defaultBase) + '/' + path,
      js: (data.js ? data.js.replace(/\/$/, '') : defaultBase) + '/' + path,
      css: (data.css ? data.css.replace(/\/$/, '') : defaultBase) + '/' + path
    };

    var $ = cheerio.load(grunt.file.read(data.src));


    $('script').each(function(){
      var src = $(this).attr('src'), newSrc;
      if(src && !/^http|^\/\/\:/.test(src)){
        newSrc = urls.js + '/' + src.replace(/^\//, '');
        $(this).attr('src', newSrc);
      }
    });

    $('img').each(function(){
      var src = $(this).attr('src'), newSrc;
      if(src && !/^http|^\/\/\:/.test(src)){
        newSrc = urls.img + '/' + src.replace(/^\//, '');
        $(this).attr('src', newSrc);
      }
    });

    $('link').each(function(){
      var href = $(this).attr('href'), newHref;
      if(href && !/^http|^\/\/\:/.test(href)){
        newHref = urls.css + '/' + href.replace(/^\//, '');
        $(this).attr('href', newHref);
      }
    });

    grunt.file.write(data.src, $.html());
  })

  grunt.registerTask('default', [
    'clean:dist',
    'compass',
    'useminPrepare',
    'concat',
    'uglify',
    'cssmin',
    'htmlmin',
    'copy:dist',
    'usemin',
    'concat:dist',
    'concat:dev',
    'absolute:dist'
  ]);

};
