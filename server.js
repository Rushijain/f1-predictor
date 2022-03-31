const http = require('http');
require('dotenv').config()
const express = require('express');
const fs = require('fs');
var bodyParser = require('body-parser')
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static("express"));

app.use(bodyParser.urlencoded({ extended: false }))


app.use(bodyParser.json())

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname+'/express/index.html'));
});

app.get("/results", (req, res) => {
  res.sendFile(path.join(__dirname+'/express/results.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/leaderboard.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/home.html'));
});

app.get('/predict', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/predict.html'));
});

app.get('/quali_prediction', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/quali_prediction.html'));
});

app.get('/season_prediction', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/season_prediction.html'));
});

app.get('/my_predictions', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/my_predictions.html'));
});

app.get('/season_results', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/season_results.html'));
});

app.get('/rules', (req, res) => {
  res.sendFile(path.join(__dirname+'/express/rules.html'));
});

app.post('/login', (req, res) => {

  console.log('Data:', req.body);
  let dataFound = 0;

  let userData = fs.readFileSync(path.resolve(__dirname, 'data/user.json'));
  userData = JSON.parse(userData);

  userData.forEach(user => {

    if(user.userId == req.body.userId && user.password == req.body.password) {

      console.log("Data found");
      dataFound = 1;

      return res.status(200).send({
        message: "Login Successful"
      });
    }
  });

  if(dataFound == 0) {
    return res.status(400).send({
      message: 'This is an error in Login!'
    });
  }
});

app.get('/season', (req, res) => {
  let seasons = fs.readFileSync(path.resolve(__dirname, 'data/seasons.json'));
  seasons = JSON.parse(seasons);

  let ISToffSet = 330;
  offset= ISToffSet*60*1000;
  let date = new Date(new Date().getTime()+offset);

  seasons.forEach((s, i) => {
    let sDate = new Date(s.date);
    let d = (sDate - date)/3600000;

    if(d > 0) {
      seasons[i]["status"] = true;
    }
  });

  return res.status(200).send(seasons);
});

app.post('/season_prediction', (req, res) => {
  let data = req.body;
  console.log(data);

  if(!data.season || !data.userId) {
    return res.status(400).send({
      message: 'This is an error in Login!'
    });
  }

  let season = fs.readFileSync(path.resolve(__dirname, 'data/seasons.json'));
  season = JSON.parse(season);

  let seasonDate = season.find(r => r.name == data.season)["date"];

  let ISToffSet = 330;
  offset= ISToffSet*60*1000;
  let date = new Date(new Date().getTime()+offset)

  seasonDate = new Date(seasonDate);
  let diff = (seasonDate - date)/3600000
  if(diff < 0) {
    return res.status(400).send("Time for submitting your prediction has exceeded");
  }

  if (fs.existsSync(path.resolve(__dirname, "data/" + data.season + ".json"))) {
    console.log("File Exists");
    let seasonData = fs.readFileSync(path.resolve(__dirname, "data/" + data.season + ".json"));
    seasonData = JSON.parse(seasonData);

    let userAvailable = false;
    seasonData.forEach((user, i) => {
      if(user.userId == data.userId) {
        seasonData[i]["first"] = data.first;
        seasonData[i]["second"] = data.second;
        seasonData[i]["team"] = data.team;
        userAvailable = true;
      }
    });

    if(!userAvailable) {
      seasonData.push({
        first: data.first,
        second: data.second,
        team: data.team,
        userId : data.userId
      });
    }

    fs.writeFileSync(path.resolve(__dirname, "data/" + data.season + ".json"), JSON.stringify(seasonData));

    return res.status(200).send("Predictions have been saved");
  }
  else {
    console.log("File Not found");
    let seasonData = [{
      first: data.first,
      second: data.second,
      team: data.team,
      userId : data.userId
    }];

    console.log(seasonData);
    fs.writeFileSync(path.resolve(__dirname, "data/" + data.season + ".json"), JSON.stringify(seasonData));
    return res.status(200).send("Predictions have been saved");
  }
});

