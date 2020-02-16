# Timesheet Autofill
[![gitsobek](https://circleci.com/gh/gitsobek/timesheet-autofill.svg?style=svg)](<LINK>)

Timesheet Autofill is an automated and autonomous tool for filling the working hours timesheet in Google Form and submitting it with the date that corresponds to today's date and hours passed as arguments or set in config file. This project was released as beta version (1.0.0) and its development will be continued till creating a stable version.

### Installation

Timesheet Autofill requires [Node.js](https://nodejs.org/) v10+ to run.

No executable files for Windows and Unix systems have been carried out yet, therefore to run this script you have to use node environment.

Download and install the dependencies.

```sh
$ git clone https://github.com/gitsobek/timesheet-autofill
$ cd timesheet-autofill
$ npm install
```
Create config.txt script based on the example (config.example.txt) and configure your information data. Run the script:

```sh
$ npm start
```
If you can pass your current's day working hours and override the set ones in your config file:
```sh
$ npm start 9 17
```
To run test just simply:
```sh
$ npm test
```

### Contribution

There is no development environment set up yet. If you still want to contribute you can create a feature branch, push the branch to the remote server and create a pull request. This project has been integrated with CircleCI so your branch will be built on a external server and checked for errors. After the pipeline process has finished, you'll receive an certain outcome.

### Todos
- [x] Write End-To-End test
- [x] Add CircleCI integration
- [ ] Add development mode (run script in non-headless mode and inspect the script execution)
- [ ] Generate executable files for Windows, Linux and Mac systems for easier use
- [ ] Possibility to set minutes (e.g: 8:30 - 16:30)
- [ ] Possibility to set date
- [ ] Code improvement & adjustments (?)

License
----

MIT

