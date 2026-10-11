# Lk4

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

Then added [ng-Bootstrap] (https://ng-bootstrap.github.io/).

Then Claude asked to generate the site according to the [old site spec](src/spec/site.md) and a reference to the [old site GitHub repo](https://github.com/haggish/lk2/). Angular CLI MCP was used.

This was verified according to my Angular 21 knowledge and IMO produced a quite nicely functioning Angular 21 application with Bootstrap components, including fully working i18n that was not the complicated Angular I18N, but a nice clean dynamic one.

The CSS was off, which was fixed using Firecrawl MCP and prompting the CSS to be modified according to the [old site](https://laurakarki.com).

Remaining CSS bugs fixed using additional promps and Angular DevTools AI.

Added Vitest unit tests aided by Claude.
Added Playwright end-to-end tests aided by Claude.

Took about four hours, including the time spent on waiting for more tokens :)

Phase 2: Migrated all content to Contentful CMS. Why Contentful? Because they hosted nice node.js Meetups in Berlin and offered free beer and pizza. And I have had absolutely no problems with the softaware

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Continuous integration and deployment

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`:
it checks the image assets, runs the unit tests, builds, then runs the Playwright
suite across chromium, firefox and webkit. On `master` a second job deploys the
build to the server with `rsync` over SSH.

The deploy job starts on every push to `master` but short-circuits with a notice
until all four secrets below exist, so it is safe to merge before configuring it.

Repository secrets (Settings → Secrets and variables → Actions):

| Secret               | Value                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------- |
| `DEPLOY_HOST`        | server hostname                                                                        |
| `DEPLOY_USER`        | SSH user owning the web root                                                           |
| `DEPLOY_SSH_KEY`     | private key, full PEM including header and footer lines                                |
| `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan <host>`, so the host key is pinned rather than blindly accepted |

Optionally set the `DEPLOY_PATH` _variable_ (not a secret) to override the default
web root of `/var/www/site2026`.

On the server, generate a key pair dedicated to deploys and authorise it for a
user that owns only the web root:

```bash
ssh-keygen -t ed25519 -f deploy_key -C github-actions -N ''
cat deploy_key.pub >> ~/.ssh/authorized_keys   # on the server
```

Put the private half in `DEPLOY_SSH_KEY` and keep it out of the repo. Note that
`rsync --delete` writes straight into the web root, so there is a sub-second
window where old and new files coexist; serving from a `releases/` directory with
a `current` symlink and swapping it atomically removes that, at the cost of
pointing the server's nginx `root` at the symlink.

Note also that `nginx.conf` in this repo is used only by the Docker image. The
server has its own nginx configuration, maintained by hand, so SPA routing and
cache headers there are not covered by these tests.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
