target=main
module=map

test:
	@$(MAKE) link
	@$(MAKE) kick

min: map.js
	@rm -f map.min.js
	@./node_modules/.bin/uglifyjs -nm -o map.min.js map.js
	@$(MAKE) test-min

link:
	@rm -f test/map.js
	@cd test && ln -s ../$(module).js map.js

kick:
	@./node_modules/.bin/highkick test/$(target).js

test-min:
	@$(MAKE) link module=map.min
	@$(MAKE) kick

benchmark:
	node benchmarks/index.js

.PHONY: test
