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
 *
 * @param {Boolean} print=false - Prints the
 * @returns {Promise<Object>}
 */

async function getMarketStats(mrrAPI, nhAPI, print = false) {
  if (mrrAPI && nhAPI) {
    mrr = new _miningrigrentalsApiV.default(mrrAPI);
    nh = new _nicehashApi.default(nhAPI);
  }

  let europe_orders;

  try {
    europe_orders = await nh.getOrdersForAlgorithm(0, "scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get European NiceHash orders: ${err}`));
  }

  let nhSpeed = 0;

  for (let order of europe_orders) {
    nhSpeed += Number(order.accepted_speed);
  }

  let american_orders;

  try {
    american_orders = await nh.getOrdersForAlgorithm(1, "scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get American NiceHash orders: ${err}`));
  }

  for (let order of american_orders) {
    nhSpeed += Number(order.accepted_speed);
  }

  let res;

  try {
    res = await mrr.getAlgo("scrypt");
  } catch (err) {
    throw new Error(error(`Failed to get rig info from MiningRigRentals: ${err}`));
  }

  let mrrRentedHash = 0;

  if (res.success && res.data) {
    mrrRentedHash = res.data.stats.rented.hash.hash;
  }

  let mrrSpeed = mrrRentedHash / 1000;
  let totalSpeed = mrrSpeed + nhSpeed;
  let mrrPercent = mrrSpeed / totalSpeed;
  let nhPercent = nhSpeed / totalSpeed;
  let globalStats;

  try {
    globalStats = await nh.getCurrentGlobalStats24h();
  } catch (err) {
    throw new Error(error(`Failed to get NiceHash stats info: ${err}`));
  }

  let nhScryptPrice; //    BTC/TH/DAY

  for (let stat of globalStats) {
    if (stat.algo === "Scrypt") {
      nhScryptPrice = stat.price;
      break;
    }
  }

  let mrrScryptPrice;

  try {
    let res = await mrr.getAlgo('scrypt');

    if (res.success) {
      mrrScryptPrice = res.data.stats.prices.last_10.amount;
      mrrScryptPrice *= 1000000; //convert to BTC/TH/Day from BTC/MH/Day
    }
  } catch (err) {
    throw new Error(error(`Failed to get MRR scrypt price info: ${err}`));
  }

  nhScryptPrice /= 24;
  mrrScryptPrice /= 24;
  let mrrWeighted = mrrScryptPrice * mrrPercent;
  let nhWeighted = nhScryptPrice * nhPercent;
  let totalWeight = mrrWeighted + nhWeighted;

  if (print) {
    console.log(_chalk.default.bgGreen.bold('__Market Stats__'));
    console.log(_chalk.default.green.underline.bold(`Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(totalWeight).toFixed(6)}`)}`);
    console.log(_chalk.default.green.underline.bold(`MRR Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(mrrWeighted).toFixed(6)}`)}`);
    console.log(_chalk.default.green.underline.bold(`NiceHash Weighted`) + `:  ${_chalk.default.bold(`${parseFloat(nhWeighted).toFixed(6)}`)}`);
    console.log('\n');
    console.log(_chalk.default.bgRed.bold(`MiningRigRentals`) + `  ${_chalk.default.red.bold(`${parseFloat(mrrPercent).toFixed(2)}`)}`);
    console.log(_chalk.default.red.bold.underline(`Hashpower (GH)`) + `: ${_chalk.default.bold(`${parseFloat(mrrSpeed).toFixed(6)}`)}`);
    console.log(_chalk.default.red.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${_chalk.default.bold(`${parseFloat(mrrScryptPrice).toFixed(6)}`)}`);
    console.log('\n');
    console.log(_chalk.default.bgYellowBright.bold(`NiceHash`) + `  ${_chalk.default.yellow.bold(`${parseFloat(nhPercent).toFixed(2)}`)}`);
    console.log(_chalk.default.yellow.bold.underline(`Hashpower (GH)`) + `: ${_chalk.default.bold(`${parseFloat(nhSpeed).toFixed(6)}`)}`);
    console.log(_chalk.default.yellow.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${_chalk.default.bold(`${parseFloat(nhScryptPrice).toFixed(6)}`)}`);
  }

  return {
    success: true,
    weighted: totalWeight,
    NiceHash: {
      speed: nhSpeed,
      percentOfMarket: nhPercent,
      nhScryptPrice
    },
    MiningRigRentals: {
      speed: mrrSpeed,
      percentOfMarket: mrrPercent,
      mrrScryptPrice
    }
  };
}