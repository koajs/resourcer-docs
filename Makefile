
test: lint
	@./node_modules/.bin/mocha test/*Spec.js

lint:
	@ find . -name "*.js" \
		-not -path "./node_modules/*" \
		-not -path "./coverage/*" -print0 | \
		xargs -0 ./node_modules/eslint/bin/eslint.js

test-cov: lint
	@NODE_ENV=test node \
		node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		-- -u exports \
		test/*Spec.js

open-cov:
	open coverage/lcov-report/index.html

.PHONY: test test-cov open-cov
