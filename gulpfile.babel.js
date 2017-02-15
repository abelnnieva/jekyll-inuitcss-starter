import gulp         from 'gulp';
import util         from 'gulp-util';
import concat       from 'gulp-concat';
import header       from 'gulp-header';
import plumber      from 'gulp-plumber';
import babel        from 'gulp-babel';
import uglify       from 'gulp-uglify';
import autoprefixer from 'gulp-autoprefixer';
import sass         from 'gulp-sass';
import strip        from 'gulp-strip-css-comments';
import cleanCss     from 'gulp-clean-css';
import browserSync  from 'browser-sync';
import child        from 'child_process';
import hygienist    from 'hygienist-middleware';
import del          from 'del';
import fs           from 'fs';

let parsed = JSON.parse(fs.readFileSync('./package.json'));
let siteRoot = '_site';

let banner = (
  `/*! abelnieva.com | <%= author.name %> (c) ${new Date().getFullYear()} */\n`
);

let paths = {
  scripts: '_scripts/*.js',
  sass: {
    watch: ['_sass/*.scss', '_sass/*/*.scss'],
    dist: '_sass/main.scss'
  },
  markup: ['*.html', '*/*.html', '*.md', '*/*.md'],
  dist: 'assets/'
};

browserSync.create();

gulp.task('scripts', () => {
  return gulp.src(paths.scripts)
    .pipe(plumber())
    .pipe(babel())
    .pipe(concat('bundle.min.js'))
    .pipe(uglify())
    .pipe(header(banner, parsed))
    .pipe(gulp.dest(paths.dist + 'js'));
});

gulp.task('sass', () => {
  return gulp.src(paths.sass.dist)
    .pipe(concat('main.css'))
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(autoprefixer())
    //.pipe(cleanCss())
    .pipe(strip({all: true}))
    .pipe(header(banner, parsed))
    .pipe(gulp.dest(paths.dist + 'css'));
});

gulp.task('jekyll', (done) => {
  child.spawn(process.platform == 'win32' ? 'jekyll.bat' : 'jekyll', ['build'], {stdio: 'inherit'})
    .on('close', done);
});

gulp.task('reload', ['jekyll'], () => {
  browserSync.reload();
});

gulp.task('serve', ['jekyll'], () => {
  browserSync.init({
    files: [`${siteRoot}/**`],
    port: 4000,
    server: {
      baseDir: siteRoot,
      middleware: hygienist(siteRoot)
    }
  });
});

gulp.task('watch', ['serve'], () => {
  gulp.watch(paths.scripts, ['scripts', 'reload']);
  gulp.watch(paths.sass.watch, ['sass', 'reload']);
  gulp.watch(paths.markup, ['reload']);
});

gulp.task('default', ['scripts', 'sass', 'watch']);
