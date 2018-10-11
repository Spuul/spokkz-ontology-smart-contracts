
import { join } from 'path';
import { ConfigLoader } from './config-loader';
import { Deployer } from './deployer';
import * as glob from 'glob';

const chalk = require('chalk');

const commandLineArgs = require('command-line-args');

const OPTIONS = [
  { name: 'mode', alias: 'm', type: String },
  { name: 'deploy', type: Boolean }
];

async function main() {
  const options = commandLineArgs(OPTIONS);

  const config = new ConfigLoader(
    require(join(__dirname, '..', 'ontology.json')),
    options.mode,
    join(__dirname, '..')
  );

  if (options.deploy) {
    const deployer = new Deployer(config);
    const deployScripts = glob.sync(join(__dirname, '..', 'migrations', '*.ts'));
    deployScripts.forEach((script) => require(script)(deployer));
  }
}

main()
  .catch(console.error);
