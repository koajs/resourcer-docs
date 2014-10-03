
test:
	@./node_modules/.bin/mocha -A --harmony-generators test/*Spec.js

test-cov:
	@NODE_ENV=test node --harmony-generators \
		node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		-- -u exports \
		-A test/*Spec.js

open-cov:
	open coverage/lcov-report/index.html

.PHONY: test test-cov open-cov
