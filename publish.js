const ghpages = require('gh-pages');

ghpages.publish('docs', {
    src: ['./**/*', '../package.json'],
    branch: 'main',
    dest: 'docs',
    message: 'Live website',
}, (err) => {
    if (err) {
        console.error('Something went wrong publishing...\n', err);
    } else {
        console.info('Successfully published repo to GitHub pages!');
    }
});