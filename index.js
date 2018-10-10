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

	let globalStats;
	try {
		globalStats = await nh.getCurrentGlobalStats24h()
	} catch (err) {
		throw new Error(error(`Failed to get NiceHash stats info: ${err}`))
	}
	let nhScryptPrice; //    BTC/TH/DAY
	for (let stat of globalStats) {
		if (stat.algo === "Scrypt") {
			nhScryptPrice = stat.price;
			break
		}
	}

	let mrrScryptPrice;
	try {
		let res = await mrr.getAlgo('scrypt')
		if (res.success) {
			mrrScryptPrice = res.data.stats.prices.last_10.amount
			mrrScryptPrice *= 1000000 //convert to BTC/TH/Day from BTC/MH/Day
		}
	} catch (err) {
		throw new Error(error(`Failed to get MRR scrypt price info: ${err}`))
	}

	//convert prices to BTC/TH/Hr
	nhScryptPrice /= 24
	mrrScryptPrice /= 24
	// console.log(nhScryptPrice, mrrScryptPrice)

	let mrrWeighted = mrrScryptPrice * mrrPercent
	let nhWeighted = nhScryptPrice * nhPercent
	let totalWeight = mrrWeighted + nhWeighted

	if (print) {
		console.log(chalk.bgGreen.bold('__Market Stats__'))
		console.log(chalk.green.underline.bold(`Weighted`) + `:  ${chalk.bold(`${parseFloat(totalWeight).toFixed(6)}`)}`)
		console.log(chalk.green.underline.bold(`MRR Weighted`) + `:  ${chalk.bold(`${parseFloat(mrrWeighted).toFixed(6)}`)}`)
		console.log(chalk.green.underline.bold(`NiceHash Weighted`) + `:  ${chalk.bold(`${parseFloat(nhWeighted).toFixed(6)}`)}`)



		console.log('\n')
		console.log(chalk.bgRed.bold(`MiningRigRentals`) + `  ${chalk.red.bold(`${parseFloat(mrrPercent).toFixed(2)}`)}`)
		console.log(chalk.red.bold.underline(`Hashpower (GH)`) + `: ${chalk.bold(`${parseFloat(mrrSpeed).toFixed(6)}`)}`)
		console.log(chalk.red.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${chalk.bold(`${parseFloat(mrrScryptPrice).toFixed(6)}`)}`)
		console.log('\n')
		console.log(chalk.bgYellowBright.bold(`NiceHash`) + `  ${chalk.yellow.bold(`${parseFloat(nhPercent).toFixed(2)}`)}`)
		console.log(chalk.yellow.bold.underline(`Hashpower (GH)`) + `: ${chalk.bold(`${parseFloat(nhSpeed).toFixed(6)}`)}`)
		console.log(chalk.yellow.bold.underline(`Scrypt Price (BTC/TH/Hour)`) + `: ${chalk.bold(`${parseFloat(nhScryptPrice).toFixed(6)}`)}`)

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
	}
}

getMarketStats(undefined, undefined, true)

