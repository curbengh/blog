---
title: "Onion-Location: redirect your clearnet website to .onion"
excerpt: Supported in Tor Browser >=9.5
date: 2020-06-03
updated: 2020-07-09
tags:
- tor
---

Tor Browser recently introduced "Onion Location" feature in [v9.5](https://blog.torproject.org/new-release-tor-browser-95) to enable a (clearnet) website to advertise its onion service to users of Tor Browser by adding an HTTP header. When visiting a clearnet website that has onion service available and the relevant HTTP header, Tor Browser will display a ".onion available" button on the address bar. When user clicks on it, Tor Browser will redirects to the .onion address of the website. User could also opt-in the "Always Prioritise Onions" option and Tor Browser will automatically redirects to a website's .onion if detected. This feature was initially suggested back in [2017](https://trac.torproject.org/projects/tor/ticket/21952) and finally landed in v9.5.

![.onion button](20200603/onion-location.png)

![Redirected to onion service](20200603/redirected-onion.png)

The HTTP header is:

```
Onion-Location: http://xxx.onion
```

## Caddy

In Caddy, the header can be added by:

``` plain v1
example.com {
  header / {
    Onion-Location "http://xxx.onion"
  }
}
```

``` plain v2
example.com {
  header {
    Onion-Location "http://xxx.onion"
  }
}
```

## Netlify

Add custom header by using [`_headers`](https://docs.netlify.com/routing/headers/) file saved the root folder of your site:

``` plain _headers
/*
  Onion-Location: http://xxx.onion
```

## <meta> tag

If you don't have access to the web server to add the header (e.g. GitHub/GitLab Pages), you can add `<meta>` tag instead.

The tag should be added in `<head>`:

``` html
<html>
  <head>
    <meta http-equiv="Onion-Location" content="http://xxx.onion">
  </head>
</html>
```

## Apache and Nginx

Refer to this [configuration guide](https://community.torproject.org/onion-services/advanced/onion-location/) on Tor Project website.
