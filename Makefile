all clean:
	make -C lib $@
test:
	@killall node -q || true
	@if [ x$$E_NAME != x ]; then ./$$E_NAME ; else ./jsTest.js ; fi

STAMP:=$(shell date --utc +%Y%m%d-%H%M)
