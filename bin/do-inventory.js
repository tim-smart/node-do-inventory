#!/usr/bin/env node
"use strict";

var argv = require('optimist')
  .default('token', process.env['DO_TOKEN'])
  .alias('n', 'namespace')
  .argv;

var provhost = require('provhost');
var nautical = require('nautical');
var api = nautical.getClient({
  token: argv.token
});

module.exports = api;
api.droplets.list(function(error, res) {
  if (error) {
    throw error;
  }

  var droplets = res.body.droplets;
  var dropletHash = {
    _meta: {
      hostvars: {}
    }
  };
  var hostvars = dropletHash._meta.hostvars;

  droplets.forEach(function(droplet) {
    var meta = provhost.parse(droplet.name);
    var namespace = meta.id ? meta.namespace : 'all';

    dropletHash[namespace] || (dropletHash[namespace] = {
      hosts: []
    });
    dropletHash[namespace].hosts.push(droplet.name);

    var networks = {};
    droplet.networks.v4.forEach(function(network) {
      networks[network.type] = network;
    });
    hostvars[droplet.name] = {
      ansible_ssh_host: networks.public.ip_address
    };
  });

  console.log(JSON.stringify(dropletHash, null, 2));
});

// {
//     "databases"   : {
//         "hosts"   : [ "host1.example.com", "host2.example.com" ],
//         "vars"    : {
//             "a"   : true
//         }
//     },
//     "webservers"  : [ "host2.example.com", "host3.example.com" ],
//     "atlanta"     : {
//         "hosts"   : [ "host1.example.com", "host4.example.com", "host5.example.com" ],
//         "vars"    : {
//             "b"   : false
//         },
//         "children": [ "marietta", "5points" ]
//     },
//     "marietta"    : [ "host6.example.com" ],
//     "5points"     : [ "host7.example.com" ]
// }
