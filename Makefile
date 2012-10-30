module=main

test:
	@./node_modules/.bin/highkick test/$(module).js

benchmark:
	node benchmarks/index.js

.PHONY: test
