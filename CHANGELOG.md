# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.11.1] - 2021-11-17
### Fixed
- Optional `complete` callback to `Server#_respond` defaulted to no-op, fixing
"TypeError: complete is not a function" exceptions in cases where this function
is being called from outside this package without the argument.

## [1.11.0] - 2017-11-02

## [1.10.0] - 2017-08-14

[Unreleased]: https://github.com/jaredhanson/oauth2orize/compare/v1.11.0...HEAD
[1.11.0]: https://github.com/jaredhanson/oauth2orize/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/jaredhanson/oauth2orize/compare/v1.9.0...v1.10.0
