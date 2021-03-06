---
title: Running Caddy 2 in NixOS 20.03
excerpt: Use stable v2 instead of beta release
date: 2020-05-24
updated: 2020-11-10
tags:
- server
- caddy
- nixos
---

> Applies to 20.03 or older only

In NixOS 20.03, `caddy` package is still version 1.0.4 and `caddy2` package uses version 2.0 beta 10. The package maintainer [plans](https://github.com/NixOS/nixpkgs/pull/86686) to upgrade the `caddy` package to v2 in 20.09, while retaining v1 as `caddy1`. In the meantime, I show you how to run v2 stable release by using the `caddy2` package from the `unstable` channel; note that this only affects `caddy2` package, all other packages still use the stable `nixos` channel.

(Execute commands with "sudo" privilege)

Add the `unstable` channel:

```
$ nix-channel --add https://nixos.org/channels/nixos-unstable unstable
$ nix-channel --update unstable
```

Add `caddyTwo.nix` file (this example stores the file in "/etc/caddy"):

``` nix /etc/caddy/caddyTwo.nix
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.caddyTwo;

  # v2-specific options
  isCaddy2 = versionAtLeast cfg.package.version "2.0";
in {
  options.services.caddyTwo = {
    enable = mkEnableOption "Caddy web server";

    config = mkOption {
      default = "/etc/caddy/Caddyfile";
      type = types.str;
      description = "Path to Caddyfile";
    };

    dataDir = mkOption {
      default = "/var/lib/caddy";
      type = types.path;
      description = ''
        The data directory, for storing certificates. Before 17.09, this
        would create a .caddy directory. With 17.09 the contents of the
        .caddy directory are in the specified data directory instead.
      '';
    };

    package = mkOption {
      default = pkgs.caddy;
      defaultText = "pkgs.caddy";
      type = types.package;
      description = "Caddy package to use.";
    };

    adapter = mkOption {
      default = "caddyfile";
      example = "nginx";
      type = types.str;
      description = ''
        Name of the config adapter to use. Not applicable to Caddy v1.
        See https://caddyserver.com/docs/config-adapters for the full list.
      '';
    };
  };

  config = mkIf cfg.enable {
    systemd.services.caddy = {
      description = "Caddy web server";
      after = [ "network-online.target" ];
      wantedBy = [ "multi-user.target" ];
      environment = mkIf (versionAtLeast config.system.stateVersion "17.09" && !isCaddy2)
        { CADDYPATH = cfg.dataDir; };
      startLimitIntervalSec = 14400;
      startLimitBurst = 10;
      serviceConfig = {
        ExecStart = if isCaddy2 then ''
          ${cfg.package}/bin/caddy run --config ${cfg.config} --adapter ${cfg.adapter}
        '' else ''
          ${cfg.package}/bin/caddy -root=/var/tmp -conf=${cfg.config}
        '';
        ExecReload =
          if isCaddy2 then
            "${cfg.package}/bin/caddy reload --config ${cfg.config} --adapter ${cfg.adapter}"
          else
            "${pkgs.coreutils}/bin/kill -USR1 $MAINPID";
        Type = "simple";
        User = "caddy";
        Group = "caddy";
        Restart = "on-abnormal";
        NoNewPrivileges = true;
        LimitNPROC = 512;
        LimitNOFILE = 1048576;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectHome = true;
        ProtectSystem = "full";
        ReadWriteDirectories = cfg.dataDir;
        KillMode = "mixed";
        KillSignal = "SIGQUIT";
        TimeoutStopSec = "5s";
        # Remove two options below if caddy doesn't listen on port <1024
        AmbientCapabilities = "cap_net_bind_service";
        CapabilityBoundingSet = "cap_net_bind_service";
      };
    };

    users.users.caddy = {
      home = cfg.dataDir;
      createHome = true;
    };

    users.groups.caddy = {
      members = [ "caddy" ];
    };
  };
}
```

Enable caddy service in "configuration.nix":

``` nix /etc/nixos/configuration.nix
  require = [ /etc/caddy/caddyTwo.nix ];
  services.caddyTwo = {
    enable = true;
    package = unstable.caddy2
    config = "/path/to/caddyFile";
    adapter = "caddyfile";
  };
```

If you use other [config formats](https://caddyserver.com/docs/config-adapters#known-config-adapters), modify the following options:

``` nix /etc/nixos/configuration.nix
  services.caddyTwo = {
    config = "/path/to/yaml";
    adapter = "yaml";
  };
```

Package maintainer is updating the `caddy` package to v2 in [#86686](https://github.com/NixOS/nixpkgs/pull/86686), once that pull request is merged, update the following option:

``` nix /etc/nixos/configuration.nix
  services.caddyTwo = {
    package = unstable.caddy;
  };
```

Import `unstable` channel:

``` nix /etc/nixos/configuration.nix
{ config, pkgs, ... }:

let
  unstable = import <unstable> {};
in
{
  # existing options

  require = [ /etc/caddy/caddyTwo.nix ];
  services.caddyTwo = {
    enable = true;
    package = unstable.caddy2;
    config = "/path/to/caddyFile";
    adapter = "caddyfile";
  };
}
```

Runs a rebuild and check the status:

```
$ nixos-rebuild switch
$ systemctl status caddy
```

To revert to v1, remove `package` and `adapter` options:

``` nix /etc/nixos/configuration.nix
  services.caddyTwo = {
    enable = true;
    config = "/path/to/caddyFile";
  };
```
