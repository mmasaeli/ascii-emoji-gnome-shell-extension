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
.PHONY: lint test-all

lint:
	npm run lint

test-%:
	podman run --rm -v $(CURDIR):/repo:ro,Z -w /repo \
		$(IMAGE_$*) ./tests/run-in-container.sh $*

test-all: $(addprefix test-,$(VERSIONS))
