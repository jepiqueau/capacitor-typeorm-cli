<p align="center"><br><img src="https://user-images.githubusercontent.com/236501/85893648-1c92e880-b7a8-11ea-926d-95355b8175c7.png" width="128" height="128" /></p>
<h3 align="center">Capacitor SQLite TypeOrm CLI</h3>
<p align="center"><strong><code>capacitor-typeorm-cli</code></strong></p>
<br>

<p align="center">
CLI (Command Line Interface) module designed to work seamlessly with the @capacitor-community/sqlite plugin and the typeorm package. This module facilitates the generation of migration files for database management.</p>
<br>
<p align="center">
  <img src="https://img.shields.io/maintenance/yes/2024?style=flat-square" />
  <a href="https://github.com/capacitor-typeorm-cli/actions?query=workflow%3A%22CI%22"><img src="https://img.shields.io/github/workflow/status/capacitor-typeorm-cli/CI?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/capacitor-typeorm-cli"><img src="https://img.shields.io/npm/l/capacitor-typeorm-cli?style=flat-square" /></a>
<br>
  <a href="https://www.npmjs.com/package/capacitor-typeorm-cli"><img src="https://img.shields.io/npm/dw/capacitor-typeorm-cli?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/capacitor-typeorm-cli"><img src="https://img.shields.io/npm/v/capacitor-typeorm-cli?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img src="https://img.shields.io/badge/all%20contributors-1-orange?style=flat-square" /></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>


## Maintainers

| Maintainer        | GitHub                                    | Social |
| ----------------- | ----------------------------------------- | ------ |
| Quéau Jean Pierre | [jepiqueau](https://github.com/jepiqueau) |        |


## Installing the CLI

```bash
npm install --save capacitor-typeorm-cli
```

For `Typescript` projects two others packages are required

```bash
npm install --save-dev @types/node 
npm install --save-dev ts-node
```

## Supported Command

| Name                 | Description
| :------------------- | :------------------------------ |
| migration-generate   | Generate typeorm migration file |


All the others commands from the typeOrm CLI are not supported.

### Usage 

Usage: capacitor-typeorm-cli migration-generate [options]

generate migration

Options:
  -c, --command <commandName>      Alias command name
  -e, --entity <entityPath>        Alias for entity path
  -m, --migration <migrationPath>  Alias for migration path
  -i, --indexJs [indexJs]          Alias Index file extension for Javascript instead of Typescript 
  -db, --database [databasePath]   Alias for database path
  -o, --outputJs [outputJs]        Generate a migration file on Javascript instead of Typescript
  -t, --timestamp [timestamp]      Custom timestamp for the migration name
  -h, --help                       display help for command

### EntityPath (Mandatory)

The `entityPath` refers to the directory containing entity files, particularly the index.ts file. This index.ts file should export all entities. For example:

```ts
import { Item } from './item';
import { User } from './user';

export { User, Item };

```

### MigrationPath (Mandatory)

The `migrationPath` denotes the directory where migration files, generated by the CLI, are stored. Initially, an index.ts file must be created in this directory as follows:

```ts
export {  };
```

### IndexJs (Optional)

The `indexJs` parameter is utilized to specify the file extension for the index file. If set to true, the extension will be .js for JavaScript files; otherwise, the default extension will be .ts for TypeScript files.


### DatabasePath (Optional)

This parameter specifies the path to the database where the web database has been stored on disk for generating refactoring migrations. It is not required for the initial migration generation.

### OutputJs (Optional)

When set to true, this parameter instructs the CLI to generate the migration files in JavaScript. By default, the files are generated in TypeScript.

### Timestamp (Optional)

If you need to specify a timestamp for the migration name, use the -t option (alias for --timestamp) and provide the timestamp (should be a non-negative number). If not provided, the default timestamp is obtained from ```Date.now()```.



## Project Folder Structure

src/
  | ...
  | entities/
            ... /               (if needed)
                | index.ts
                | user.ts
                | ...
  | migrations/         
            ... /               (if needed)
                | index.ts
  | ...        



## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<p align="center">
  <a href="https://github.com/jepiqueau" title="jepiqueau"><img src="https://github.com/jepiqueau.png?size=100" width="50" height="50"/></a>
</p>


<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!