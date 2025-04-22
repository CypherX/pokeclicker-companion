const gulp = require('gulp');
const replace = require('gulp-replace');
const browserify = require('browserify');
const browserSync = require('browser-sync');
const htmlImport = require('gulp-html-imports');
const del = require('del');
const source = require('vinyl-source-stream');
const fs = require('fs');

const srcs = {
    buildArtefacts: 'build/**/*',
    //scripts: ['src/scripts/**/*.ts', 'src/modules/**/*.ts'],
    //html: ['src/*.html', 'src/templates/*.html', 'src/components/*.html'],
    //ejsTemplates: ['src/templates/*.ejs'],
    html: ['*.html', 'components/*.html'],
    scripts: 'scripts/**/*.js',
    styles: 'styles/**/*.css',
    assets: 'assets/**/*',
    libs: 'libs/*.js',
};

const dests = {
    base: 'build',
    libs: 'build/libs/',
    assets: 'build/assets/',
    scripts: 'build/scripts/',
    styles: 'build/styles/',
    githubPages: 'docs/',
};

gulp.task('copy', (done) => {
    gulp.src('./package.json').pipe(gulp.dest(`${dests.base}/`));

    gulp.src(srcs.libs)
        .pipe(gulp.dest(dests.libs));

    done();
});

gulp.task('assets', () => gulp.src(srcs.assets)
        .pipe(gulp.dest(dests.assets))
        .pipe(browserSync.reload({stream: true})));

gulp.task('html_imports', (done) => {
    gulp.src('./index.html')
      .pipe(htmlImport({
        componentsPath: './components/',
        nestedIncludes: true,
      }))
      .pipe(replace('{timestamp}', new Date().getTime()))
      .pipe(gulp.dest(dests.base))
      .pipe(browserSync.reload({stream: true}));
    done();
});

gulp.task('scripts', () =>  
    browserify('scripts/main.js')
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest(dests.base))
        .pipe(browserSync.reload({stream: true})));

/*gulp.task('pokeclicker', (done) => {
    gulp.src([
        'pokeclicker/docs/scripts/modules.min.js',
        'pokeclicker/docs/scripts/script.min.js',
    ])
    .pipe(gulp.dest('build/pokeclicker/scripts'));

    gulp.src([
        'pokeclicker/docs/libs/jquery.min.js',
        'pokeclicker/docs/libs/knockout-latest.js',
    ])
    .pipe(gulp.dest('build/pokeclicker/libs'));

    done();
});*/

gulp.task('pokeclicker-scripts', () => {
    return gulp.src([
        'pokeclicker/docs/scripts/modules.min.js',
        'pokeclicker/docs/scripts/script.min.js',
    ])
    .pipe(gulp.dest('build/pokeclicker/scripts'));
});

gulp.task('pokeclicker-libs', () => {
    return gulp.src([
        'pokeclicker/docs/libs/jquery.min.js',
        'pokeclicker/docs/libs/knockout-latest.js',
    ])
    .pipe(gulp.dest('build/pokeclicker/libs'));
});

gulp.task('pokeclicker-assets', () => {
    return gulp.src([
        'pokeclicker/docs/assets/sounds/*.mp3',
    ])
    .pipe(gulp.dest('build/assets/sounds'));
});

gulp.task('styles', () => gulp.src(srcs.styles)
        .pipe(gulp.dest(dests.styles))
        .pipe(browserSync.reload({stream: true})));

gulp.task('browserSync', () => {
    browserSync({
        server: {
            baseDir: dests.base,
        },
        port: 3010,
        ghostMode: false,
    });

    gulp.watch(srcs.assets, gulp.series('assets'));
    gulp.watch(srcs.html, gulp.series('html_imports'));
    gulp.watch(srcs.scripts, gulp.series('scripts'));
    gulp.watch(srcs.styles, gulp.series('styles'));
});

gulp.task('build', done => {
    gulp.series('copy', 'assets', 'html_imports', 'scripts', 'styles', 'pokeclicker-scripts', 'pokeclicker-libs', 'pokeclicker-assets')(done);
});

gulp.task('clean', () => del([dests.base]));

gulp.task('cleanWebsite', () => del([dests.githubPages]));

gulp.task('copyWebsite', () => {
    return gulp.src(srcs.buildArtefacts).pipe(gulp.dest(dests.githubPages));
});

gulp.task('cname', (done) => {
    fs.writeFile(`${dests.githubPages}CNAME`, 'companion.pokeclicker.com', done);
});

gulp.task('website', done => {
    gulp.series('clean', 'build', 'cleanWebsite', 'copyWebsite', 'cname')(done);
});

gulp.task('default', done => {
    gulp.series('clean', 'build', 'browserSync')(done);
});
