target=main
module=ada

test:
	@$(MAKE) link
	@$(MAKE) kick

min: ada.js
	@rm -f ada.min.js
	@./node_modules/.bin/uglifyjs -nm -o ada.min.js ada.js
	@$(MAKE) test-min

link:
	@rm -f test/ada.js
	@cd test && ln -s ../$(module).js ada.js

kick:
	@./node_modules/.bin/highkick test/$(target).js

test-min:
	@$(MAKE) link module=ada.min
	@$(MAKE) kick

benchmark:
	node benchmarks/index.js

.PHONY: test
