const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');


const server_address = 'localhost';
const port = 3000;

//let html_stream = fs.createReadStream('./html/search-form.html','utf8');


///use dot exists
///


let server = http.createServer((req,res)=>{

    console.log(`A new request was made from ${req.connection.remoteAddress} for ${req.url}`);

   // res.writeHead(200,{'Content-Type':'text/html'});
    //html_stream.pipe(res);


    if(req.url==='/'){
    	console.log("Requesting for root");
    	 let html_stream = fs.createReadStream('./html/search-form.html','utf8');
    	 html_stream.pipe(res);
    	 res.writeHead(200,{'Content-Type':'text/html'});
    }


    else if(req.url==='/favicon.ico'){
    	console.log("A request for an asset");
    	res.writeHead(404);
    	res.end();

    }
    
    else if(req.url.includes('/artists/')){

    	res.writeHead(200,{'Content-Type':'image/jpeg'});

 		let image_stream = fs.createReadStream("."+req.url);
 		image_stream.pipe(res);

    	image_stream.on('error',function(err){
    		console.log(err);
    		res.writeHead(404);
    		return res.end();
    	});

    }

    else if(req.url.includes('/search?artist=')){
		const user_input = url.parse(req.url, true);

    	console.log(user_input.query.artist);

		const credentials_json = fs.readFileSync('./auth/credentials.json','utf-8');
        const credentials = JSON.parse(credentials_json);



		let post_data =querystring.stringify( {
            "client_id" : credentials.client_id,
            "client_secret" : credentials.client_secret,
        	"grant_type":"client_credentials"
		});

		//console.log(post_data);

        //POST https://accounts.spotify.com/api/token/pos_data


        	//console.log(aaa);
        	const authentication_req_url = 'https://accounts.spotify.com/api/token';
        	let request_sent_time = new Date();

        	let options = {
                "method": "POST",
                "headers": {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            }




        let authentication_cache = "auth/authentication_res.json";

        let cache_valid = false;
        let cached_auth;
        if(fs.existsSync(authentication_cache)){

            let content = fs.readFileSync(authentication_cache,'utf-8');
            cached_auth = JSON.parse(content);


            console.log(cached_auth.expiration);
            console.log(Date.now());

            if(new Date(cached_auth.expiration) > Date.now()){
                cache_valid = true;

            }
            else{
                console.log('Token Expired');
            }
        }
        if(cache_valid){
            create_search_req(cached_auth,res,user_input);
        }

        else{
            const authentication_req_url = 'https://accounts.spotify.com/api/token';
            let request_sent_time = new Date();

            let authentatication_req = https.request(authentication_req_url,options,authentication_res=>{
                console.log("chickenansdansldas");
                recieved_authentication(authentication_res,res,user_input,request_sent_time);
            });

            authentatication_req.on('error',(e)=>{
                    console.error(e);
                }
            );
            authentatication_req.write(post_data);
            console.log("Requesting Token");
            authentatication_req.end();
        }
















        // let authentatication_req = https.request(authentication_req_url,options,authentication_res=>{
         //    recieved_authentication(authentication_res,res,user_input,request_sent_time);
        // });
        //
        	// authentatication_req.on('error',(e)=>{
		// 		console.error(e);
		// 		}
		// 	);
		// authentatication_req.write(post_data);
		// console.log("Requesting Token");
		// authentatication_req.end();



       // let aaaa = http.request(, options, callback)
    }
  
    
});

function recieved_authentication(authentication_res,res,user_input,request_sent_time){  //i got my access token here
	authentication_res.setEncoding("utf8");
	let body = "";
		authentication_res.on("data",data =>{body+=data;});
		authentication_res.on("end", () =>{

			let authentication_res_data = JSON.parse(body);  //changed to search from authentication_res_data

            //var currentDate = new Date().getMilliseconds();


            authentication_res_data.expiration = new Date((new Date().getTime()+authentication_res_data.expires_in*1000));
            console.log(authentication_res_data.expiration);
			create_cache(authentication_res_data);


		 create_search_req(authentication_res_data,res,user_input,request_sent_time);
			console.log(authentication_res_data+"testasdasd");



		})


}

function create_cache(authentication_res_data){
    //let fileWrite = fs.writeFile(authentication_res_data)

  // fs.writeFile('authentication_res.json', JSON.stringify(authentication_res_data), 'utf8', ()=>{});

    fs.writeFile('auth/authentication_res.json', JSON.stringify(authentication_res_data), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });


}

function create_search_req(authentication_res_data,res,user_input,request_sent_time){


    const search_req_url = 'https://api.spotify.com/v1/search?';




    let Request_Parameter  = querystring.stringify({
        q: user_input.query.artist,
        type:'artist',
        access_token: authentication_res_data.access_token

    }, '&');






    let searchInput = search_req_url+Request_Parameter;   ///changed to stringigy


    let body = "";
    let search_req = https.request(searchInput,search_res=>{

        search_res.on("data",data =>{body+=data;});
        search_res.on("end", () => {
            const aaaaa = JSON.parse((body));

           // console.log(aaaaa.)

            let name = querystring.stringify(aaaaa.artists.items[0].name);
            //console.log(searchInput+"searchInput");

            const fileName = aaaaa.artists.items[0].images[0].url;
          //  const path = './artists/'+aaaaa.artists.items[0].images[0]+'.jpg';
            const imageName = fileName.substring(fileName.lastIndexOf('/')+1);


            console.log(imageName+"thisis thw file name");


            let genres =  (aaaaa.artists.items[0].genres);
            // let name =   querystring.stringify(aaaaa.artists.items[0].name+"kkk");

            console.log(aaaaa.artists.items[0].name+"this is the name");

           // console.log(aaaaa.artists.items[0].images[0].url);




            let webpage = `<h1>${aaaaa.artists.items[0].name}</h1><p>${genres}</p> <img src="./artists/${imageName}.jpg"/>`;


            let image_req = https.get(aaaaa.artists.items[0].images[0].url,image_res=>{
                let new_img = fs.createWriteStream('./artists/'+imageName+'.jpg',{'encoding':null});
                image_res.pipe(new_img);
                new_img.on('finish',function(){
                    res.end(webpage);



                });
            });







        });


    });

    search_req.on('error',(e)=>{
        console.error(e);
    });

    console.log("Search Requested");
    search_req.end();

    // let aaaa = http.request(, options, callback)
}


function recieved_search(search_res,res,user_input,request_sent_time){

 search_res.setEncoding('utf8');
    let body = "";
    search_res.on("data",data =>{body+=data;});
    search_res.on("end", () =>{
        let search_res_data = JSON.parse(body);



        //create_cache(authentication_res_data);
       // create_search_req(search_res_data,res,user_input,request_sent_time);
     //  console.log(search_res_data+"applellllsa");


       //console.log(body+"hey");





    });

}










console.log('Now listening on port ' + port);
server.listen(port,server_address);