var ipfsAPI = require("ipfs-api");
const dagPB = require('ipld-dag-pb')
const DAGLink = dagPB.DAGLink
const DAGNode = dagPB.DAGNode

var ipfs = ipfsAPI({
	host: 'ipfs-dev.alexandria.io', 
	port: 443, 
	protocol: 'https',
	headers: {
		'OIP-Auth': JSON.stringify({address:"oNRs1nuR1vUAjWJwhMtxJPQoTFAm9MWz1G", message:'1534278675842{"oip042":{}}', signature:"Hw2iuomv/fhYYoKX8bNroVXmOvbh/e9gqZjP+I9kZymHD72mqtDw1qjN6/Qh4nhTDOHI8mkxbWtsaLSTuCkSihU="})
	}
})

// Lookup an existing IPFS object to get size, and name
// ipfs.object.get("QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX", (err, objec) => {
// 	console.log(objec.toJSON())
// })

var video_link = new DAGLink("tears_of_steel.mp4", 234728206, "QmeXHJzmgqqreSknZ3jpifmCZdiYPWLJLFXNqvDDr9EZMU")
var image_link = new DAGLink("image.jpg", 18252, "QmV6ciQv6ZiWjUTXnnDmaTNHXTufi8xnYyqukxLB4oqxL4")
var ipfs_pdf = new DAGLink("ipfs.draft3.pdf", 213377, "QmV9tSDx9UiPeWExXEeH6aoDvmihvx6jD5eLb4jbTaKGps")

async function addLinksToNewDirectory(links){
	// Create a new IPFS Directory	
	var node = await ipfs.object.new('unixfs-dir');

	// Add links to the items we want to be in that directory
	for (var link of links){
		node = await ipfs.object.patch.addLink(node.toJSON().multihash, link)
	}

	// Add the dag node we created to the IPFS API node
	node = await ipfs.object.put(node)

	// Return the final node.
	return node
}

var folder_with_files_node = addLinksToNewDirectory([video_link, image_link, ipfs_pdf]).then((node) => {
	console.log(node.toJSON())
}).catch((e) => {
	console.error(e)
})

// ipfs.object.new('unixfs-dir', (err, node) => {
// 	console.log(err, node.toJSON())

// 	ipfs.object.patch.addLink(node.toJSON().multihash, video_link, (err2, node2) => {
// 		console.log(err2, node2.toJSON())

// 		ipfs.object.patch.addLink(node2.toJSON().multihash, image_link, (err3, node3) => {
// 			console.log(err3)
// 			console.log(node3.toJSON())

// 			ipfs.object.put(node3, (err4, node4) => {
// 				console.log(err4, node4.toJSON())
// 			})
// 		})
// 	})
// })