import MiningRigRentals from 'miningrigrentals-api-v2'
import NiceHash from 'nicehash-api'
import chalk from 'chalk';
import { config } from 'dotenv'
config()

const mrrApiKey = {
	key: process.env.MRR_API_KEY,
	secret: process.env.MRR_API_SECRET
};


const nh_api_key = process.env.NH_API_KEY
const nH_api_id = process.env.NH_API_ID


let mrr = new MiningRigRentals(mrrApiKey);
let nh = new NiceHash(nh_api_key, nH_api_id);

const error = chalk.bold.red;

/**
 *
 * @param {Boolean} print=false - Prints the
 * @returns {Promise<Object>}
 */
export async function getMarketStats(mrrAPI, nhAPI, print) {
	if (mrrAPI && nhAPI) {
		mrr = new MiningRigRentals(mrrAPI)
		nh = new NiceHash(nhAPI)
	}

	let europe_orders;
	try {
		europe_orders = await nh.getOrdersForAlgorithm(0, "scrypt")
	} catch (err) {
		throw new Error(error(`Failed to get European NiceHash orders: ${err}`))
	}
	let nhSpeed = 0;

	for (let order of europe_orders) {
		nhSpeed += Number(order.accepted_speed)
	}

	let american_orders;
	try {
		american_orders = await nh.getOrdersForAlgorithm(1, "scrypt")
	} catch (err) {
		throw new Error(error(`Failed to get American NiceHash orders: ${err}`))
	}

	for (let order of american_orders) {
		nhSpeed += Number(order.accepted_speed)
	}

	let res;
	try {
		res = await mrr.getAlgo("scrypt")
	} catch (err) {
		throw new Error(error(`Failed to get rig info from MiningRigRentals: ${err}`))
	}
	let mrrRentedHash = 0
	if (res.success && res.data) {
		mrrRentedHash = res.data.stats.rented.hash.hash
	}
	let mrrSpeed = mrrRentedHash / 1000

	let totalSpeed = mrrSpeed + nhSpeed
	let mrrPercent = mrrSpeed/totalSpeed
	let nhPercent = nhSpeed/totalSpeed

	if (print) {
		console.log(chalk.bgGreen.bold('__Market Stats__\n'))
		console.log(chalk.bgRed.bold(`MiningRigRentals`) + `  ${chalk.red.bold(`${parseFloat(mrrPercent).toFixed(2)}%`)}`)
		console.log(chalk.red.underline(`Hashpower`) + `: ${chalk.bold(`${parseFloat(mrrSpeed).toFixed(6)}GH`)}`)
		console.log(chalk.bgYellowBright.bold(`NiceHash`) + `  ${chalk.yellow.bold(`${parseFloat(nhPercent).toFixed(2)}%`)}`)
		console.log(chalk.yellow.underline(`Hashpower`) + `: ${chalk.bold(`${parseFloat(nhSpeed).toFixed(6)}GH`)}`)
	}

	return {
		NiceHash: {
			speed: nhSpeed,
			percentOfMarket: nhPercent
		},
		MiningRigRentals: {
			speed: mrrSpeed,
			percentOfMarket: mrrPercent
		}
	}
}

getMarketStats(undefined, undefined, true)

