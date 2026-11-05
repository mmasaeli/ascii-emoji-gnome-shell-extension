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
.PHONY: lint test-all storage-test stage shexli package build-zip bump-version clean

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
PACKAGE_FILES := extension.js boxLayoutCompat.js storage.js emojis.json metadata.json LICENSE
DIST_DIR := dist
PACKAGE := $(DIST_DIR)/$(UUID).zip

lint:
	npm run lint

test-%:
	podman run --rm -v $(CURDIR):/repo:ro,Z -w /repo \
		$(IMAGE_$*) ./tests/run-in-container.sh $*

test-all: $(addprefix test-,$(VERSIONS)) storage-test

# Runtime test of storage.js under real gjs (catches what lint/Shexli can't,
# e.g. a broken async Gio call). Keep the image in sync with ci.yml.
STORAGE_TEST_IMAGE := ubuntu:24.04

storage-test:
	podman run --rm -v $(CURDIR):/repo:ro,Z -w /repo \
		$(STORAGE_TEST_IMAGE) ./tests/run-storage-test.sh

# Shexli = the extensions.gnome.org pre-review static analyzer. It is run on
# a staged copy holding exactly the files that ship in the zip, in a pinned
# python container (see tests/run-shexli.sh for why).
SHEXLI_IMAGE := python:3.12-slim
STAGE_DIR := $(DIST_DIR)/stage

stage:
	rm -rf $(STAGE_DIR)
	mkdir -p $(STAGE_DIR)
	cp $(PACKAGE_FILES) $(STAGE_DIR)/

shexli: stage
	podman run --rm -v $(CURDIR):/repo:ro,Z -w /repo \
		$(SHEXLI_IMAGE) ./tests/run-shexli.sh /repo/$(STAGE_DIR)

# All checks run before the bump, so a failing check never consumes a
# version number.
package: lint storage-test shexli bump-version
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
