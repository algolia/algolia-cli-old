const inquirer = require('inquirer');

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
    }))).then(output => {
      console.log(this.commandToRun);
      // console.log(output)
    })
  }

  start(cmd) {
    this.commandName = cmd._name;
    this.commands = cmd.parent.commands;

    this.userScriptSelector();
  }
}

module.exports = new Interactive;