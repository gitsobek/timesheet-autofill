const puppeteer = require("puppeteer");

const URL_DEV_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLScyt8cNjhbIQCH5GT5eoCLrq3MAF50f-PqtKPPKpQ21h0Jcxw/viewform";

describe("Timesheet Form", () => {
  let browser;
  let page;

  beforeAll(async () => {
    jest.setTimeout(30000);
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    await page.goto(URL_DEV_FORM, { waitUntil: "domcontentloaded" });
  });

  xit("should put test in debug mode", async () => {
    await jestPuppeteer.debug();
  });

  it("should open page properly", async () => {
    const title = await page.title();
    expect(title).toBe("Ewidencja godzinowa");
  });

  it('should display "Ewidencja godzinowa" on homepage', async () => {
    let text = await page.evaluate(() => document.body.textContent);
    await expect(text).toMatch("Ewidencja godzinowa");
  });

  describe("On form submitting", () => {
    const emailSelector = 'input[aria-label="Email address';
    const dateSelector = 'div[aria-label="Data"] input';
    const startTimeHourSelector =
      'div[aria-label="Godzina od"] div.freebirdFormviewerViewItemsTimeNumberEdit:first-child input';
    const startTimeMinutesSelector =
      'div[aria-label="Godzina od"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input';
    const endTimeHourSelector =
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:first-child input';
    const endTimeMinutesSelector =
      'div[aria-label="Godzina do"] div.freebirdFormviewerViewItemsTimeNumberEdit:last-child input';
    const submitSelector = 'div[role="button"] span';

    it("should fail with no filled fields", async () => {
      let text = await page.evaluate(() => document.body.textContent);
      await expect(text).not.toMatch("Odpowiedź na to pytanie jest wymagana");

      await page.click(submitSelector);
      await page.waitFor(500);

      text = await page.evaluate(() => document.body.textContent);
      await expect(text).toMatch("Odpowiedź na to pytanie jest wymagana");
    });

    it("should not validate email address", async () => {
      let text = await page.evaluate(() => document.body.textContent);
      await page.type(emailSelector, "abc");
      await page.click(submitSelector);
      await page.waitFor(500);
      await expect(text).toMatch("Odpowiedź na to pytanie jest wymagana");
    });

    it("should submit the form and naviagate to next page", async () => {
      const today = new Date().toISOString().split("T")[0];
      const todayArr = today.split("-");

      const _rand = (min, max) =>
        Math.floor(Math.random() * (max - min + 1)) + min;
      const startHour = _rand(0, 12);
      const endHour = _rand(startHour, 24);

      /* Select text in email input and remove it */
      await page.focus(emailSelector);
      await page.$eval(emailSelector, el =>
        el.setSelectionRange(0, el.value.length)
      );
      await page.keyboard.press("Backspace");

      await page.waitFor(500);

      await page.type(emailSelector, "czesc_123@o2.pl");

      await page.type(
        dateSelector,
        `${todayArr[1]}-${todayArr[2]}-${todayArr[0]}`
      );

      await page.type(startTimeHourSelector, startHour.toString(), {
        delay: 100
      });

      await page.type(startTimeMinutesSelector, "00", { delay: 100 });

      await page.type(endTimeHourSelector, endHour.toString(), { delay: 100 });
      await page.type(endTimeMinutesSelector, "00", { delay: 100 });

      await Promise.all([
        page.click(submitSelector),
        page.waitForNavigation({
          waitUntil: ["networkidle0", "domcontentloaded"]
        })
      ]);

      await page.waitFor(2000);

      let text = await page.evaluate(() => document.body.textContent);
      await expect(text).toMatch("Twoja odpowiedź została zapisana.");
    });
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
    return true;
  });
});
