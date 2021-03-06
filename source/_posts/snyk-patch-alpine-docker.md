---
title: Snyk failed to patch in Alpine docker
excerpt: Synk depends on GNU version of patch utility.
date: 2018-10-31
updated: 2019-03-09
tags:
- snyk
- linux
- security
- alpine
---

Snyk initially runs fine on Alpine, until you try to `snyk protect` to patch the modules. Turns out Synk depends on GNU version of `patch` utility.

***Edit:*** Snyk [v1.131.0](https://github.com/snyk/snyk/releases/tag/v1.131.0) onwards no longer use `patch`.

Snyk is used to patch vulnerabilities of node_modules (read my {% post_link secure-node-modules-snyk 'previous post' %} for installation guide). I never had any issue with it running on Alpine docker image. That was because there was no modules to patch.

That is until I install [renovate](https://github.com/renovatebot/renovate), which has [vulnerabilities](https://snyk.io/test/npm/renovate) that can be patched.

Snyk only tells modules failed to patch, which is not helpful at all. I initially thought it was due to file permissions, which I now realise don't make sense. All commands are executed as root and files are owned by root.

The issue was only pinpointed after I ran snyk with `--debug`, which I should've used it in the first place anyway. The issue is due to BusyBox's patch doesn't support `--backup` option. Sigh, {% post_link gnu-vs-busybox-tools 'BusyBox versus GNU' %}, back at it again.

To install GNU's patch, simply add `apk add patch` before `npm install` in your CI config (e.g. `.gitlab-ci.yml`). The installation will automatically replace the BusyBox's patch symlink, so you don't need to.