app.post('/season_results', (req, res) => {
  let info = req.body;
  let data = {
    seasonResults: {},
    userPrediction: {}
  };

  if (fs.existsSync(path.resolve(__dirname, "data/" + info.season + "_season_results.json"))) {

    let seasonData = fs.readFileSync(path.resolve(__dirname, "data/" + info.season + "_season_results.json"));
    data["seasonResults"] = JSON.parse(seasonData);
  }

  if (fs.existsSync(path.resolve(__dirname, "data/" + info.season + ".json"))) {

    let userPredictions = fs.readFileSync(path.resolve(__dirname, "data/" + info.season + ".json"));
    userSeasonPredictions = JSON.parse(userPredictions);

    let userPrediction =  userSeasonPredictions.find(u => u.userId == info.userId);
    data["userPrediction"] = userPrediction || {};
  }

  return res.status(200).send(data);
});

app.get('/raceData', (req, res) => {
  let raceData = fs.readFileSync(path.resolve(__dirname, 'data/race.json'));
  raceData = JSON.parse(raceData);

  let ISToffSet = 330;
  offset= ISToffSet*60*1000;
  let date = new Date(new Date().getTime()+offset);

  console.log(date);
  console.log(new Date(raceData[0].race_date));

  raceData.forEach((race, i) => {
    let raceDate = new Date(race.race_date);
    let raceDiff = (raceDate - date)/3600000;

    if(raceDiff < 0.5) {
      raceData[i]["racePredictionStatus"] = 0;
    }
    else {
      raceData[i]["racePredictionStatus"] = 1;
    }

    let qualiDate = new Date(race.quali_date);
    qualiDiff = (qualiDate - date)/3600000;

    if(qualiDiff < 0.5) {
      raceData[i]["qualiPredictionStatus"] = 0;
    }
    else {
      raceData[i]["qualiPredictionStatus"] = 1;
    }

    if(qualiDiff < 24 && raceDiff > -4)
      raceData[i]["status"] = 2;
    else if(raceDiff < -4)
      raceData[i]["status"] = 3;
    else
      raceData[i]["status"] = 1;
  });

  return res.status(200).send(raceData);
});

app.get('/driverList', (req, res) => {
  let driverList = fs.readFileSync(path.resolve(__dirname, 'data/driver.json'));
  driverList = JSON.parse(driverList);

  driverList = driverList.filter(c => c.active == 1);

  return res.status(200).send(driverList);
});

app.post('/raceInputPrediction', (req, res) => {
  let data = {
    driverList: [],
    userPrediction: {},
    raceData: {}
  };

  let raceName = req.body.race;
  let userId = req.body.userId;

  let driverList = fs.readFileSync(path.resolve(__dirname, 'data/driver.json'));
  driverList = JSON.parse(driverList);
  driverList = driverList.filter(c => c.active == 1);
  data.driverList = driverList;

  if(fs.existsSync(path.resolve(__dirname, "data/" + raceName + ".json"))) {
    let race_predictions = fs.readFileSync(path.resolve(__dirname, "data/" + raceName + ".json"));
    race_predictions = JSON.parse(race_predictions);
    let user_prediction = race_predictions.find(c => c.userId == userId);
    if(user_prediction)
      data.userPrediction = user_prediction;
  }
  
  let allRaces = fs.readFileSync(path.resolve(__dirname, "data/race.json"));
  allRaces = JSON.parse(allRaces);
  let raceData = allRaces.find(c => c.name == raceName);
  if(raceData)
    data.raceData = raceData;
  else
    return res.status(400).send("Race Data Not Found");

  return res.status(200).send(data);
});

app.post('/pole_prediction', (req, res) => {
  let data = req.body;
  console.log(data);

  if(!data.race || !data.userId) {
    return res.status(400).send({
      message: 'This is an error in Login!'
    });
  }

  let race = fs.readFileSync(path.resolve(__dirname, 'data/race.json'));
  race = JSON.parse(race);

  let qualiDate = race.find(r => r.name == data.race)["quali_date"];

  let ISToffSet = 330;
  offset= ISToffSet*60*1000;
  let date = new Date(new Date().getTime()+offset)

  qualiDate = new Date(qualiDate);
  let diff = (qualiDate - date)/3600000
  if(diff < 0.5) {
    return res.status(400).send("Time for submitting your prediction has exceeded");
  }

  if (fs.existsSync(path.resolve(__dirname, "data/" + data.race + ".json"))) {
    console.log("File Exists");
    let raceData = fs.readFileSync(path.resolve(__dirname, "data/" + data.race + ".json"));
    raceData = JSON.parse(raceData);

    let userAvailable = false;
    raceData.forEach((user, i) => {
      if(user.userId == data.userId) {
        raceData[i]["pole"] = data.pole;
        userAvailable = true;
      }
    });

    if(!userAvailable) {
      raceData.push({
        pole: data.pole,
        userId : data.userId
      });
    }

    fs.writeFileSync(path.resolve(__dirname, "data/" + data.race + ".json"), JSON.stringify(raceData));

    return res.status(200).send("Prediction have been saved");
  }
  else {
    console.log("File Not found");
    let raceData = [{
      pole: data.pole,
      userId : data.userId
    }];

    console.log(raceData);
    fs.writeFileSync(path.resolve(__dirname, "data/" + data.race + ".json"), JSON.stringify(raceData));
    return res.status(200).send("Predictions have been saved");
  }

})

