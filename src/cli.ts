#!/usr/bin/env node
import "reflect-metadata"

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { importOrRequireFile } from 'typeorm/util/ImportUtils';
import { camelCase } from 'typeorm/util/StringUtils';
import { CommandUtils } from 'typeorm/commands/CommandUtils';
import { DataSource, type DataSourceOptions } from 'typeorm';

const program = new Command();

program 
.name('capacitor-typeorm-cli')
.version('0.0.1')
.description('A CLI tool for generating migrations for Capacitor SQLite TypeOrm')

// Define options with aliases
program
  .command('migration-generate')
  .description('generate typeorm migration file')
  .option('-c, --command <commandName>', 'Alias command name')
  .option('-e, --entity <entityPath>', 'Alias for entity path')
  .option('-m, --migration <migrationPath>', 'Alias for migration path')
  .option('-i, --indexJs [indexJs]', 'Alias Index file extension for Javascript instead of Typescript ')
  .option('-db, --database [databasePath]', 'Alias for database path')
  .option('-o, --outputJs [outputJs]', 'Generate a migration file on Javascript instead of Typescript')
  .option('-t, --timestamp [timestamp]', 'Custom timestamp for the migration name')
  .action((options) => {
    let nArgs = 1;
    // Check if options are provided, fallback to positional arguments
    // Only for the entityPath and migrationPath
    nArgs = options.entity ? nArgs + 1 : nArgs;
    const entityPath = options.entity || program.args[nArgs];
    nArgs = options.migration ? nArgs + 2 : nArgs + 1;
    const migrationPath = options.migration || program.args[nArgs];
    // Use of options is mandatory for optional arguments
    const indexJs = options.indexJs;
    const databasePath = options.database;
    const outputJs = options.outputJs;
    const timestamp = options.timestamp;
    // Here, you can access the values of options and positional arguments
    // and perform necessary actions based on them
    generateMigrations(entityPath, migrationPath, indexJs, databasePath, outputJs, timestamp);

  });

// If using the .action() method, call .parse() to trigger action execution
// if there is several commands it must be placed after the last command
program.parse(process.argv);

/**
 * Commands Internal functions
 */
 
async function generateMigrations(entityPath: string,
                                  migrationPath: string,
                                  indexJs: boolean = false,
                                  databasePath: string | undefined,
                                  outputJs: boolean = false,
                                  timestamp: number | undefined) {
  if(!entityPath) {
    console.log("Please specify a entity path");
    process.exit(1);
  }
  if(!migrationPath) {
    console.log("Please specify a migration path");
    process.exit(1);
  }


  const indexFile = indexJs ? 'index.js' : 'index.ts'
  const absEntityPath = path.resolve(entityPath, indexFile);
  const absMigrationPath = path.resolve(path.dirname(migrationPath), indexFile);
  const migrationName = path.basename(migrationPath);
  const mTimestamp = timestamp ? timestamp : Date.now();
  const extension = outputJs ? ".js" : ".ts";
  const fullPath = migrationPath.startsWith("/")
      ? migrationPath
      : path.resolve(process.cwd(), migrationPath);
  const genMigrationFile = mTimestamp + "-" + path.basename(fullPath) + extension;


  // Resolve the absolute path
  let absDatabasePath = "";
  if (databasePath) {
    absDatabasePath = path.resolve(databasePath);
  }

  // Dynamically import the entities and the migrations from the specified file pathes
  let entitiesExports;
  let migrationsExports;
  try {
      [entitiesExports] = await importOrRequireFile(
          absEntityPath,
      );
      [migrationsExports] = await importOrRequireFile(
        absMigrationPath,
      );

      // create a dataSource
      const database = absDatabasePath.length > 0 ? absDatabasePath : ':memory:';
      const dataSourceConfig: DataSourceOptions = {
        type: 'sqlite',
        database: database,
        entities: entitiesExports,
        migrations: migrationsExports,
        dropSchema: false,
        synchronize: false,     // !!!You will lose all data in database if set to `true`
        migrationsRun: false
      };

      const dataSource = new DataSource(dataSourceConfig);
      await dataSource.initialize();

      // Generate the Up and Down SQL Statements
      const upSqls: string[] = [],
            downSqls: string[] = [];
      try {
        const sqlInMemory = await dataSource.driver
            .createSchemaBuilder()
            .log();
        sqlInMemory.upQueries.forEach((upQuery) => {
          upSqls.push(
              "        await queryRunner.query(`" +
                upQuery.query.replace(new RegExp("`", "g"), "\\`") +
                "`" +
                queryParams(
                    upQuery.parameters,
                ) +
              ");",
          );
        });
        sqlInMemory.downQueries.forEach((downQuery) => {
          downSqls.push(
              "        await queryRunner.query(`" +
                downQuery.query.replace(
                  new RegExp("`", "g"),
                  "\\`",
                ) +
                "`" +
                queryParams(
                    downQuery.parameters,
                ) +
              ");",
          );
        });
      } finally {
          await dataSource.destroy();
      }
      if (!upSqls.length) {
        console.log(
          `No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`
        );
        process.exit(1);
      
      }

      // Create the file content wit the Up and Down Statements
      const fileContent = outputJs
      ? getJavascriptTemplate(
            path.basename(fullPath),
            mTimestamp,
            upSqls,
            downSqls.reverse(),
        )
      : getTemplate(
            path.basename(fullPath),
            mTimestamp,
            upSqls,
            downSqls.reverse(),
        )
      ;

      // Create the migration file
      const migrationFileName =
        path.dirname(fullPath) + "/" + genMigrationFile;
      await CommandUtils.createFile(migrationFileName, fileContent);

      // Update the migration index file
      updateMigrationIndexFile( migrationName, mTimestamp, absMigrationPath);

      console.log(
        `Migration: \n\n ${migrationFileName} \n\n has been generated successfully.`
      );
      process.exit(0);

  } catch (err: any) {
    const msg = err.message ? err.message : err;
    console.log(
        `Error during migration generation: ${msg}`
    );
    process.exit(1);

  }
}

