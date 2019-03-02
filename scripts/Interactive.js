const inquirer = require('inquirer');


const runner = require('../Runner.js');

class Interactive {
  createCommandNameList() {
    return this.commands
      .map(command => command._name)
      .filter(commandName => commandName !== this.commandName && commandName !== '*');
  }

  userScriptSelector() {
    inquirer.prompt({
      type: 'list',
      name: 'scriptChoice',
      message: 'Select the script to run',
      choices: this.createCommandNameList()
    }).then((results) => this.getInputArguments(results));
  }

  getInputArguments(results) {
    this.commandToRun = this.commands.find(command => command._name === results.scriptChoice);
    const args = this.commandToRun.options.map(opt => ({
      param: opt.long.substring(2),
      text: opt.description
    }))

    inquirer.prompt(args.map(argument => ({
      type: argument.text.includes('key') ? 'password' : 'input',
      name: argument.param,
      message: argument.text
    }))).then(userInputs => {
      Object.keys(userInputs).forEach(key => {
        if (userInputs[key].length) {
          this.program[key] = userInputs[key]
        }
      })
      runner.scripts[this.commandToRun._name].start(this.program);
    })
  }

  start(program) {
    this.program = program;
    this.commandName = program._name;
    this.commands = program.parent.commands;

    this.userScriptSelector();
  }
}

module.exports = new Interactive;