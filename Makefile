NODE = node
TEST = ./node_modules/.bin/vows
TESTS ?= test/*-test.js test/**/*-test.js

test:
	@NODE_ENV=test NODE_PATH=lib $(TEST) $(TEST_FLAGS) $(TESTS)

docs: docs/api.html

docs/api.html: lib/oauth2orize/*.js
	dox \
		--title oauth2orize \
		--desc "OAuth 2.0 authorization server toolkit for Node.js" \
		$(shell find lib/oauth2orize/* -type f) > $@

docclean:
	rm -f docs/*.{1,html}

.PHONY: test docs docclean
