var config = require('config');
var express = require('express'),
      fs = require('fs'),
      https = require('https'),
      compression = require('compression');

var app = express();
app.use(compression());

var timeout = 1000;
var opts = {
  hostname: config.get('etcdServer'),
  port: config.get('etcdPort'),
  path: '/health',
  method: 'GET',
  key: fs.readFileSync(config.get('Certificate.key')),
  cert: fs.readFileSync(config.get('Certificate.cert')),
  ca: fs.readFileSync(config.get('Certificate.ca')),
};

console.log(opts);

function getDataEtcd(namespace, rc, callback) {
  opts.path = "/v2/keys/kubernetes.io/services/endpoints/" + namespace + "/" + rc

  var req = https.request(opts, function(response) {

      if (response.statusCode != 200) {
        callback("Something wrong for your request",response.statusCode);
      } else {
        var body = '';
        response.on('data', function(d) {
          body += d;
        });
        response.on('end', function() {
          callback(JSON.parse(body), "200");
        });
        response.on('error', function (e) {
            console.error(e);
        });
      }
  });
  req.setTimeout(timeout, function() {
      req.abort();
      callback("Request timeout","408");
  });
  req.on('error', function (e) {
    if (e.code == "ECONNRESET") {
      console.log("Connection RESET");
      callback("Connection RESET","408");
    } else console.error(e);
  });
  req.end();
}

// rewrite json data
function handleResults(results){
  endpointsInformation = JSON.parse(results.node.value);
  endpoints = endpointsInformation.subsets[0].addresses;
  endpointPort = endpointsInformation.subsets[0].ports[0].port;

  value = [];
  endpoints.forEach(function(i){
    value.push("{ \"Node\": \"" + i.nodeName + "\" , \
                  \"Address\": \"" + i.ip + "\", \
                  \"ProjectName\": \"" + i.targetRef.namespace + "\", \
                  \"ServiceName\": \"" + endpointsInformation.metadata.name + "\", \
                  \"ServicePort\": \"" + endpointPort + "\", \
                  \"ServiceAddress\": \"" + i.ip + ":" + endpointPort + "\", \
                  \"ServiceURL\": \"http://" + i.ip + ":" + endpointPort + "\" \}")
    });
  return(JSON.stringify(value).replace(/\\/g, "").replace(/"{/g, "{").replace(/}"/g, "}"));

}

// get server endpoints
app.get('/services/:namespace/:replicationController', function(req, res){
  var start = Date.now();
  var namespace = req.params.namespace,
      rc = req.params.replicationController;

    getDataEtcd(namespace, rc, function(results,reqStatusCode){
      req.once('timeout', function () {
          clearTimeout(timeout);
      });

      if (reqStatusCode != "200"){
        res.status(reqStatusCode);
        res.end("[{\"message\": \"Getting some error\", \"Error\": \"" + results + "\"}]");
      } else {
        res.status("200");
        res.setHeader("Content-Type", "application/json");
        res.send(handleResults(results));
        console.log('Request took:', Date.now() - start, 'ms');
      }
    });
});

app.listen(3000, function () {
  console.log('kubernetes\'s service discovery tranform app listening on port 3000!')
  console.log("Running in :"  + process.env.NODE_ENV);
})
