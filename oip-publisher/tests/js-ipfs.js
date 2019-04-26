var fs = require("fs");
var IPFS = require("ipfs");

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
var fileReadableStream = fs.createReadStream(__dirname + '/tears_of_steel.mp4')
console.log("File Readable Stream Created")

var fileStat = fs.statSync(__dirname + '/tears_of_steel.mp4')
var fileSize = toMB(fileStat.size);

console.log("File size is " + fileSize + " MB")

console.log("Spawning ipfs node")
const node = new IPFS()
console.log("IPFS node spawned")

node.on('ready', function() {
	console.log("IPFS Ready! Adding file to IPFS")

	node.files.add(fileReadableStream, {
		progress: function(bytesAdded){
			console.log("Added " + toMB(bytesAdded) + " MB out of " + fileSize + " MB")
		}
	}, function(err, response){
		if (err){
			console.error(err)
		} else {
			console.log("File Add Success!!! " + JSON.stringify(response))
		}
	})
})