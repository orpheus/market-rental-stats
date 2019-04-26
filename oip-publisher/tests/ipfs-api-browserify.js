var ipfsAPI = require("ipfs-api");

var ipfs = ipfsAPI('ipfs-dev.alexandria.io', 443, {
	protocol: 'https',
	headers: {
		"OIP-Auth": JSON.stringify({address:"oNRs1nuR1vUAjWJwhMtxJPQoTFAm9MWz1G", message:'1534278675842{"oip042":{}}', signature:"Hw2iuomv/fhYYoKX8bNroVXmOvbh/e9gqZjP+I9kZymHD72mqtDw1qjN6/Qh4nhTDOHI8mkxbWtsaLSTuCkSihU="})
	}
})

ipfs.add(Buffer.from("000000", "hex"), function(err, node){
	console.log(err)
	console.log(node)
})

module.exports = {
	ipfs: ipfs,
	buf: Buffer
}