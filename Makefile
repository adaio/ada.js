target=main
module=ak47

test:
	@$(MAKE) link
	@$(MAKE) kick

min:
	@rm -f ak47.min.js
	@./node_modules/.bin/uglifyjs -nm -o ak47.min.js ak47.js
	@$(MAKE) test-min

link:
	@rm -f test/ak47.js
	@cd test && ln -s ../$(module).js ak47.js

kick:
	@./node_modules/.bin/highkick test/$(target).js

test-min:
	@$(MAKE) link module=ak47.min
	@$(MAKE) kick

benchmark:
	node benchmarks/index.js

.PHONY: test
