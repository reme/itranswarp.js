// test article api:

var fs = require('fs');

var
    _ = require('lodash'),
    async=require('async'),
    should = require('should');

var remote = require('./_test');

var log = console.log;

describe('#articles', function() {

    var category = null;

    before(remote.setup);

    before(function(done) {
        remote.post(remote.admin, '/api/categories', {
            name: 'Article Category'
        }, function(r) {
            r.name.should.equal('Article Category');
            r.id.should.be.ok.and.have.lengthOf(50);
            category = r;
            done();
        });
    });

    describe('#api', function() {

        it('should get empty articles', function(done) {
            remote.get(remote.guest, '/api/articles', null, function(r) {
                r.articles.length.should.equal(0);
                done();
            });
        });

        it('create and update article by editor', function(done) {
            // create article:
            remote.post(remote.editor, '/api/articles', {
                category_id: category.id,
                name: 'Test Article   ',
                description: '   blablabla\nhaha...  \n   ',
                tags: ' aaa,\n BBB,  \t ccc,CcC',
                content: '  Long content... '
            }, function(r2) {
                r2.category_id.should.equal(category.id);
                r2.name.should.equal('Test Article');
                r2.description.should.equal('blablabla\nhaha...');
                r2.tags.should.equal('aaa,BBB,ccc');
                r2.content.should.equal('Long content...');
                r2.cover_id.should.equal('');

                    // update article:
                    //remote.post(remote.editor, '/api/articles/' + r2.id, {
                    //    name: 'Name Changed'
                    //}, function(r3) {
                    //    assert.equal(r3.display_order, 1, 'display order should be 1 for second category.');
                    done();
                    //});
            });
        });

        it('create article with cover by editor', function(done) {
            // create article:
            remote.post(remote.editor, '/api/articles', {
                category_id: category.id,
                name: ' Test Article With Cover  ',
                description: '   blablabla\nhaha...  \n   ',
                tags: ' cover,\n CoveR',
                content: '  Article comes with cover...   ',
                file: remote.createReadStream('./test/res-image.jpg')
            }, function(r) {
                r.category_id.should.equal(category.id);
                r.name.should.equal('Test Article With Cover');
                r.description.should.equal('blablabla\nhaha...');
                r.tags.should.equal('cover');
                r.content.should.equal('Article comes with cover...');
                r.cover_id.should.be.ok;
                // check cover:
                remote.get(remote.guest, '/api/attachments/' + r.cover_id, null, function(r2) {
                    r2.id.should.equal(r.cover_id);
                    r2.name.should.equal(r.name);
                    r2.size.should.equal(346158);
                    // download image:
                    remote.download('/files/attachments/' + r2.id, function(content_type, content_length, content) {
                        content_type.should.equal('image/jpeg');
                        content_length.should.equal(346158);
                        done();
                    });
                });
            });
        });

        it('create article with wrong parameter by editor', function(done) {
            var create_missing_params = function(pname) {
                var r = {
                    name: 'Test',
                    description: 'blablabla...',
                    category_id: category.id,
                    tags: 'tag1,tag2,tag3',
                    content: 'a long content...'
                };
                delete r[pname];
                return r;
            };
            var tests = _.map(['name', 'category_id', 'content'], function(param) {
                return function(callback) {
                    remote.post(remote.editor, '/api/articles', create_missing_params(param), function(r) {
                        r.error.should.equal('parameter:invalid');
                        r.data.should.equal(param);
                        r.message.should.be.ok;
                        callback(null);
                    });
                };
            });
            async.series(tests, function(err, results) {
                done();
            });
        });
    });
});
