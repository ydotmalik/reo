# Reo framework

# Introduction

The Reo (pronounced "rio") framework allows you to quickly develop single page web applications.  Features include:
* no JavaScript needed
* no dependencies (no jQuery, etc.)
* create single page apps easily with web frameworks such as Django
* convert apps with static content into single page apps
* one small file (< 18KB minified)
* hooks to customize any functionality in Reo

Check out some examples [here](http://ydotmalik.github.io/reo).

See the [docs](docs/README.md) to fully understand how to use Reo.

The unit test cases are [here](test/README.md).

## Development

When I started to develop my first webapp, I knew little about web development.  For the front end I came across jQuery.
jQuery facilitated DOM manipulation.  With jQuery I found myself repeating the same patterns and realized that jQuery is
not a framework.  I came across web frameworks like AngularJS, but I decided it would be too much effort to learn and
convert our code to Angular.  Instead, I generalized the patterns that I was repeating and came up with Reo.

Reo initially depended on jQuery to manipulate the DOM.  Reo no longer depends on jQuery.  jQuery provides a platform
independent way of manipulating the DOM.  To ensure Reo works
across all browsers, I took the DOM manipulation related code from jQuery and included it in Reo.  Furthermore, one use case
of Reo is to execute scripts tags from plain HTML, which is not possible using the basic JavaScript.  I look only the
code that Reo directly used.  JQuery is a generic library, so I modified much of what I added because it wasn't applicable
to Reo's use cases.

## Who is using this

Reo is used by a real estate website we are developing that will launch soon.