app.post('/prediction', (req, res) => {
  let data = req.body;

  console.log(data);

  if(!data.race || !data.userId) {
    return res.status(400).send({
      message: 'This is an error in Login!'
    });
  }

  let race = fs.readFileSync(path.resolve(__dirname, 'data/race.json'));
  race = JSON.parse(race);

  let race_date = race.find(r => r.name == data.race)["race_date"];

  let ISToffSet = 330;
  offset= ISToffSet*60*1000;
  let date = new Date(new Date().getTime()+offset)

  console.log(date);

  race_date = new Date(race_date);

  console.log(race_date);
  let diff = (race_date - date)/3600000
  if(diff < 0.5) {
    return res.status(400).send("Time for submitting your prediction has exceeded");
  }

  if (fs.existsSync(path.resolve(__dirname, "data/" + data.race + ".json"))) {
    console.log("File Exists");
    let raceData = fs.readFileSync(path.resolve(__dirname, "data/" + data.race + ".json"));
    raceData = JSON.parse(raceData);

    let userAvailable = false;
    raceData.forEach((user, i) => {
      if(user.userId == data.userId) {
        raceData[i]["first"] = data.first;
        raceData[i]["second"] = data.second;
        raceData[i]["third"] = data.third;
        raceData[i]["fastest"] = data.fastest;
        raceData[i]["team"] = data.team;
        userAvailable = true;
      }
    });

    if(!userAvailable) {
      raceData.push({
        first: data.first,
        second: data.second,
        third: data.third,
        fastest: data.fastest,
        team: data.team,
        userId : data.userId
      });
    }

    fs.writeFileSync(path.resolve(__dirname, "data/" + data.race + ".json"), JSON.stringify(raceData));

    return res.status(200).send("Predictions have been saved");
  }
  else {
    console.log("File Not found");
    let raceData = [{
      first: data.first,
      second: data.second,
      third: data.third,
      fastest: data.fastest,
      team: data.team,
      userId: data.userId
    }];

    console.log(raceData);
    fs.writeFileSync(path.resolve(__dirname, "data/" + data.race + ".json"), JSON.stringify(raceData));
    return res.status(200).send("Predictions have been saved");
  }
});

app.post('/user_predictions', (req, res) => {
  let userId = req.body.userId;
  let predictions = [];

  if(!userId)
    return res.status(400).send("User Id not found");

  let races = fs.readFileSync(path.resolve(__dirname, "data/race.json"));
  races = JSON.parse(races);

  races.forEach((r, i) => {
    let currentPrediction = {};

    if (fs.existsSync(path.resolve(__dirname, "data/" + r.name + ".json"))) {

      console.log("File Exists");

      let race_predictions = fs.readFileSync(path.resolve(__dirname, "data/" + r.name + ".json"));
      race_predictions = JSON.parse(race_predictions);
      let user_prediction = race_predictions.find(c => c.userId == userId);

      if(user_prediction)
        currentPrediction = user_prediction;
    }

    currentPrediction["race"] = r.name;
    currentPrediction["country"] = r.country;
    currentPrediction["circuit"] = r.circuit;
    predictions.push(currentPrediction);

    if(races.length - 1 == i) {
      console.log("Reached last race  " + races.length + "  " + i);
      return res.status(200).send(predictions);
    }
  });
});

