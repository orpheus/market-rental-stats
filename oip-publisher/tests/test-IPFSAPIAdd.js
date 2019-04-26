const fs = require("fs");
const IPFSAPIAdd = require('../src/IPFSAPIAdd');

var toMB = function(num){
	return Math.round((num  / 1024 / 1024) * 100) / 100;
}

var logMemoryUsage = function(){
	var used = process.memoryUsage().heapUsed;
	console.log(`Currently using approximately ${toMB(used)} MB of RAM`);
}
logMemoryUsage()
setInterval(logMemoryUsage, 500)

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

var fileStat = fs.statSync(__dirname + '/tears_of_steel.mp4')
var fileSize = toMB(fileStat.size);

console.log("File size is " + fileSize + " MB")

console.log("Spawning IPFSAPIAdd")
var ipfs = new IPFSAPIAdd(tears_of_steel_stream, {
	filename: "tears_of_steel.mp4",
	filesize: fileStat.size,
	host: 'ipfs-dev.alexandria.io', 
	port: 443, 
	protocol: 'https',
	oip_auth: {
		address:"oNRs1nuR1vUAjWJwhMtxJPQoTFAm9MWz1G", 
		message:'1534278675842{"oip042":{}}', 
		signature:"Hw2iuomv/fhYYoKX8bNroVXmOvbh/e9gqZjP+I9kZymHD72mqtDw1qjN6/Qh4nhTDOHI8mkxbWtsaLSTuCkSihU="
	}
})
console.log("IPFSAPIAdd spawned")

console.log("Adding file to IPFS")

let prevProgressTime = 0

ipfs.onProgress((progress_obj) => {
	if (Date.now()-500 >= prevProgressTime){
		prevProgressTime = Date.now()
		console.log("Upload Progress " + JSON.stringify(progress_obj))
	}
})

ipfs.start().then((response) => {
	console.log("Add Complete! " + JSON.stringify(response))
})