const inquirer = require('inquirer');


const runner = require('../Runner.js');

class Interactive {

  createCommandNameList() {
    const parsedCommandNames = this.commands
      .map(command => command._name);
    
    // Remove current command name and default command from list
    const usableCommandNames = parsedCommandNames.filter(commandName => 
      commandName !== this.commandName && 
      commandName !== '*'
    )

    return usableCommandNames
  }

  userScriptSelector() {
    inquirer.prompt({
      type: 'list',
      name: 'scriptChoice',
      message: 'Select the script to run',
      choices: this.createCommandNameList()
    }).then((userInput) => this.getInputArguments(userInput));
  }

  getInputArguments(userInput) {
    const commandToRun = this.commands.find(command => command._name === userInput.scriptChoice);

    const questionsToAsk = commandToRun.options.map(argument => ({
      type: argument.text.includes('key') ? 'password' : 'input',
      name: argument.param,
      message: argument.text
    }))

    inquirer
      .prompt(questionsToAsk)
      .then(userInputs => {
        const questions = Object.keys(userInputs);
        questions.forEach(question => {
          if (!!userInputs[question]) {
            this.program[question] = userInputs[question]
          }
        })
      
      runner.scripts[commandToRun._name].start(this.program);
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