app.post("/results", (req, res) => {
  let info = req.body;
  let raceName = info.name;
  let userId = info.userId;
  let data = {
    raceResults : {},
    userPrediction: {}
  };

  if (fs.existsSync(path.resolve(__dirname, "data/" + raceName + "_race_results.json"))) {
    let raceResults = fs.readFileSync(path.resolve(__dirname, "data/" + raceName + "_race_results.json"));
    data["raceResults"] = JSON.parse(raceResults);
  }

  if (fs.existsSync(path.resolve(__dirname, "data/" + raceName + ".json"))) {
    let userRacePredictions = fs.readFileSync(path.resolve(__dirname, "data/" + raceName + ".json"));
    userRacePredictions = JSON.parse(userRacePredictions);

    console.log("file found");
    let userPrediction = userRacePredictions.find(u => u.userId == userId);
    console.log(userPrediction);
    data["userPrediction"] = userPrediction;
  }

  console.log("Exiting before it");
  return res.status(200).send(data);
});

app.post('/leaderboard', (req, res) => {
  let lData = fs.readFileSync(path.resolve(__dirname, "data/leaderboard.json"));
  lData = JSON.parse(lData);

  return res.status(200).send(lData);
});

app.post("/update_leaderboard", (req, res) => {
  console.log(req.body);
  let lData = req.body;
  fs.writeFileSync(path.resolve(__dirname, "data/leaderboard.json"), JSON.stringify(lData));

  return res.status(200).send("Successful");
});

app.post("/update_race_results", (req, res) => {
  let data = req.body;
  let name = data.name;

  fs.writeFileSync(path.resolve(__dirname, "data/"+ name +"_race_results.json"), JSON.stringify(data));

  return res.status(200).send("Successful");
});

app.post('/race_predictions', (req, res) => {
  let name = req.body.name;
  if (fs.existsSync(path.resolve(__dirname, "data/" + name + ".json"))) {

    let data = fs.readFileSync(path.resolve(__dirname, "data/" + name + ".json"));
    return res.status(200).send(JSON.parse(data));
  }

  return res.status(200).send("No Predictions made yet");
});

app.post('/update_race_predictions', (req, res) => {
  let info = req.body;
  let name = info.name;

  let data = info.data;

  fs.writeFileSync(path.resolve(__dirname, "data/" + name + ".json"), JSON.stringify(data));

  return res.status(200).send("Successful");
});

app.post('/get_all_races', (req, res) => {

  let data = fs.readFileSync(path.resolve(__dirname, "data/race.json"));

  return res.status(200).send(data);
});

app.post('/update_races', (req, res) => {

  let data = req.body;

  fs.writeFileSync(path.resolve(__dirname, "data/race.json"), JSON.stringify(data));
  return res.status(200).send("successful");;
});

app.post('/get_all_seasons', (req, res) => {

  let data = fs.readFileSync(path.resolve(__dirname, "data/seasons.json"));

  return res.status(200).send(data);
});

app.post('/update_seasons', (req, res) => {

  let data = req.body;

  fs.writeFileSync(path.resolve(__dirname, "data/seasons.json"), JSON.stringify(data));
  return res.status(200).send("successful");
});

app.post("/update_season_results", (req, res) => {
  let data = req.body;
  let name = data.name;

  if(!name)
    return res.status(200).send("Unsuccessful");

  fs.writeFileSync(path.resolve(__dirname, "data/"+ name +"_season_results.json"), JSON.stringify(data));

  return res.status(200).send("Successful");
});

app.post('/update_season_predictions', (req, res) => {
  let info = req.body;
  let name = info.name;

  let data = info.data;

  fs.writeFileSync(path.resolve(__dirname, "data/" + name + ".json"), JSON.stringify(data));

  return res.status(200).send("Successful");
});

app.post('/get_season_predictions', (req, res) => {
  let info = req.body;
  let name = info.name;

  let data = fs.readFileSync(path.resolve(__dirname, "data/" + name + ".json"));

  return res.status(200).send(data);
});

app.post('/get_all_users', (req, res) => {

  let data = fs.readFileSync(path.resolve(__dirname, "data/user.json"));

  return res.status(200).send(data);
});

app.post('/update_users', (req, res) => {
  let data = req.body;

  fs.writeFileSync(path.resolve(__dirname, "data/user.json"), JSON.stringify(data));
  return res.status(200).send("successful");
});

app.post('/get_drivers', (req, res) => {

  let data = fs.readFileSync(path.resolve(__dirname, "data/driver.json"));
  return res.status(200).send(data);
});

app.post('/update_drivers', (req, res) => {
  let data = req.body;

  fs.writeFileSync(path.resolve(__dirname, "data/driver.json"), JSON.stringify(data));
  return res.status(200).send("Successful");
});

const server = http.createServer(app);
server.listen(process.env.PORT);
console.debug('Server listening on port ' + process.env.PORT);