SRCS	= main.c font.c ftgrays.c render.c matrix.c glue.c mad.c
DEPS = misc.h ftgrays.h ftimage.h glue.h

# For ftgrays
#CFLAGS += -D_STANDALONE_

all: clean binaries mod install #test

binaries:
	./toC.js solid_fs.txt solid_gs.txt solid_vs.txt > binaries.h

mod:
	./binding.js $(SRCS)
	node-gyp configure build

clean:
	rm -f binaries.h binding.gyp
	rm -rf build/
test:
	killall -9 node || true
	node ../inkpoly.js

test2:	all
	killall node || true
	@if [ x$$E_NAME != x ]; then ./$$E_NAME ; else ./jsTest.js ; fi
INSTALLDIR=~/.node_modules/gfx
FROM=build/Release
CLONEDIR=obj.target/mod
install:
	@if [ -d $(INSTALLDIR) ]; then echo Cleaning $(INSTALLDIR); rm -rv $(INSTALLDIR); fi
	@echo Installing into $(INSTALLDIR)
	@mkdir -vp $(INSTALLDIR)
	@cp -v gfx.js $(INSTALLDIR)/index.js
	@cp -v matrix.js $(INSTALLDIR)
	@mkdir -vp $(INSTALLDIR)/$(CLONEDIR)
	@cp -v $(FROM)/mod.node $(INSTALLDIR)
	@cp -v $(FROM)/$(CLONEDIR)/* $(INSTALLDIR)/$(CLONEDIR)
