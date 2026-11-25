/* DataPilot AI site settings: the one place for the contact address, the download link, the
   version shown, and the checkout.
   checkout (Paddle, our Merchant of Record): when clientToken and a price id are both set, the Buy
   button loads https://cdn.paddle.com/paddle/v2/paddle.js on the first click (nothing from Paddle
   loads before that) and opens the Paddle checkout for that price. While either is empty, Buy
   writes an email to contactEmail ("DataPilot Pro, monthly" or "DataPilot Pro, yearly").
   environment: "production", or "sandbox" to test with a sandbox token and sandbox price ids.
   Prices and plan features live in pricing.json. */
window.SITE_CONFIG = {
  contactEmail: "hassan93radi@gmail.com",
  downloadUrl: "https://github.com/hasanradi93/datapilot/releases/latest/download/DataPilotAI-Setup.exe",
  version: "0.3.0",
  checkout: {
    provider: "paddle",
    clientToken: "",
    environment: "production",
    proMonthlyPriceId: "",
    proYearlyPriceId: ""
  }
};