function updateMigrationIndexFile(migrationName: string, timestamp: number, absMigrationPath: string) {
  let indexContents = fs.readFileSync(absMigrationPath, 'utf-8');

  const mMigrationName = migrationName + timestamp;
  const fMigrationName = timestamp + "-" + migrationName;
  // Parse the existing export statements
  const existingExportsMatch = indexContents.match(/export\s*{([^}]*)}/);
  const existingExports = existingExportsMatch ? existingExportsMatch[1].trim() : '';

  // Check if the migration has already been imported
  if (!existingExports.includes(mMigrationName)) {
      // Add import statement for the new migration
    const importStatement = `import { ${mMigrationName} } from './${fMigrationName}';\n`;

    // Add the new migration to the export list
    const updatedExports = existingExports ? existingExports + `, ${mMigrationName}` : mMigrationName;

    // Update the index contents
    indexContents = indexContents.replace(/export\s*{([^}]*)}/, importStatement + `export { ${updatedExports} }`);

    // Write the updated contents back to the index.ts file
    fs.writeFileSync(absMigrationPath, indexContents, 'utf-8');
  }
}

// -------------------------------------------------------------------------
// Functions copied from typeorm/commands/MigrationGenerateCommand
// -------------------------------------------------------------------------

/**
 * Formats query parameters for migration queries if parameters actually exist
 */
function queryParams(parameters: any[] | undefined): string {
  if (!parameters || !parameters.length) {
      return ""
  }

  return `, ${JSON.stringify(parameters)}`
}

/**
 * Gets contents of the migration file.
 */
function getTemplate(
    name: string,
    timestamp: number,
    upSqls: string[],
    downSqls: string[],
  ): string {
      const migrationName = `${camelCase(name, true)}${timestamp}`

      return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${migrationName} implements MigrationInterface {
  name = '${migrationName}'

  public async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join(`
`)}
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join(`
`)}
  }

}
`
}

/**
 * Gets contents of the migration file in Javascript.
 */
function getJavascriptTemplate(
    name: string,
    timestamp: number,
    upSqls: string[],
    downSqls: string[],
  ): string {
      const migrationName = `${camelCase(name, true)}${timestamp}`

      return `const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ${migrationName} {
  name = '${migrationName}'

  async up(queryRunner) {
${upSqls.join(`
`)}
  }

  async down(queryRunner) {
${downSqls.join(`
`)}
  }
}
`
}

