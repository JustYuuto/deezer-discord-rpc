const pngToIco = require('png-to-ico');
const { resolve } = require('path');
const { mkdirSync, writeFileSync } = require('fs');

pngToIco(resolve('src', 'img', 'IconTemplate.png')).then((buffer) => {
    mkdirSync(resolve('build', 'src', 'img'), { recursive: true });

    writeFileSync(resolve('src', 'img', 'IconTemplate.ico'), buffer);
    writeFileSync(resolve('build', 'src', 'img', 'IconTemplate.ico'), buffer);
});
