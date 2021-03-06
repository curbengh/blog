---
title: rsync is surprisingly simple to setup
excerpt: configure rsync on NixOS, no daemon required
date: 2021-03-15
tags:
- linux
- nixos
---

When I first tried to figure out how to deploy this website, I thought of using [rsync](https://en.wikipedia.org/wiki/Rsync) to sync pipeline-generated static files to the web server. FTP was never viable because it is inefficient to upload everything, whereas rsync uploads modified files only. rsync's `--delete` option also can automatically remove files in destination folder that are no longer exist in source folder.

At that time, I thought rsync needs to run as a server daemon on the web server and I was reluctant to open another port. That turned out to be incorrect after I read the wiki.

{% blockquote rsync https://en.wikipedia.org/wiki/Rsync %}
For example, if the command `rsync local-file user@remote-host:remote-file` is run, rsync will use SSH to connect as user to remote-host...

Rsync can also operate in a daemon mode (rsyncd), serving and receiving files in the native rsync protocol (using the "rsync://" syntax).
{% endblockquote %}

This means it's _optional_ for rsync to operate in a daemon mode. When operating over SSH, rsync first establishes an SSH connection, execute rsync on the remote server and starts syncing files from local to remote. In the above example, the direction is to mirror local changes to remote server. You could also reverse the direction, `rsync user@remote-host:remote-file local-file`, where remote changes is reflected locally; this mode is usually used by Linux distribution mirrors to sync with the primary server.

The way rsync works by default--by piggybacking on SSH--is similar to how [Mosh](https://mosh.org/) operates, except that Mosh needs to listen on a single UDP port between 60000 and 61000. rsync utilises existing SSH connection, so there is no need to open another port.

## SSH key and user setup

Generate a new SSH key. If you're planning to use rsync on CI/CD pipeline, leave the password empty.

```
ssh-keygen -t ed25519 -C "www-data@nixos-server"
```

Create a separate user with home folder set to where web server will be deployed. I use the convention of `www-data` user with `/var/www` home folder. Create

``` nix /etc/nixos/configuration.nix
  users = {
    users = {
      www-data = {
        openssh.authorizedKeys.keys = [ "ssh-ed25519 ..." ];
        home = "/var/www";
        # Required for rsync
        isNormalUser = true;
      };
    };
  };

  ## Make /var/www world-readable
  system.activationScripts = {
     www-data.text =
     ''
       chmod +xr "/var/www"
     '';
  };
```

`isNormalUser` (which also enables `useDefaultShell`) is required to execute rsync on the remote server. This has a security implication and requires a minor tweak to the web server; more on this in the next section. Execute `nixos-rebuild switch` as root to create `www-data` user and its home folder.

### Hide dotfiles in web server

`useDefaultShell` grants a shell to the user and the shell may generate dotfiles to home folder (e.g. `~/.bash_history`/`~/.bashrc`). In practice, those files will be removed automatically every time rsync runs. As a precaution, you should configure the web server not to expose those dotfiles.

Example Caddy config:

``` plain Caddyfile
example.com www.example.com {
  root * /var/www
  file_server {
    hide /var/www/.*
  }
}
```

The example assumes there is no existing dotfiles that are intended to be public, like `.well_known/`; in that case, adjust the regex accordingly.

## SSH config

Add the following lines to `~/.ssh/config`:

```
Host rsync-remote
  HostName x.x.x.x
  User www-data
  ## Uncomment if using custom port
  #Port 1234
  IdentityFile /path/to/private/key
  IdentitiesOnly yes
```

The config creates an alias `rsync-remote` and specify the private key, so that ssh/rsync destination is specified with `rsync-remote`, instead of `user@remote-host`.

## Upload test file

> rsync is included in most Linux distributions (e.g. Ubuntu, NixOS, Arch/Manjaro), but not in Alpine

Test this setup by uploading a small test file:

```
echo "test content" > test.txt
rsync -zvh test.txt rsync-remote:/var/www/
```

SSH/login into the remote server, the test file should exists in `/var/www` folder.

```
cat /var/www/test.txt
```

Once the test pass, we can move on to uploading the whole static sites. In my case, I use [Hexo](https://hexo.io/) static site generator and it generates into `public/` folder.

```
hexo generate
# Do a dry run
rsync -azvh --delete --dry-run public/ rsync-remote:/var/www/
# Actual upload
rsync -azvh --delete public/ rsync-remote:/var/www/
```

## Rsync in CI/CD pipeline

Add `SSH_KEY`, `SSH_CONFIG` and `SSH_KNOWN_HOSTS` to CI/CD variables. `SSH_KNOWN_HOSTS` value can be generated by:

```
ssh-keyscan x.x.x.x

# Custom port
ssh-keyscan -p 1234 x.x.x.x
```

``` yml .gitlab-ci.yml
build:
  stage: build

  before_script:
    - npm install

  script:
    - npm run build

  artifacts:
    paths:
      - public/

deploy:
  stage: deploy

  before_script:
    - apk update && apk add openssh-client rsync
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
    - chmod 644 ~/.ssh/known_hosts
    ## Adjust the private key path in ssh config accordingly
    - echo "$SSH_KEY" > ~/.ssh/id_remote_rsync
    - chmod 600 ~/.ssh/id_remote_rsync
    - echo "$SSH_CONFIG" > ~/.ssh/config
    - chmod 600 ~/.ssh/config

  script:
    ## Dry run
    - rsync -azvh --delete --dry-run public/ rsync-remote:/var/www/
    ## Remove above & uncomment below if no issue
    #- rsync -azvh --delete public/ rsync-remote:/var/www/
```
