const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fetch = require('node-fetch');
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;

// need cookieParser middleware before we can do anything with cookies

app.use(cookieParser());

// let static middleware do its job
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());

app.post('/bot', (req, res) => {
	var conversation = req.body.conversation;
  console.log(conversation.memory.token);
  getBotData(conversation.memory.token, conversation.memory.categoria, conversation.memory.when).then(function (response) {
	const currency = response.userData.profile.currency;
	const transactions = response.searchData.results.map(result => {
		const transaction = result.transaction;
		const category = response.categoryData.find(category => category.id === transaction.categoryId);
		return (
			{
				transactionId:transaction.id,
				transactionDate:transaction.date,
				transactionDescription:transaction.description,
				transactionAmount:transaction.amount,
				categoryPrimaryName:category.primaryName
		   }
		);
    });
var replies = [];
replies[0] = {};
replies[0].type='list';	
	  replies[0].delay=null;
var elements = [];
for(i=0;i<transactions.length;i++){
	elements[i]={
            "title": transactions[i].transactionDescription,
            "imageUrl": "",
            "subtitle": String(transactions[i].transactionAmount) + " " + currency,
            "buttons": []
          };
}
	  replies[0].content = {};
replies[0].content.elements = elements;
	  replies[0].content.buttons = [];
  var response = {};
  response.replies = replies;
      res.send(JSON.stringify(response));
    }).catch(err => console.log(err));
});

app.post('/errors', (req, res) => {
  console.log(req.body)
  res.send()
});
// Needed to make client-side routing work in production.
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const base = 'https://api.tink.se/api/v1';


app.post('/botauth', function (req, res) {
  var cookie = req.cookies.tinkTestToken;
  if (cookie === undefined){
  console.log("botauth : no cookie");
  console.log("token : " + req.body.code);
  console.log(req.body); 
    getAccessToken(req.body.code).then(function (response) {
	 
	var hours = 2;
	var date = new Date();
	date.setTime(date.getTime()+(hours*60*60*1000));

	res.cookie('tinkTestToken',response.access_token, { maxAge: date, httpOnly: true });
	res.send(JSON.stringify({response: {cookie: response.access_token}}));
	console.log('cookie created successfully');

  }).catch(err => console.log(err));
  }
  else{
  console.log("cookie set:" + cookie);
  res.send(JSON.stringify({response: {cookie: cookie}}));
  }

});
// This is the server API, where the client can post a received OAuth code.
app.post('/callback', function (req, res) {
  var cookie = req.cookies.tinkTestToken;
  if (cookie === undefined){
  console.log("callback no cookie");
 
    getAccessToken(req.body.code).then(function (response) {
	 
	var hours = 8;
	var date = new Date();
	date.setTime(date.getTime()+(hours*60*60*1000));

	res.cookie('tinkTestToken',response.access_token, { maxAge: date, httpOnly: true });
	console.log('callback cookie created successfully');
	
    getData(response.access_token).then(function (response) {
      res.send(JSON.stringify({response: response}));
    }).catch(err => console.log(err));

  }).catch(err => console.log(err));
  }
  else{
      getData(cookie).then(function (response) {
      res.send(JSON.stringify({response: response}));
    }).catch(err => console.log(err));
  }

});

async function getData(accessToken) {
const searchResponse = await getSearchData(accessToken);
  const categoryResponse = await getCategoryData(accessToken);
  const userResponse = await getUserData(accessToken);
  const accountResponse = await getAccountData(accessToken);
  const investmentResponse = await getInvestmentData(accessToken);
  const transactionResponse = await getTransactionData(accessToken);

  return {
  searchData: searchResponse,
    categoryData: categoryResponse,
    userData: userResponse,
    accountData: accountResponse,
    investmentData: investmentResponse,
    transactionData: transactionResponse,
  };
}
async function getBotData(accessToken, categoria, when) {
const searchResponse = await getSearchData(accessToken, categoria, when);
const categoryResponse = await getCategoryData(accessToken);
	const userResponse = await getUserData(accessToken);
  return {
  searchData: searchResponse,
  categoryData: categoryResponse,
	   userData: userResponse
};
}

async function getAccessToken(code) {
console.log("getaccesstoken:" + code )
  const body = {
    code: code,
    client_id: CLIENT_ID, // Your OAuth client identifier.
    client_secret: CLIENT_SECRET, // Your OAuth client secret. Always handle the secret with care.
    grant_type: 'authorization_code',
  };

  const response = await fetch(base + '/oauth/token', {
    method: 'POST',
    body: Object.keys(body).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key])).join('&'),
    headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
  });

  if (response.status !== 200) {
    throw Error(response.status);
	  console.log(response);
  }
  return response.json();
}

async function getUserData(token) {
  const response = await fetch(base + '/user', {
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  });

  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}

async function getAccountData(token) {
  const response = await fetch(base + '/accounts/list', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
  });

  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}

async function getInvestmentData(token) {
  const response = await fetch(base + '/investments', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
  });

  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}

async function getTransactionData(token) {
  const response = await fetch(base + '/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({limit: 5}),
  });

  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}
async function getSearchData(token, categoria, when) {
  const response = await fetch(base + '/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify({queryString: categoria + " " + when}),
  });

  if (response.status !== 200) {
	console.log(token);
    throw Error(response.status);
  }
  return response.json();
/*
  const response = await fetch(base + '/statistics/query', {
  method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
	body: JSON.stringify({periods: ["2018-12"]}),
	/*
	{"periods": [
    "2018-12-1",
    "2018-12-31"
  ]}
	
  });
*/
  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}
async function getCategoryData(token) {
  const response = await fetch(base + '/categories', {
    headers: {
      'Authorization': 'Bearer ' + token,
    },
  });

  if (response.status !== 200) {
    throw Error(response.status);
  }
  return response.json();
}

if (!CLIENT_ID) {
  console.log('\x1b[33m%s\x1b[0m', 'Warning: REACT_APP_CLIENT_ID environment variable not set');
}

if (!CLIENT_SECRET) {
  console.log('\x1b[33m%s\x1b[0m', 'Warning: REACT_APP_CLIENT_SECRET environment variable not set');
}

// Start the server.
const port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('Tink example app listening on port ' + port);
});
