#!/usr/bin/env node

const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const program = require("commander");
const puppeteer = require("puppeteer");
const Transform = require("stream").Transform;

const URL_REGEX = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
const URL_DEV_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLScyt8cNjhbIQCH5GT5eoCLrq3MAF50f-PqtKPPKpQ21h0Jcxw/viewform";

const TIME_REGEX = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
const HOUR_REGEX = /^([0-1]?[0-9]|2[0-3])$/;

/* Handle arguments and options passed in command-line */
program
  .option("-d, --dev", "set environment to development mode")
  .option("-s, --start <time>", "set start time (e.g: 8 or 8:30)")
  .option("-e, --end <time>", "set end time (e.g: 16 or 16:30)")
  .parse(process.argv);

function TimeSheet() {
  this.dictionary = {};
}

TimeSheet.prototype.loadConfig = function(filePath) {
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(filePath, { encoding: "utf-8" });
    const parser = this.parseConfig();
    read
      .pipe(parser)
      .on("error", err => reject(err))
      .on("finish", () => {
        resolve(this.dictionary);
      });
  });
};

TimeSheet.prototype.parseConfig = function() {
  const parser = new Transform();
  parser._transform = (data, encoding, done) => {
    data
      .toString()
      .split("\n")
      .filter(line => line)
      .reduce((dict, pair) => {
        pair = pair.split("=");
        this.dictionary[pair[0].toLowerCase()] = pair[1];
      }, {});
    done();
  };
  return parser;
};

let browser;
const sheet = new TimeSheet();

(async () => {
  try {
    /* Get environment type */
    const IS_DEBUG = program.dev;

    /* Load user timesheet config */
    const dictionary = await sheet.loadConfig(
      path.join(__dirname, "../config.txt")
    );

    /* Check consistency of timesheet settings */
    if (!dictionary || !Object.keys(dictionary).length) {
      throw new Error("Missing settings! Please correct your config file.");
    }

    const allowedKeys = ["url", "email", "start", "end"];
    const isConsistent = _.isEmpty(_.xor(Object.keys(dictionary), allowedKeys));

    if (!isConsistent) {
      throw new Error("Invalid settings! Please correct your config file.");
    }

    /* Set user's current day working hours */
    const args = program.opts();
    let [, start = dictionary.start, end = dictionary.end] = Object.values(
      args
    );

    let startHour, startMin, endHour, endMin;

    /* Validate start time */
    if (TIME_REGEX.test(start)) {
      [startHour, startMin] = start.split(":");
    } else if (HOUR_REGEX.test(start)) {
      [startHour, startMin] = [start, "00"];
    } else {
      throw new Error(
        "Start time has invalid format. It must be in hh:mm (e.g: 8:30) or presented as single number (e.g: 8)."
      );
    }

    /* Validate end time */
    if (TIME_REGEX.test(end)) {
      [endHour, endMin] = end.split(":");
    } else if (HOUR_REGEX.test(start)) {
      [endHour, endMin] = [end, "00"];
    } else {
      throw new Error(
        "End time has invalid format. It must be in hh:mm (e.g: 16:30) or presented as single number (e.g: 16)."
      );
    }

    if (parseInt(startHour) > parseInt(endHour)) {
      throw new Error("Starting hour cannot be greater than ending hour!");
    }

    if (parseInt(startMin) % 30 !== 0) {
      throw new Error(
        "Minutes must match a full hour or half hour in start time!"
      );
    }

    if (parseInt(endMin) % 30 !== 0) {
      throw new Error(
        "Minutes must match a full hour or half hour in end time!"
      );
    }

    /* Check if set timesheet link is a valid URL */
    if (!URL_REGEX.test(dictionary.url)) {
      throw new Error("Invalid URL!");
    }

    /* Boot up headless browser */
    IS_DEBUG &&
      console.log(
        "You're running this script in development mode. This form was created for testing purposes by the author of this tool.\nIn order to inspect the script operation you need to stop its execution by placing 'debugger;' between operations or commenting 'browser.close()'."
      );

    const opts = {
      headless: !IS_DEBUG,
      devtools: IS_DEBUG
    };

    browser = await puppeteer.launch(opts);
    const page = await browser.newPage();

    /* Go to timesheet form */
    const pageUrl = IS_DEBUG ? URL_DEV_FORM : dictionary.url;
    await page.goto(pageUrl);

    const isTimesheetForm = await page.evaluate(() => {
      const string = "Ewidencja godzinowa";
      const selector = "form div.freebirdFormviewerViewHeaderTitle";
      return document.querySelector(selector).innerText.includes(string);
    });

    if (!isTimesheetForm) {
      throw new Error("Provided URL is not our timesheet form!");
    }

    const today = new Date().toISOString().split("T")[0];
    const todayArr = today.split("-");

    /* Fill up the form */
    await page.type('input[aria-label="Email address"]', dictionary.email);

    await page.type(
      'div[aria-label="Data"] input',
      `${todayArr[1]}-${todayArr[2]}-${todayArr[0]}`
    );

    await page.type(
      'div[aria-label="Godzina od"] div.freebirdFormviewerViewItemsTimeNumberEdit:first-child input',
      startHour.toString(),
      { delay: 100 }
    );
    await page.type(
      'div[aria-label="Godzina od"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input',
      startMin.toString(),
      { delay: 100 }
    );

    await page.type(
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:first-child input',
      endHour.toString(),
      { delay: 100 }
    );
    await page.type(
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input',
      endMin.toString(),
      { delay: 100 }
    );

    /* Submit the form */
    await Promise.all([
      page.click('div[role="button"] span'),
      page.waitForNavigation({
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 5000
      })
    ]);

    await page.waitForSelector(
      "div.freebirdFormviewerViewResponseConfirmationMessage"
    );

    const isSubmitSucceed = await page.evaluate(() => {
      const string = "Twoja odpowiedź została zapisana.";
      return document
        .querySelector("div.freebirdFormviewerViewResponseConfirmationMessage")
        .innerText.includes(string);
    });

    if (isSubmitSucceed) {
      console.log("You have submitted your working hours successfully.");
    }

    await browser.close();
  } catch (e) {
    if (browser) {
      await browser.close();
    }

    if (e.name && e.name === "TimeoutError") {
      console.log("Something went wrong with submitting the form.");
      return;
    }
    console.log(e.message ? e.message : e);
  }
})();
