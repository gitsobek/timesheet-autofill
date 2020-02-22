# Timesheet Autofill

[![CircleCI](https://circleci.com/gh/gitsobek/timesheet-autofill.svg?style=shield&circle-token=19786e8907c15dac67f9fda659a2eb923e153d88)](LINK)

Timesheet Autofill is an automated and autonomous tool for filling the working hours timesheet in Google Forms and submitting it with the date and hours passed as arguments or set in config file. This project is released as stable version and its development may be continued in the future.

### Installation

Timesheet Autofill requires [Node.js](https://nodejs.org/) v10+ to run.

Download and install the dependencies.

```sh
$ git clone https://github.com/gitsobek/timesheet-autofill
$ cd timesheet-autofill
$ npm install
```

Next step is creation of executable file for you OS.

```sh
$ npm run init
```

From this moment you can run the script globally everywhere in your system. Create config.txt script based on the example (config.example.txt) and configure your information data. Run the script using the command below:

```sh
$ timesheet-autofill
```

You can pass your current's day working hours and override the ones you've set in your config file:

```sh
$ timesheet-autofill -s 8:30 -e 16:30
```

You can also fill out the form for a selected day by passing the **-c** option.

```sh
$ timesheet-autofill -c 19.02.2020 -s 8:30 -e 16:30
```

To run test just simply (you need to be in root catalog of the tool):

```sh
$ npm test
```

### Contribution

If you want to contribute you can create a feature branch, push the branch to the remote server and create a pull request. This project has been integrated with CircleCI so your branch will be built on a external server and checked for errors. After the pipeline process has finished, you'll receive an certain outcome.

To start this project in development mode, run this command:

```sh
$ timesheet-autofill -d
```

From this moment the script will ignore your timesheet form URL you've set in config file and use a test form to send your results there. Break the execution of the script in desired place of the code to inspect and analyse how the script works by putting **debugger;** or commenting part of code (e.g: browser.close()).

### Todos

- [x] Write End-To-End test
- [x] Add CircleCI integration
- [x] Add development mode (run script in non-headless mode and inspect the script execution)
- [x] Generate executable files for Windows, Linux and Mac systems for easier use
- [x] Possibility to set minutes (e.g: 8:30 - 16:30)
- [x] Possibility to set date
- [ ] Code improvement & adjustments (?)

## License

MIT
