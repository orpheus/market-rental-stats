var fs = require("fs");
var ipfsAPI = require("ipfs-api");

var toMB = function(num){
	return Math.round((num  / 1024 / 1024) * 100) / 100;
}

var logMemoryUsage = function(){
	var used = process.memoryUsage().heapUsed;
	console.log(`Currently using approximately ${toMB(used)} MB of RAM`);
}
logMemoryUsage()
setInterval(logMemoryUsage, 500)

console.log("Spawning ipfs from ipfsAPI")
var ipfs = ipfsAPI({
	host: 'ipfs-dev.alexandria.io', 
	port: 443, 
	protocol: 'https',
	headers: {
		'OIP-Auth': JSON.stringify({address:"oNRs1nuR1vUAjWJwhMtxJPQoTFAm9MWz1G", message:'1534278675842{"oip042":{}}', signature:"Hw2iuomv/fhYYoKX8bNroVXmOvbh/e9gqZjP+I9kZymHD72mqtDw1qjN6/Qh4nhTDOHI8mkxbWtsaLSTuCkSihU="})
	}
})
console.log("IPFS API spawned")

console.log("Creating File Readable Stream")
var tears_of_steel_stream = fs.createReadStream(__dirname + '/tears_of_steel.mp4')
var image_file_stream = fs.createReadStream(__dirname + '/image.jpg')

var tears_of_steel = {
	path: "tears_of_steel.mp4",
	content: tears_of_steel_stream
}

var image_file = {
	path: "image.jpg",
	content: image_file_stream
}

console.log("File Readable Stream Created")

var fileStat = fs.statSync(__dirname + '/image.jpg')
var fileSize = toMB(fileStat.size);

console.log("File size is " + fileSize + " MB")

console.log("Adding file to IPFS")

let prevProgressTime = 0

ipfs.files.add(image_file, {
	progress: function(bytesAdded){
		if (Date.now()-500 >= prevProgressTime){
			prevProgressTime = Date.now()
			console.log("Added " + toMB(bytesAdded) + " MB out of " + fileSize + " MB")
		}
	},
	wrapWithDirectory: true
}, function(err, response){
	if (err){
		console.error(err)
	} else {
		console.log("File Add Success!!! " + JSON.stringify(response, null, 4))
	}
})