/* jshint -W097 */// jshint strict:false
/*jslint node: true */
const expect = require('chai').expect;
const fs = require('fs');

describe('Test package.json and io-package.json', function() {
    it('Test package files', function (done) {
        let fileContentIOPackage = fs.readFileSync(__dirname + '/../io-package.json');
        let ioPackage = JSON.parse(fileContentIOPackage);

        let fileContentNPMPackage = fs.readFileSync(__dirname + '/../package.json');
        let npmPackage = JSON.parse(fileContentNPMPackage);

        expect(ioPackage).to.be.an('object');
        expect(npmPackage).to.be.an('object');

        expect(ioPackage.common.version).to.exist;
        expect(npmPackage.version).to.exist;

        if (!expect(ioPackage.common.version).to.be.equal(npmPackage.version)) {
            console.log('ERROR: Version numbers in package.json and io-package.json differ!!');
        }

        if (!ioPackage.common.news || !ioPackage.common.news[ioPackage.common.version]) {
            console.log('WARNING: No news entry for current version exists in io-package.json, no rollback in Admin possible!');
        }

        done();
    });
});