import cron from 'node-cron'
import _ from 'lodash'
import { newLogger } from 'src/services/logging'

const log = newLogger('Workers')

export default function startCrons() {

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
