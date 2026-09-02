import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:5173";

function log(label, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} - ${label}${detail ? " :: " + detail : ""}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto(URL, { waitUntil: "networkidle0" });
  await page.waitForSelector(".card h2");

  // clear localStorage and reload to start from a known seed state
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".expense");

  // ---- 1. Sort order: newest first ----
  const titles = await page.$$eval(".expense-title", (els) =>
    els.map((el) => el.childNodes[0].textContent.trim())
  );
  log(
    "Sort order newest-first (Board game before Wine)",
    titles.indexOf("Board game") < titles.indexOf("Wine") &&
      titles[0] === "Board game",
    titles.join(" | ")
  );

  // ---- 2. Balances panel signs ----
  const balanceRows = await page.$$eval(".balance-row", (rows) =>
    rows.map((r) => ({
      name: r.querySelector(".who").textContent.trim(),
      label: r.querySelector(".owe, .owed, .settled")?.textContent.trim(),
    }))
  );
  const aisha = balanceRows.find((r) => r.name.includes("Aisha"));
  const ben = balanceRows.find((r) => r.name.includes("Ben"));
  const carlos = balanceRows.find((r) => r.name.includes("Carlos"));
  const diya = balanceRows.find((r) => r.name.includes("Diya"));
  log("Aisha owes $85.01", aisha.label === "owes $85.01", aisha.label);
  log("Ben is owed $59.00", ben.label === "is owed $59.00", ben.label);
  log("Carlos owes $16.99", carlos.label === "owes $16.99", carlos.label);
  log("Diya is owed $43.00", diya.label === "is owed $43.00", diya.label);

  // ---- 3. Settle up transfers ----
  const transfers = await page.$$eval(".transfer", (els) =>
    els.map((el) => el.textContent.replace(/\s+/g, " ").trim())
  );
  log(
    "Settle-up has 3 transfers summing correctly",
    transfers.length === 3,
    transfers.join(" || ")
  );

  // ---- 4. Filter by "Paid by" actually filters (Bug 5) ----
  await page.select("#paidBy", "1"); // Aisha
  await page.waitForFunction(
    () => document.querySelectorAll(".expense").length > 0
  );
  let filteredCount = await page.$$eval(".expense", (els) => els.length);
  let filteredTitles = await page.$$eval(".expense-title", (els) =>
    els.map((el) => el.childNodes[0].textContent.trim())
  );
  log(
    "Paid-by filter (Aisha) returns only Aisha's expenses, not zero",
    filteredCount > 0 &&
      filteredTitles.every((t) =>
        ["Groceries", "Museum tickets"].includes(t)
      ),
    `count=${filteredCount} titles=${filteredTitles.join(",")}`
  );
  await page.select("#paidBy", ""); // reset to Anyone

  // ---- 5. Category filter still works ----
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".chip")].find(
      (b) => b.textContent.trim() === "Travel"
    );
    btn.click();
  });
  await page.waitForFunction(() => {
    const titles = [...document.querySelectorAll(".expense-title")].map(
      (el) => el.childNodes[0].textContent.trim()
    );
    return titles.length === 2;
  });
  let travelTitles = await page.$$eval(".expense-title", (els) =>
    els.map((el) => el.childNodes[0].textContent.trim())
  );
  log(
    "Category filter (Travel) shows only travel expenses",
    travelTitles.sort().join(",") === "Train tickets,Uber to airport",
    travelTitles.join(",")
  );

  // ---- 6. Delete while filtered removes the RIGHT expense (Bug 6) ----
  // Currently filtered to Travel: Uber to airport ($60), Train tickets ($90)
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".expense")];
    const uber = rows.find((r) => r.textContent.includes("Uber to airport"));
    uber.querySelector(".btn.danger").click();
  });
  await page.waitForFunction(() => {
    return ![...document.querySelectorAll(".expense-title")].some((el) =>
      el.textContent.includes("Uber to airport")
    );
  });
  // reset filter to All to see full list
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".chip")].find(
      (b) => b.textContent.trim() === "All"
    );
    btn.click();
  });
  await page.waitForFunction(
    () => document.querySelectorAll(".expense").length === 8
  );
  let allTitlesAfterDelete = await page.$$eval(".expense-title", (els) =>
    els.map((el) => el.childNodes[0].textContent.trim())
  );
  log(
    "Deleting 'Uber to airport' while filtered removed ONLY that expense (8 remain, others intact)",
    allTitlesAfterDelete.length === 8 &&
      !allTitlesAfterDelete.includes("Uber to airport") &&
      allTitlesAfterDelete.includes("Train tickets") &&
      allTitlesAfterDelete.includes("Wine"),
    allTitlesAfterDelete.join(",")
  );

  // ---- 7. Edit amount inline while a search filter is active (Bug 6 again) ----
  await page.type("#search", "Board");
  await page.waitForFunction(
    () => document.querySelectorAll(".expense").length === 1
  );
  await page.evaluate(() => {
    const input = document.querySelector(".edit-amount");
    input.value = "99";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.blur();
  });
  await page.waitForFunction(() => {
    const amt = document.querySelector(".expense .amount");
    return amt && amt.textContent.includes("99.00");
  });
  await page.evaluate(() => {
    document.querySelector("#search").value = "";
    document.querySelector("#search").dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(
    () => document.querySelectorAll(".expense").length === 8
  );
  const boardGameNow = await page.$$eval(".expense", (rows) => {
    const row = rows.find((r) => r.textContent.includes("Board game"));
    return row?.querySelector(".amount")?.textContent;
  });
  const trainStillIntact = await page.$$eval(".expense", (rows) => {
    const row = rows.find((r) => r.textContent.includes("Train tickets"));
    return row?.querySelector(".amount")?.textContent;
  });
  log(
    "Editing amount while search-filtered updated the RIGHT expense only",
    boardGameNow === "$99.00" && trainStillIntact === "$90.00",
    `boardGame=${boardGameNow} train=${trainStillIntact}`
  );

  // ---- 8. Add member shows up in Paid-so-far immediately (Bug 8) ----
  await page.type("#newMember", "Frank Nguyen");
  await page.evaluate(() => {
    [...document.querySelectorAll("form")]
      .find((f) => f.querySelector("#newMember"))
      .requestSubmit();
  });
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".person-stat span")].some((s) =>
      s.textContent.includes("Frank Nguyen")
    )
  );
  const frankListed = await page.$$eval(".person-stat", (rows) =>
    rows.some((r) => r.textContent.includes("Frank Nguyen"))
  );
  log("New member appears in 'Paid so far' immediately, no expense edit needed", frankListed);

  // ---- 9. Add a new equal-split expense and confirm it lands at top (newest) ----
  await page.type("#desc", "Test Dinner");
  await page.type("#amt", "30");
  await page.evaluate(() => {
    document.querySelector("#date").value = "2026-03-20";
    document.querySelector("#date").dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click(".btn"); // Save expense
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".expense-title")].some((el) =>
      el.textContent.includes("Test Dinner")
    )
  );
  const firstTitleAfterAdd = await page.$eval(
    ".expense-title",
    (el) => el.childNodes[0].textContent.trim()
  );
  log(
    "Newly added expense (2026-03-20, latest date) appears at the top",
    firstTitleAfterAdd === "Test Dinner",
    firstTitleAfterAdd
  );

  // ---- 10. Reload persistence: dates survive as real Date objects, sort still works (Bug 7) ----
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".expense");
  const titlesAfterReload = await page.$$eval(".expense-title", (els) =>
    els.map((el) => el.childNodes[0].textContent.trim())
  );
  log(
    "Sort order still correct (newest first) AFTER a page reload",
    titlesAfterReload[0] === "Test Dinner" &&
      titlesAfterReload.indexOf("Board game") < titlesAfterReload.indexOf("Wine"),
    titlesAfterReload.join(" | ")
  );

  // ---- 11. Console errors ----
  log("No console/page errors thrown during the run", consoleErrors.length === 0, consoleErrors.join(" | "));

  await page.screenshot({ path: "e2e-final.png", fullPage: true });
} finally {
  await browser.close();
}
