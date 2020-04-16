const express = require('express');
const router = express.Router();
const fs = require('fs');
const https = require('https');
const csv = require('csv-parser')

class CSVData {
  remoteFiles = new Array("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv", "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv");
  
  localFiles = new Array('public/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', 'public/csse_covid_19_time_series/time_series_covid19_deaths_global.csv', 'public/csse_covid_19_time_series/time_series_covid19_recovered_global.csv');

  selectedCountries = [];
  startAt = 0;

  constructor (selectedCountries, interval) {
    if (!selectedCountries) selectedCountries = ["all"]
    this.selectedCountries = selectedCountries

    this.startAt = interval?interval:0
  }

  getFile(num) {
    return {
      remote: this.remoteFiles[num],
      local: this.localFiles[num]
    }
  }

  getCountries(stack) {

    let i = 0;
    let element_ = [], countries = []
    
    stack.forEach(element => {

      element = element.replace("Korea, South", "Korea South")
      element = element.replace("Bonaire, Sint Eustatius and Saba", "Bonaire Sint Eustatius and Saba")
      element = element.split('"').join('');
      element_ = element.split(",")
      
      if (element_[1]) {
        if (countries.indexOf(element_[1]) == -1) countries.push(element_[1])
      }
      i++;
  
    })
  
    return countries
  }

  getDays(stack) {

    let days = [], j=0, i=0
    
    let element_ = stack.split(",")
    
    element_.shift()
    element_.shift()
    element_.shift()
    element_.shift()
  
    element_.forEach(elem => {
      if (j >= (element_.length - (this.startAt?this.startAt:element_.length))) { 
        elem = elem.split("/")
        days[i] = elem[1]+"."+elem[0]
        i++;
      }
      j++
    });
  
    return days
  }

  getDailyAmount(stack, total_days) {
    let element_ = []
    let j = 0, current = 0, i=0, c=0, lastcurrent=0;
    
    let stackResults = [], stackTotals = [], stackDailyIncrease = []
    
    this.selectedCountries.forEach(country => {

      stackResults[c] = []
      stackTotals[c] = []
      
      stack.forEach(element => {

        element = element.replace("Korea, South", "Korea South")
        element = element.replace("Bonaire, Sint Eustatius and Saba", "Bonaire Sint Eustatius and Saba")
        element = element.split('"').join('');
        element_ = element.split(",")
        
        if ((element_[1] == country) || country == "all") {

          element_.shift()
          element_.shift()
          element_.shift()
          element_.shift()
          
          j=0
          i=0
          
          element_.forEach(elem => {
            if (j >= (element_.length - (this.startAt?this.startAt:element_.length))) { 
              if (!stackResults[c][i]) stackResults[c][i] = 0
              
              current = (typeof parseInt(elem) !== 'undefined' && parseInt(elem) != null)?parseInt(elem):0;

              stackResults[c][i] += current
              
              if (j == (element_.length-1)) {
                stackTotals[c] = [stackResults[c][i]]
              }
              i++;
            }
            j++;
          });
        }
      });
      c++
    });

    let lastDayValue = []
    stackResults.forEach((element, key) => {
      stackDailyIncrease[key] = [];
      lastDayValue[key] = [];
      i=0
      element.forEach(elem => {
        
          current = elem
          stackDailyIncrease[key][i] = (current - lastcurrent)>0?(current - lastcurrent):0
          lastcurrent = current

          if (total_days-1 == i) lastDayValue[key] = stackDailyIncrease[key][i]
          i++
      
      });
    });

    
    return [stackResults, stackDailyIncrease, stackTotals, lastDayValue]
  }


  
  
