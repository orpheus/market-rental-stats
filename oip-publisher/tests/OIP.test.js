import { Artifact, ArtifactFile } from 'oip-index'
import { Wallet } from 'oip-hdmw'
import OIP from "../src/OIP";

test("Publish Artifact", async (done) => {
	let wallet = new Wallet('00000000000000000000000000000005', {
		discover: false,
		supported_coins: ["flo"]
	})

	let address = wallet.getCoin('flo').getMainAddress()

	console.log(address.getPublicAddress())

	let artifact = new Artifact()
	artifact.setMainAddress(address.getPublicAddress())

	artifact.setTitle("¼ Test ½ Unicode 😊 ¾ Ψ")
	artifact.setDescription("Required Φ Description! Χ")
	
	artifact.setType("Image")
	artifact.setLocation("QmQh7uTC5YSinJG2FgWLrd8MYSNtr8G5JGAckR5ARwmyET")

	let file = new ArtifactFile()
	file.setType("Image")
	file.setFilename("lhuWVA00Vn.png")
	file.setFilesize(23591)

	artifact.addFile(file)

	let broadcaster = new OIP(wallet, address)

	// console.log(JSON.stringify(artifact.toJSON()))

	let txids = await broadcaster.publish(artifact)
	console.log(txids)
	expect(txids).toBeDefined()
	done()
}, 20000)