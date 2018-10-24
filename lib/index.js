"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getMarketStats;

var _miningrigrentalsApiV = _interopRequireDefault(require("miningrigrentals-api-v2"));

var _nicehashApi = _interopRequireDefault(require("nicehash-api"));

var _chalk = _interopRequireDefault(require("chalk"));

var _dotenv = require("dotenv");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _dotenv.config)();
const mrrApiKey = {
  key: process.env.MRR_API_KEY,
  secret: process.env.MRR_API_SECRET
};
const nh_api_key = process.env.NH_API_KEY;
const nH_api_id = process.env.NH_API_ID;
let mrr = new _miningrigrentalsApiV.default(mrrApiKey);
let nh = new _nicehashApi.default(nh_api_key, nH_api_id);
const error = _chalk.default.bold.red;
/**
 * @param {Boolean} useApiKeys=false - tell the class whether the next two params are api keys or JS Classes
 * @param {(MiningRigRentals|Object)} mrrAPI - Either a MiningRigRentals constructor or MRR Apikeys to init one
 * @param {(NiceHash|Object)} nhAPI - Either a NiceHash constructor or NH Apikeys to init one
 * @param {Boolean} print=false - Prints the results
 * @returns {Promise<Object>}
 */

async function getMarketStats(useApiKeys = false, mrrAPI, nhAPI, print = false) {
  if (useApiKeys) {
    mrr = new _miningrigrentalsApiV.default(mrrAPI);
    nh = new _nicehashApi.default(nhAPI);
  } else {
    if (mrrAPI && nhAPI) {
      mrr = mrrAPI;
      nh = nhAPI;
    }
  }

  let europe_orders;

  try {
    europe_orders = await nh.getOrdersForAlgorithm(0, "scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get European NiceHash orders: ${err}`));
  }

  let nhSpeedGH = 0; //GH

  for (let order of europe_orders) {
    nhSpeedGH += Number(order.accepted_speed);
  }

  let american_orders;

  try {
    american_orders = await nh.getOrdersForAlgorithm(1, "scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get American NiceHash orders: ${err}`));
  }

  for (let order of american_orders) {
    nhSpeedGH += Number(order.accepted_speed);
  }

  let res;

  try {
    res = await mrr.getAlgo("scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get rig info from MiningRigRentals: ${err}`));
  }

  let mrrRentedHash = 0; //MH

  if (res.success && res.data) {
    mrrRentedHash = res.data.stats.rented.hash.hash;
  }

  let mrrSpeedGH = mrrRentedHash / 1000; //GH

  let totalSpeedGH = mrrSpeedGH + nhSpeedGH;
  let mrrMarketShare = mrrSpeedGH / totalSpeedGH;
  let nhMarketShare = nhSpeedGH / totalSpeedGH;
  let globalStats;

  try {
    globalStats = await nh.getCurrentGlobalStats24h();
  } catch (err) {
    throw new Error(error(`Failed to get NiceHash stats info: ${err}`));
  }

  let nhScryptPriceBtcThDay; //    BTC/TH/DAY

  for (let stat of globalStats) {
    if (stat.algo === "Scrypt") {
      nhScryptPriceBtcThDay = stat.price;
      break;
    }
  }

  let mrrScryptPriceBtcThDay;

  try {
    let res = await mrr.getAlgo('scrypt');

    if (res.success) {
      mrrScryptPriceBtcThDay = res.data.stats.prices.last_10.amount;
      mrrScryptPriceBtcThDay *= 1e6; //convert to BTC/TH/Day from BTC/MH/Day
    }
  } catch (err) {
    throw new Error(error(`Failed to get MRR scrypt price info: ${err}`));
  } //divide by 24 to get BTC/TH/Hour


  let nhScryptPriceBtcThHour = nhScryptPriceBtcThDay / 24;
  let mrrScryptPriceBtcThHour = mrrScryptPriceBtcThDay / 24;
  let mrrWeightedBtcThHour = mrrScryptPriceBtcThHour * mrrMarketShare;
  let nhWeightedBtcThHour = nhScryptPriceBtcThHour * nhMarketShare;
  let weightedAverageRentalCostBtcThHour = mrrWeightedBtcThHour + nhWeightedBtcThHour;

  if (print) {
    console.log(_chalk.default.bgGreen.bold('__Market Stats__'));
    console.log(_chalk.default.green.underline.bold(`Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(weightedAverageRentalCostBtcThHour).toFixed(6)}`)}`);
    console.log(_chalk.default.green.underline.bold(`MRR Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(mrrWeightedBtcThHour).toFixed(6)}`)}`);
    console.log(_chalk.default.green.underline.bold(`NiceHash Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(nhWeightedBtcThHour).toFixed(6)}`)}`);
    console.log('\n');
    console.log(_chalk.default.bgRed.bold(`MiningRigRentals`) + `  ${_chalk.default.red.bold(`${parseFloat(mrrMarketShare).toFixed(2)}`)}`);
    console.log(_chalk.default.red.bold.underline(`Hashpower (GH)`) + `: ${_chalk.default.bold(`${parseFloat(mrrSpeedGH).toFixed(6)}`)}`);
    console.log(_chalk.default.red.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${_chalk.default.bold(`${parseFloat(mrrScryptPriceBtcThHour).toFixed(6)}`)}`);
    console.log('\n');
    console.log(_chalk.default.bgYellowBright.bold(`NiceHash`) + `  ${_chalk.default.yellow.bold(`${parseFloat(nhMarketShare).toFixed(2)}`)}`);
    console.log(_chalk.default.yellow.bold.underline(`Hashpower (GH)`) + `: ${_chalk.default.bold(`${parseFloat(nhSpeedGH).toFixed(6)}`)}`);
    console.log(_chalk.default.yellow.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${_chalk.default.bold(`${parseFloat(nhScryptPriceBtcThHour).toFixed(6)}`)}`);
  }

  return {
    success: true,
    weighted: weightedAverageRentalCostBtcThHour,
    NiceHash: {
      nhSpeedGH,
      nhMarketWeight: nhMarketShare,
      nhScryptPrice: nhScryptPriceBtcThHour
    },
    MiningRigRentals: {
      mrrSpeedGH,
      mrrMarketWeight: mrrMarketShare,
      mrrScryptPrice: mrrScryptPriceBtcThHour
    }
  };
}