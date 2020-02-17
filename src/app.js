#!/usr/bin/env node

const fs = require("fs");
const path = require('path');
const _ = require("lodash");
const puppeteer = require("puppeteer");
const Transform = require("stream").Transform;

const URL_REGEX = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

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
      .filter(line => line !== "")
      .reduce((dict, pair) => {
        pair = pair.split("=");
        this.dictionary[pair[0].toLowerCase()] = pair[1];
      }, {});
    done();
  };
  return parser;
};

const sheet = new TimeSheet();

(async () => {
  try {
    /* Load user timesheet config */
    const dictionary = await sheet.loadConfig(path.join(__dirname, '../config.txt'));

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
    const args = process.argv;
    let [, , start = dictionary.start, end = dictionary.end] = args;
    [start, end] = [parseInt(start), parseInt(end)];

    if (!start || !end) {
      throw new Error("Working hours must be numbers!");
    }

    if (start > end) {
      throw new Error("Starting hour cannot be greater than ending hour!");
    }

    /* Check if set timesheet link is a valid URL */
    if (!URL_REGEX.test(dictionary.url)) {
      throw new Error("Invalid URL!");
    }

    /* Boot up headless browser */
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    /* Go to timesheet form */
    await page.goto(dictionary.url);

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
      start.toString(),
      { delay: 100 }
    );
    await page.type(
      'div[aria-label="Godzina od"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input',
      "00",
      { delay: 100 }
    );

    await page.type(
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:first-child input',
      end.toString(),
      { delay: 100 }
    );
    await page.type(
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input',
      "00",
      { delay: 100 }
    );

    /* Submit the form */
    await Promise.all([
      page.click('div[role="button"] span'),
      page.waitForNavigation({
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 2000
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
    if (e.name && e.name === "TimeoutError") {
      console.log("Something went wrong with submitting the form.");
      return;
    }
    console.log(e.message ? e.message : e);
    await browser.close();
  }
})();