  readCSVData() {
     
    return new Promise((resolve, reject) => {

      if (!fs.existsSync(this.getFile(0).local) || !fs.existsSync(this.getFile(1).local) || !fs.existsSync(this.getFile(2).local)) reject(false);

      /*let dataArrayTotalDays;
      
      let dataArrayTotalCases;
      await readCSVFile(this.getFile(0).local).then((res) => {dataArrayTotalCases = res;}).catch(() => {});
      dataArrayTotalCases = dataArrayTotalCases.split(/\r?\n/);
      dataArrayTotalDays = dataArrayTotalCases[0];
      dataArrayTotalCases.shift()
      
      let dataArrayTotalDeaths;
      await readCSVFile(this.getFile(1).local).then((res) => {dataArrayTotalDeaths = res}).catch(() => {});
      dataArrayTotalDeaths = dataArrayTotalDeaths.split(/\r?\n/);
      dataArrayTotalDeaths.shift()
      
      let dataArrayTotalRecovered;
      await readCSVFile(this.getFile(2).local).then((res) => {dataArrayTotalRecovered = res}).catch(() => {});
      dataArrayTotalRecovered = dataArrayTotalRecovered.split(/\r?\n/);
      dataArrayTotalRecovered.shift()*/

      let dataArrayTotalCases, dataArrayTotalDays, dataArrayTotalDeaths, dataArrayTotalRecovered;
      try {
        dataArrayTotalCases = fs.readFileSync(this.getFile(0).local, 'utf8');
        dataArrayTotalCases = dataArrayTotalCases.split(/\r?\n/);
        dataArrayTotalDays = dataArrayTotalCases[0];
        dataArrayTotalCases.shift() //because of get Days, the first row hve the days
      } catch (error) {
        reject(false);
      }
        
      
      
      try {
        dataArrayTotalDeaths = fs.readFileSync(this.getFile(1).local, 'utf8');
        dataArrayTotalDeaths = dataArrayTotalDeaths.split(/\r?\n/);
        dataArrayTotalDeaths.shift()
      } catch (error) {
        reject(false);
      }

      try {
        dataArrayTotalRecovered = fs.readFileSync(this.getFile(2).local, 'utf8');
        dataArrayTotalRecovered = dataArrayTotalRecovered.split(/\r?\n/);
        dataArrayTotalRecovered.shift()
      } catch (error) {
        reject(false);
      }
      
      resolve([dataArrayTotalDays, dataArrayTotalCases, dataArrayTotalDeaths, dataArrayTotalRecovered]);
    })
    
  
    
    /*let dataArrayTotalCases = fs.readFileSync(this.getFile(0).local, 'utf8');
    dataArrayTotalCases = dataArrayTotalCases.split(/\r?\n/);
    let dataArrayTotalDays = dataArrayTotalCases[0];
    dataArrayTotalCases.shift() //because of get Days, the first row hve the days

    let dataArrayTotalDeaths = fs.readFileSync(this.getFile(1).local, 'utf8');
    dataArrayTotalDeaths = dataArrayTotalDeaths.split(/\r?\n/);
    dataArrayTotalDeaths.shift()
  
    let dataArrayTotalRecovered = fs.readFileSync(this.getFile(2).local, 'utf8');
    dataArrayTotalRecovered = dataArrayTotalRecovered.split(/\r?\n/);
    dataArrayTotalRecovered.shift()*/
    
    //return [dataArrayTotalDays, dataArrayTotalCases, dataArrayTotalDeaths, dataArrayTotalRecovered];
    
  }

  calcCSVData(days, total, deaths, recovered) {
    
    let data = new Array()

    data[0] = this.getCountries(total)
    data[1] = this.getDays(days)

    data[2] = this.getDailyAmount(total, data[1].length)
    data[3] = this.getDailyAmount(deaths, data[1].length)
    data[4] = this.getDailyAmount(recovered, data[1].length)

    data[5] = this.selectedCountries
    
    return data
  }

}


function readCSVFile(path) {

  /*let results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(csv({ separator: ',' }))
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
    });
  })*/

  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}


function handleRequest(req, res) {
  let interval = "", selectedCountries = ""
  
  if (req.query && req.query.interval != null) interval = req.query.interval
  if (req.params && req.params.id != null) selectedCountries = req.params.id.split(",")

  CSVData_ = new CSVData(selectedCountries, interval);

  if (req.query && req.query.updatedata != null) {

    let promises = []
    let file = [];
    for (let index = 0; index < CSVData_.localFiles.length; index++) {
      promises[index] = new Promise((resolve, reject) => {
        file[index] = fs.createWriteStream(CSVData_.localFiles[index]);
        https.get(CSVData_.remoteFiles[index], function (response) {
            response.pipe(file[index] );
            file[index].on('finish', function () {
              file[index].close(); // close() is async, call callback after close completes.
              if (file[index].bytesWritten < 1000) reject(false)
              else resolve(true)
            });
            file[index].on('error', function (err) {
              fs.unlink(CSVData_.localFiles[index]); // Delete the file async. (But we don't check the result)
              reject(false)
            });
        });
      })
    }

    Promise.all(promises)
    .then((r) => {
      
      new Promise((resolve, reject) => {
        CSVData_.readCSVData()
        .then((res) => {
          result = CSVData_.calcCSVData(res[0], res[1], res[2], res[3])
          if (result.length) resolve(JSON.stringify(result))
          else reject()
        })
        .catch(() => {
          reject()
        })
      })
      .then((out) => res.send(out))
      .catch(() => res.sendStatus(500))

    }).catch((r) => {
      res.sendStatus(500)
    })
      
    return
  }
  

  
  new Promise((resolve, reject) => {
    
    CSVData_.readCSVData()
    .then((res) => {
      result = CSVData_.calcCSVData(res[0], res[1], res[2], res[3])
      if (result.length) resolve(JSON.stringify(result))
      else reject()
    })
    .catch(() => {
      reject()
    })
    
    //if (result.length) resolve(JSON.stringify(result))
    //else reject()
  })
  .then((out) => res.send(out))
  .catch(() => res.sendStatus(500))

  return;
}

router.get('/:id', function(req, res, next) {
  handleRequest(req, res)
  return;
})

router.get('/', function(req, res, next) {
  handleRequest(req, res)
  return;
});

module.exports = router;