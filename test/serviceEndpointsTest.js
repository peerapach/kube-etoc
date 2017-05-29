//process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Client request', () => {
  it('should return status code with text', (done) => {
    chai.request('http://localhost:3000')
        .get('/services/default/docker-registry')
        .end((err, res) => {
          expect(res.statusCode).to.equal(200);
          done();
    });
  })
})
