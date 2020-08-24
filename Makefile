all clean:
	make -C lib $@
test:
	@killall node -q || true
	@if [ x$$E_NAME != x ]; then ./$$E_NAME ; else ./jsTest.js ; fi

STAMP:=$(shell date --utc +%Y%m%d-%H%M)
DDIR:=/ram
DNAME:=jsGFX-$(STAMP)
export:
	svn export http://192.168.10.8/svn/jsGFX/trunk $(DDIR)/$(DNAME)
	tar czf $(DDIR)/$(DNAME).tgz -C $(DDIR) $(DNAME)
	rm -r $(DDIR)/$(DNAME)

release: export
	scp $(DDIR)/$(DNAME).tgz xdr@linuxmotors.com:www/jsGFX/
