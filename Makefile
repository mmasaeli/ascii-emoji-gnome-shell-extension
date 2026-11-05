# Local reproduction of .github/workflows/ci.yml's box-layout-api matrix,
# using podman. Keep the version->image mapping below in sync with the
# matrix in that workflow.

IMAGE_46 := ubuntu:24.04
IMAGE_48 := debian:13
IMAGE_50 := ubuntu:26.04
IMAGE_51 := ubuntu:26.10

VERSIONS := 46 48 50 51

# Note: the pattern-matched test-NN targets below are intentionally not
# listed here - GNU Make treats an explicit (even recipe-less) .PHONY
# prerequisite as shadowing the test-% pattern rule, which breaks them.
.PHONY: lint test-all package build-zip bump-version clean

# Packaging: `make package` bumps the integer "version" in metadata.json
# (extensions.gnome.org requires a higher one for every upload), then builds a
# zip containing only the files GNOME Shell needs at runtime (no tests, CI
# config, node_modules, etc.). Install it with `gnome-extensions install` or
# upload it to extensions.gnome.org.
#
# These use recursive (=) expansion on purpose: VERSION must be read after
# the bump step has rewritten metadata.json.
UUID = $(shell node -p "require('./metadata.json').uuid")
VERSION = $(shell node -p "require('./metadata.json').version")
PACKAGE_FILES := extension.js boxLayoutCompat.js emojis.json metadata.json LICENSE
DIST_DIR := dist
PACKAGE := $(DIST_DIR)/$(UUID).v$(VERSION).shell-extension.zip

lint:
	npm run lint

test-%:
	podman run --rm -v $(CURDIR):/repo:ro,Z -w /repo \
		$(IMAGE_$*) ./tests/run-in-container.sh $*

test-all: $(addprefix test-,$(VERSIONS))

# Lint runs first so a failing lint never consumes a version number.
package: lint bump-version
	@$(MAKE) --no-print-directory build-zip

# Separate target (run via sub-make) so VERSION is evaluated after the bump:
# make expands a whole recipe before running it.
build-zip:
	mkdir -p $(DIST_DIR)
	rm -f $(PACKAGE)
	zip -X -j $(PACKAGE) $(PACKAGE_FILES)
	@unzip -l $(PACKAGE)

clean:
	rm -rf $(DIST_DIR)

bump-version:
	@node -e "const fs=require('fs');const p='metadata.json';let v;fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/(\"version\":\\s*)(\\d+)/,(m,a,b)=>{v=Number(b)+1;return a+v}));console.log('version bumped to '+v)"
