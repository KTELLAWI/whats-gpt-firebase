import pkg from "qrcode-terminal";
import Whatsapp from "whatsapp-web.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";
import { Configuration, OpenAIApi } from "openai";
import express from "express";
import qr2 from "qrcode";
import { fileURLToPath } from "url";
import { dirname } from "path";
// import { env } from "process";
import { config } from "dotenv";
import axios from "axios";



const apiUrl = 'https://usersearch-3hc7.onrender.com';

async function postDataToApi(data) {
    try {
        const response = await axios.post(apiUrl, data);
        // The API response data will be available in 'response.data'
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error posting data to API:', error.message);
        throw error;
    }
}




config(); // Load environment variables from .env file

const { Client, LocalAuth } = Whatsapp;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const appEx = express();
appEx.use(express.urlencoded({ extended: true }));

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: "https://usersearchbot-default-rtdb.firebaseio.com",
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,

}
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

const configuration = new Configuration({
    apiKey: "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",
});

const openai = new OpenAIApi(configuration);

appEx.get("/authenticate/:phoneNumber", (req, res) => {
    const phoneNumber = req.params.phoneNumber;
    // const promt = req.params.promt;
    var arr_chat = [
        {
            role: "system",
            content: "promt",
        },
    ];

    const sessionName = `session-${phoneNumber}`;
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionName }),
    });

    console.log("Client is not ready to use!");
    console.log(client);
    client.on("qr", (qrCode) => {
        pkg.generate(qrCode, { small: true });
        qr2.toDataURL(qrCode, (err, src) => {
            console.log(src);
            if (err) res.send("Error occured");
            res.send(`
      <!DOCTYPE html>
<html>
<head>
<title>SearchAgentGPT</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway">
<style>
body,h1 {font-family: "Raleway", sans-serif}
body, html {height: 100%}
.bgimg {
  background-image: url('https://th.bing.com/th/id/OIG.9OaOz..GySPJde.ZPNZ8?pid=ImgGn');
  min-height: 100%;
  background-position: center;
  background-size: cover;
}
</style>
</head>
<body>

<div class="bgimg w3-display-container w3-animate-opacity w3-text-white">
  <div class="w3-display-topleft w3-padding-large w3-xlarge">
  SearchAgentGPT
  </div>
  <div class="w3-display-middle">
 <center>
    <h2  class="w3-jumbo w3-animate-top">QRCode Generated</h2>
    
    <hr class="w3-border-grey" style="margin:auto;width:40%">
    <p class="w3-center"><div><img src='${src}'/></div></p>
    </center>
  </div>
  <div class="w3-display-bottomleft w3-padding-large">
    Powered by <a href="/" target="_blank">DigistacksAI</a>
  </div>
</div>

</body>
</html>

    `);
        });
    });

    client.on("ready", () => {
        console.log("Client is ready!");
        res.send(`
        <!DOCTYPE html>
  <html>
  <head>
  <title>SearchAgentGPT</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Raleway">
  <style>
  body,h1 {font-family: "Raleway", sans-serif}
  body, html {height: 100%}
  .bgimg {
    background-color: black;
    min-height: 100%;
    background-position: center;
    background-size: cover;
    
  }
  </style>
  </head>
  <body>
  
  <div class="bgimg w3-display-container w3-animate-opacity w3-text-white">
    <div class="w3-display-topleft w3-padding-large w3-xlarge">
    SearchAgentGPT
    </div>
    <div class="w3-display-middle">
   <center>
      <h2  class="w3-jumbo w3-animate-top">SearchBotAgent is Ready to use on your phone number , start searching with it </h2>
      
      <hr class="w3-border-grey" style="margin:auto;width:40%">
      <p class="w3-center"><div><img src=''/></div></p>
      <p class="w3-center"><div>You  can close this window </div></p>
      </center>
    </div>
    <div class="w3-display-bottomleft w3-padding-large">
      Powered by <a href="/" target="_blank">DigistacksAI</a>
    </div>
  </div>
  
  </body>
  </html>
  
      `);
    });

    client.initialize();
    client.on("message", async (message) => {
        const chat = await message.getChat();
        console.log(chat.id.user);
        var userId = chat.id.user + "";
        console.log(userId);
        console.log(arr_chat);
        set(ref(database, "links/test/" + chat.id.user), {
            messages: arr_chat,
        });
        // const starCountRef = ref(database, 'links/jo/'+chat.id.user);
        get(child(dbRef, "/links/test/" + chat.id.user))
            .then(async (snapshot) => {
                if (snapshot.exists()) {
                    console.log(snapshot.val());
                    const data = await snapshot.val();
                    console.log(data.messages);
                    arr_chat = data.messages;
                    arr_chat.push({
                        role: "user",
                        content: message.body,
                    });
                    console.log(arr_chat);
                    set(ref(database, "links/test/" + chat.id.user), {
                        messages: arr_chat,
                    });

                    // Example data to post to the API (modify this based on the API's expected data format)
                        const postData = {
                        query: message.body,
                       
                    };

                    // Call the function to post data to the API
                  const usersearcbot = await   postDataToApi(postData);

                    // const completion = await openai.createChatCompletion({
                    //     model: "gpt-3.5-turbo",
                    //     messages: arr_chat,
                    // });
                   // console.log(completion.data.choices[0].message);
                    //   const completion =  await model.chat_completion(arr_chat)
                   // console.log(completion.data.choices[0].message.content);
                   message.reply(usersearcbot);
                    arr_chat.push({
                        role: "system",
                        content:usersearcbot, 
                        //completion.data.choices[0].message.content,
                    });
                    console.log(arr_chat);
                    set(ref(database, "/links/test/" + chat.id.user), {
                        messages: arr_chat,
                    });
                } else {
                    console.log("No data available");
                }
            })
            .catch((error) => {
                console.error(error);
            });
    });
});
appEx.post("/submit", (req, res) => {
    console.log(req.body);
   // const message = req.body.message;
    const phoneNumber = req.body.phoneNumber;
    res.redirect("/authenticate/" + phoneNumber );
});
appEx.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
appEx.listen(3500, function () {
    console.log("Example app listening on port 3500");
});
