
test:
	@./node_modules/.bin/mocha test/*Spec.js

test-cov:
	@NODE_ENV=test node \
		node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		-- -u exports \
		test/*Spec.js

open-cov:
	open coverage/lcov-report/index.html

.PHONY: test test-cov open-cov
