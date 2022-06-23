const { CronJob } = require("cron");
const crons = require("./index");

module.exports = function startCrons() {

  Object.keys(crons).forEach((key) => {
    const cron = crons[key];
    if (cron && cron.func) {
      if (cron.runOnStart) {
        cron.func();
      }
      cron.times.forEach((time) => {
        new CronJob(time, cron.func, null, true, "America/Los_Angeles");
      });
    }
  });
};
