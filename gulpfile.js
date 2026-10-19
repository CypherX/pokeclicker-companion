const gulp = require('gulp');
const replace = require('gulp-replace');
const esbuild = require('esbuild');
const browserSync = require('browser-sync');
const htmlImport = require('gulp-html-imports');
const del = require('del');
const fs = require('fs');
const { spawn } = require('child_process');
const gulpIf = require('gulp-if');
const rename = require('gulp-rename');

const srcs = {
    buildArtefacts: 'build/**/*',
    html: ['*.html', 'components/*.html'],
    scripts: 'src/**/*.ts',
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

const timestamp = new Date().getTime();

// Source maps are only emitted for local development builds, not the published website
let sourcemap = true;

// Tasks return their streams so gulp waits for files to be written before the next task runs
gulp.task('copy-package', () => gulp.src('./package.json').pipe(gulp.dest(`${dests.base}/`)));
gulp.task('copy-libs', () => gulp.src(srcs.libs).pipe(gulp.dest(dests.libs)));
// In series: creating build/ from two streams at once can fail on Windows
gulp.task('copy', gulp.series('copy-package', 'copy-libs'));

gulp.task('assets', () => gulp.src(srcs.assets)
        .pipe(gulp.dest(dests.assets))
        .pipe(browserSync.reload({stream: true})));

gulp.task('html_imports', () => {
    return gulp.src('./index.html')
      .pipe(htmlImport({
        componentsPath: './components/',
        nestedIncludes: true,
      }))
      .pipe(replace('{timestamp}', timestamp))
      .pipe(gulp.dest(dests.base))
      .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', async () => {
    await esbuild.build({
        entryPoints: ['src/main.ts'],
        outfile: `${dests.base}/bundle-${timestamp}.js`,
        bundle: true,
        format: 'iife',
        target: 'es2020',
        minify: true,
        sourcemap,
        logLevel: 'warning',
    });
    browserSync.reload();
});

// esbuild strips types without checking them, so type checking is a separate step
gulp.task('typecheck', (done) => {
    spawn('npm', ['run', 'typecheck'], { stdio: 'inherit', shell: true })
        .on('close', (code) => done(code ? new Error('Type check failed') : undefined));
});

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

gulp.task('styles', () => {
    return gulp.src(srcs.styles)
        .pipe(gulpIf(file => file.relative === 'styles.css', rename((path) => {
            path.basename = `styles-${timestamp}`;
        })))
        .pipe(gulp.dest(dests.styles))
        .pipe(browserSync.reload({stream: true}))
});

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

gulp.task('noSourcemaps', (done) => {
    sourcemap = false;
    done();
});

gulp.task('website', done => {
    gulp.series('typecheck', 'noSourcemaps', 'clean', 'build', 'cleanWebsite', 'copyWebsite', 'cname')(done);
});

gulp.task('default', done => {
    gulp.series('clean', 'build', 'browserSync')(done);
});
