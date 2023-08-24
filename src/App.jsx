import { useState } from "react";
import axios from 'axios';
import { NFTStorage } from 'nft.storage';


function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [minted, setMinted] = useState(false);
  console.log(prompt);


  const cleanupIPFS = (url) => {
    if (url.includes("ipfs://")) {
      return url.replace("ipfs://", "https://ipfs.io/ipfs/")
    }
  } 


/*
In the context of Axios, a "blob" refers to a Binary Large Object. A Blob is a data type that represents raw data, typically binary data like images, audio, video, or other binary file types. It allows you to handle data that is not in a plain text format, such as JSON or XML.
Axios is a popular JavaScript library used for making HTTP requests from web browsers or Node.js environments. When using Axios, you may encounter Blobs when dealing with certain types of data, like file uploads or binary responses from a server.
For example, if you want to download an image or a file using Axios, the server might respond with a Blob containing the binary data of the image or file. You can then use this Blob to display the image or save the file locally on the user's device.
To work with Blobs in Axios, you can use the responseType configuration option to specify the expected data type in the server's response. For example, if you expect a Blob in the response, you can set responseType: 'blob'
The response.data will contain the Blob, and we create an object URL using URL.createObjectURL to display the image on the web page.
*/
  const generateArt = async () => {
    setLoading(true)
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          headers: {
            Authorization: `Bearer ${AUTH_API_KEY}`,
          },
          method: "POST",
          inputs: prompt,
        },
        { responseType: "blob" }
      );
      // convert blob to a image file type
      const file = new File([response.data], "image.png", {
        type: "image/png",
      });
      console.log(file);
      // saving the file in a state
      setFile(file);
      console.log(response);
      const url = URL.createObjectURL(response.data);
      // console.log(url)
      console.log(url);
      setImageBlob(url);
    } catch (err) {
			console.log(err);
      setError(true)
		} finally {
      setLoading(false)
    }
	};
  

  const uploadArtToIpfs = async () => {
    try {
  
      const nftstorage = new NFTStorage({
        token: `${IPFS_API_KEY}`,
      })
  
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file
      })
  
      console.log(store);
      return cleanupIPFS(store.data.image.href)
  
    } catch(err) {
      console.log(err)
      return null
    }
  }




  const mintNft = async () => {
    try {
      const imageURL = await uploadArtToIpfs();
      console.log("URL ", imageURL)
      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: name?.length > 0 ? name : "AI NFT",
          description: description?.length > 0 ? description : "AI generated NFT",
          mint_to_address: address?.length > 0 ? address : CONTRACT_ADDRESS, // wallet address
        },
        {
          headers: {
            Authorization: `${KEY}`,
          }
        }
      );
      const data = await response.data;
      setMinted(true)
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  console.log(name);
  console.log(description);
  console.log(address);


  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless Mints</h1>
      <div className="flex flex-col items-center justify-center">
        {/* Create an input box and button saying next beside it */}
        <div className="flex items-center justify-center gap-4">
          <input
            className="p-2 border-2 border-black rounded-md"
            onChange={(e) => setPrompt(e.target.value)}
            type="text"
            placeholder="Enter a prompt"
          />
          <button
            onClick={generateArt}
            className="p-2 text-white bg-black rounded-md"
          >
            Next
          </button>
          {loading && <p>Loading...</p>}
        </div>
        {imageBlob && (
          <div className="flex flex-col items-center justify-center gap-4">
            <img src={imageBlob} alt="AI generated art" />
            {
              minted ? <p>Minted this NFT</p> : (
                <div className="flex flex-col items-center justify-center gap-4">
        {/* input for name */}
        <input
          className="p-2 border-2 border-black rounded-md"
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="Enter a name"
        />
        {/* input for description */}
        <input
          className="p-2 border-2 border-black rounded-md"
          onChange={(e) => setDescription(e.target.value)}
          type="text"
          placeholder="Enter a description"
        />
        {/* input for address */}
        <input
          className="p-2 border-2 border-black rounded-md"
          onChange={(e) => setAddress(e.target.value)}
          type="text"
          placeholder="Enter a address"
        />
        {/* button to mint */}
        <button
          onClick={mintNft}
          className="p-2 text-white bg-black rounded-md"
        >
          Mint
        </button>
      </div>
              )
            }
          </div>
        )}
      </div>
    </div>
  );
  }

export default App;
