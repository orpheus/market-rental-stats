import { Artifact, Multipart } from "oip-index"

const CHOP_MAX_LEN = 900;
const FLODATA_MAX_LEN = 1040;

/** Easily broadcast OIP messages */
class OIP {
	/**
	 * Create a new OIP Broadcaster
	 * @param  {Wallet} wallet - The Wallet that should broadcast the messages
	 * @param  {Address} address - The Address you wish to sign and broadcast with
	 */
	constructor(wallet, address){
		this._wallet = wallet
		this._address = address
	}
	async sendTransaction(data){
		let send_to = {}
		send_to[this._address.getPublicAddress()] = 0.0001

		let txid
		try {
			txid = await this._wallet.sendPayment({
				discover: false,
				to: send_to,
				from: this._address.getPublicAddress(),
				floData: data
			})
		} catch (e) {
			throw new Error("Unable to send floData Transaction! \n" + e)
		}

		return txid
	}
	async broadcastMessage(json_to_broadcast){
		let broadcast_json = { oip042: json_to_broadcast }
		let broadcast_string = JSON.stringify(broadcast_json)

		if (broadcast_string.length <= FLODATA_MAX_LEN){
			let txid
			try {
				txid = await this.sendTransaction("json:" + broadcast_string)
			} catch (e) {
				throw new Error("Unable to Broadcast Message! \n" + e)
			}

			return txid
		} else {
			let txids
			try {
				txids = await this.broadcastMultiparts(this.getMultiparts(broadcast_string))
			} catch(e) {
				throw new Error("Unable to Broadcast Message! \n" + e)
			}

			return txids
		}
	}
	async broadcastMultiparts(multiparts){
		let tmp_multiparts
		let txids = []

		for (var multipart of multiparts){
			if (txids.length > 0){
				multipart.setFirstPartTXID(txids[0])
				multipart.sign(this._address)
			}

			try {
				let txid = await this.sendTransaction(multipart.toString())
				txids.push(txid)
			} catch(e) {
				throw new Error("Unable to Broadcast Multiparts! \n" + e)
			}
		}

		return txids
	}
	/**
	 * Get the Multiparts for a specific message
	 * @param  {String} message - The string you wish to create multiparts from
	 * @return {Array.<Multipart>}         [description]
	 */
	getMultiparts(message){
		// Check if we can just broadcast all the data in `floData`
		if (message.length <= FLODATA_MAX_LEN)
			throw new Error("Message can fit in only one Transaction, Multiparts are thus not allowed!")

		let multiparts = [];

		var tmpMessage = message.slice(0)
		var chunks = [];

		while (tmpMessage.length > CHOP_MAX_LEN) {
			chunks[chunks.length] = tmpMessage.slice(0, CHOP_MAX_LEN);
			tmpMessage = tmpMessage.slice(CHOP_MAX_LEN);
		}
		chunks[chunks.length] = tmpMessage;

		for (var c in chunks){
			var mp = new Multipart();

			mp.setPartNumber(parseInt(c));
			mp.setTotalParts(chunks.length - 1);
			mp.setPublisherAddress(this._address.getPublicAddress());
			mp.setChoppedStringData(chunks[c]);
			mp.is_valid = mp.isValid().success;

			// If we are the first multipart, then sign right now, for all others, sign after the first tx has broadcast.
			if (c == 0){
                mp.is_first_part = true;
                mp.hasJSONPrefix = true;
                
                mp.sign(this._address);
			}

			multiparts.push(mp);
		}

		return multiparts
	}
	async publish(item){
		let pub_message = {}

		// Get the sub-object key
		let publish_type = "register"

		if (item instanceof Artifact)
			publish_type = "publish"

		// Set it up to be blank
		pub_message[publish_type] = {}

		// Set the timestamp of the item
		item.setTimestamp(Date.now())

		let item_json = item.toJSON()

		// Remove the version from the returned json, we don't want to publish it twice.
		item_json = item_json.oip042

		pub_message[publish_type] = item_json

		// Create signature preimages
		let signature_preimage

		if (item instanceof Artifact)
			signature_preimage = `${item.getLocation()}-${item.getMainAddress()}-${item.getTimestamp()}`

		// if (item instanceof Publisher)
		// 	signature_preimage = `${item.getAlias()}-${item.getMainAddress()}-${item.getTimestamp()}`

		let signature
		try {
			signature = this._address.signMessage(signature_preimage)
		} catch(e) {
			throw new Error("Unable to create signature preimage! \n" + e)
		}

		pub_message[publish_type][item.getClassName().toLowerCase()].signature = signature

		let txid
		try {
			txid = await this.broadcastMessage(pub_message)
		} catch(e) {
			throw new Error(`Unable to Publish ${item.getClassName()}! \n` + e)
		}

		return txid
	}
	edit(){

	}
	transfer(){

	}
	deactivate(){

	}
}

module.exports = OIP