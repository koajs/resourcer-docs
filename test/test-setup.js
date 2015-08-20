'use strict';

// patch mocha to accept generators
require('co-mocha');

// patch supertest so that end() with no parameters returns a generator
require('co-supertest');
