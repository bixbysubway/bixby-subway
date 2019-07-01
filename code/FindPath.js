module.exports.function = function findPath(startPoint, endPoint, wishTime, mak, point) {
  const config = require('config');
  const baseURL = config.get("baseUrl");
  const console = require('console');
  const http = require('http');
  const fail = require('fail');

  const api = '59726d4b58736b79343548564e7141';
  const service = 'SearchSTNTimeTableByIDService';

  const graphData = require("./station.js");
  const stationData = require("./vertices.js");
  
    var API=config.get("apiUrl");
  var KAPI=config.get("kakaoUrl");
  var options1 = {
    format: 'json',
    headers: {
      'accept': 'application/json'
    },
  };
  
  var options2 = {
    format: 'json',
    headers: {
      'accept': 'application/json',
      'Authorization': 'KakaoAK c5e0e39648e51d59f26c2740459d223e'
    },
  };
  
  function makeUrl(x,y){
    var fullurl=KAPI+"x="+x+"&"+"y="+y+"&"+"input_coord=WGS84&output_coord=WTM";
    return fullurl;
  }
  
 
  function location(){
  console.log(point);
  let TransFormUrl = makeUrl(point.longitude,point.latitude);

  let response = http.getUrl(TransFormUrl, options2);  
  let x=response.documents[0].x;
  let y=response.documents[0].y;

  let GetStationUrl = API+x+"/"+y;
  
  let data = http.getUrl(GetStationUrl,options1);
  
  console.log(data.stationList[0].statnNm);
  
  return data.stationList[0].statnNm;
  }
  
  
  if(startPoint==undefined){
    startPoint=location();
  }
  
  var sorter = function (a, b) {
    return parseInt(a.cost) - parseInt(b.cost);
  }

function findID(station_nm)
{
    var i=0
    var res;
    stationData.forEach(x=>{if(x.station_nm==station_nm){
        res=i;    
    }
        ++i;
    });
    return res;
}

// var makenode = function(n_node,cost,huristic,parent,current_line){
//     this.Node=n_node;
//     this.cost=cost;
//     this.huristic=huristic;
//     this.parent=parent;
//     this.current_line=current_line;

//     return this;
// }

function contain(list,station_nm,line_num)
{
    for (var i in list){
        if(list[i]['Node']==station_nm&&list[i]['current_line']==line_num)
            return i;
    }

    return -1;
}

function extractline(station_nm)
{
    var list=[]
    var idx=0;
    for(var i in stationData){
        if(stationData[i]['station_nm']==station_nm){
            list.push(stationData[idx]['line_num']);
        }
        ++idx;
    }
    return list;
}

function isContainLine(comp1,comp2)
{
    for(var i in comp1){
        for(var j in comp2){
            if(comp2[j]==comp1[i])
                return comp1[i];
        }
    }
    return false;
}


function _remove(list,m)
{
    for(var i in list){
        if(list[i]['Node']==m){
            var a=list.splice(i,1);
            break;
        }
    }
}

function add(node,endpoint,open,close)
{
    for (var key in graphData[node['Node']]){
        //console.log(id++); 디버깅용
        var new_g = node['cost']+graphData[node['Node']][key];
        var temp,list,prev_lineNum,current_lineNum;
        prev_lineNum=extractline(node['Node']);
        current_lineNum=extractline(key);
        var line_number=isContainLine(prev_lineNum,current_lineNum);
        var temp1=contain(open,key,line_number);
        var temp2=contain(close,key,line_number);
        if(temp1!=-1 || temp2!=-1){
            if(temp1!=-1){
                temp=temp1;
                list=open[temp];
            }
            if(temp2!=-1){
                temp=temp2;
                list=close[temp];
            }
            if(list['cost']<=new_g)
                continue;
        }
        if(contain(open,key,line_number)!=-1){
            _remove(open,key);
        }
        if(contain(close,key,line_number)!=-1){
            _remove(close,key);
        }/*
        var huristic= function(){
            //console.log(node['Node'],node['F']); 디버깅용
            if(line_number!=node['current_line']){
                new_g+=10;
            }
            else if(isContainLine(endpoint,extractline(key))){
                ;
            }
            else
                new_g+=4;
            //Math.abs(stationData[findID(endpoint)]['ypoint_wgs']-stationData[findID(key)]['ypoint_wgs'])+Math.abs(stationData[findID(endpoint)]['xpoint_wgs']-stationData[findID(key)]['xpoint_wgs']);
        }();*/
        var parent=node;
       
        var a={'Node':key,'cost':new_g,'parent':parent,'current_line':line_number};
        var open;
        open.push(a);
        open.sort(sorter)
    }
}

function makepath(close_list)
{
    var path=[];
    var transit=[];
    close_list[0]['current_line']=close_list[1]['current_line'];
    var temp = close_list[close_list.length-1];
    while(temp!=-1){
        path.push(temp.Node); //결과값에 이름만 저장
        //path.push(temp);//결과값에 객체 저장
        if(temp.current_line!==temp.parent.current_line){
            if(temp.parent.Node!=undefined)
                transit.push(temp.parent.Node);
        }
        temp=temp.parent;
      console.log(path[path.length-1]);
    }

    return {PATH:path,TRANSIT:transit};
}

function shortestTransfer(start, end){
    var open=[];
    var close=[];

    start_line_num=extractline(start);
    end_line_num=extractline(end);

    open.push({'Node':start,'cost':0,'parent':-1,'current_line':0}); //첫 노드를 open에 집어 넣음.
    var path,transit;
    while(open.length>0){
        var next_node=open[0];
        //console.log(open[0]['Node'],open[0]['current_line'],open[0]['cost']); 디버깅
        close.push(next_node);
        //console.log(close[close.length-1]['Node'],close[close.length-1]['F'],close[close.length-1]['cost']);
        var a = open.splice(0,1);
        if(next_node['Node']==end){
            var result=makepath(close);
            break;
        }
        add(next_node,end_line_num,open,close);
    }

    // for (var i in close){
    //     delete close[i];
    //     console.log(close[i]);
    //   }

  //  console.log(result.PATH.reverse());

    //console.log(result.PATH);
    
//    console.log(result.TRANSIT.reverse());

    /* 결과 값
    result.TRANSIT --> 
    */
  return result.PATH.reverse();
}

  var Graph = (function (undefined) {

    var extractKeys = function (obj) {
      var keys = [],
        key;
      for (key in obj) {
        Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
      }
      return keys;
    }

    var sorter = function (a, b) {
      return parseFloat(a) - parseFloat(b);
    }

    var findPaths = function (map, start, end, infinity) {
      infinity = infinity || Infinity;

      var costs = {},
        open = {
          '0': [start]
        },
        predecessors = {},
        keys;

      var addToOpen = function (cost, vertex) {
        var key = "" + cost;
        if (!open[key]) open[key] = [];
        open[key].push(vertex);
      }

      costs[start] = 0;

      while (open) {
        if (!(keys = extractKeys(open)).length) break;

        keys.sort(sorter);

        var key = keys[0],
          bucket = open[key],
          node = bucket.shift(),
          currentCost = parseFloat(key),
          adjacentNodes = map[node] || {};

        if (!bucket.length) delete open[key];

        for (var vertex in adjacentNodes) {
          if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
            var cost = adjacentNodes[vertex],
              totalCost = cost + currentCost,
              vertexCost = costs[vertex];

            if ((vertexCost === undefined) || (vertexCost > totalCost)) {
              costs[vertex] = totalCost;
              addToOpen(totalCost, vertex);
              predecessors[vertex] = node;
            }
          }
        }
      }

      if (costs[end] === undefined) {
        return null;
      } else {
        return predecessors;
      }

    }

    var extractShortest = function (predecessors, end) {
      var nodes = [],
        u = end;

      while (u !== undefined) {
        nodes.push(u);
        u = predecessors[u];
      }

      nodes.reverse();
      return nodes;
    }

    var findShortestPath = function (map, nodes) {
      var start = nodes.shift(),
        end,
        predecessors,
        path = [],
        shortest;

      while (nodes.length) {
        end = nodes.shift();
        predecessors = findPaths(map, start, end);

        if (predecessors) {
          shortest = extractShortest(predecessors, end);
          if (nodes.length) {
            path.push.apply(path, shortest.slice(0, -1));
          } else {
            return path.concat(shortest);
          }
        } else {
          return null;
        }

        start = end;
      }
    }

    var toArray = function (list, offset) {
      try {
        return Array.prototype.slice.call(list, offset);
      } catch (e) {
        var a = [];
        for (var i = offset || 0, l = list.length; i < l; ++i) {
          a.push(list[i]);
        }
        return a;
      }
    }

    var Graph = function (map) {
      this.map = map;
    }

    Graph.prototype.findShortestPath = function (start, end) {
      if (Object.prototype.toString.call(start) === '[object Array]') {
        return findShortestPath(this.map, start);
      } else if (arguments.length === 2) {
        return findShortestPath(this.map, [start, end]);
      } else {
        return findShortestPath(this.map, toArray(arguments));
      }
    }

    Graph.findShortestPath = function (map, start, end) {
      if (Object.prototype.toString.call(start) === '[object Array]') {
        return findShortestPath(map, start);
      } else if (arguments.length === 3) {
        return findShortestPath(map, [start, end]);
      } else {
        return findShortestPath(map, toArray(arguments, 1));
      }
    }

    return Graph;

  })();

  function matchLineBeforeNext(beforeStation, nowStation, nextStation) {
    var beforeLine = new Array;
    var nowLine = new Array;
    var nextLine = new Array;
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == beforeStation)
        beforeLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nowStation)
        nowLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nextStation)
        nextLine.push(stationData[i].line_num);
    }

    for (let i = 0; i < beforeLine.length; i++) {
      for (let j = 0; j < nowLine.length; j++) {
        for (let k = 0; k < nextLine.length; k++) {
          if (beforeLine[i] == nowLine[j] && nowLine[j] == nextLine[k]) {
            return beforeLine[i];
          }
        }
      }
    }
    return false;
  }

  function matchLineBefore(beforeStation, nowStation) {
    var beforeLine = new Array;
    var nowLine = new Array;
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == beforeStation)
        beforeLine.push(stationData[i].line_num);
      if (stationData[i].station_nm == nowStation)
        nowLine.push(stationData[i].line_num);
    }

    for (let i = 0; i < beforeLine.length; i++) {
      for (let j = 0; j < nowLine.length; j++) {
        if (beforeLine[i] == nowLine[j])
          return beforeLine[i];
      }
    }
    return false;
  }

  function splitPath(path) {
    var cpath = path;
    var splitPath = new Array();
    var resultPath = new Array();

    var splitLine = new Array();
    var resultLine = new Array();

    end:
      while (1) {
        for (let i = 0; i <= cpath.length; i++) {
          if (i == cpath.length) {
            resultPath.push(cpath);
            resultLine.push(splitLine);
            break end;
          }
          if (i == 0) {
            sameB = matchLineBefore(cpath[i], cpath[i + 1]);
            if (cpath.length == 2) {
             /* if (
                (cpath[0] == '김포공항' && cpath[1] == '마곡나루')
                  || (cpath[0] == '마곡나루' && cpath[1] == '김포공항'))
                splitLine.push('A');
              else */
                splitLine.push(sameB);
            }
            else {
              same = matchLineBeforeNext(cpath[i], cpath[i + 1], cpath[i + 2]);
              if (same)
                splitLine.push(same);
              else {
                splitLine.push(sameB);
              }
            }
          } else if (i == cpath.length - 1) {
              splitLine.push(splitLine[i - 1]);
          } else {
            same = matchLineBeforeNext(cpath[i - 1], cpath[i], cpath[i + 1]);
            if (same) {
              if ((same != splitLine[i - 1] && splitLine[i-1] == 'K')) {
                 splitLine.push(splitLine[i - 1]);
              }
              else if (same != splitLine[i - 1]        
                  || (cpath[0] == '광명' && cpath[i] == '영등포')
                  
                  || (cpath[i - 1] == '구일' && cpath[i + 1] == '가산디지털단지')
                  || (cpath[i - 1] == '가산디지털단지' && cpath[i + 1] == '구일')
                  
                  || (cpath[i - 1] == '광명' && cpath[i + 1] == '석수')
                  || (cpath[i - 1] == '석수' && cpath[i + 1] == '광명')
                  
                  || (cpath[i - 1] == '서동탄' && cpath[i + 1] == '세류')
                  || (cpath[i - 1] == '세류' && cpath[i + 1] == '서동탄')
                  
                  || (cpath[i - 1] == '문래' && cpath[i + 1] == '도림천')
                  || (cpath[i - 1] == '도림천' && cpath[i + 1] == '문래')
                  
                  || (cpath[i - 1] == '길동' && cpath[i + 1] == '둔촌동')
                  || (cpath[i - 1] == '둔촌동' && cpath[i + 1] == '길동')
                  
                  || (cpath[i - 1] == '용답' && cpath[i + 1] == '뚝섬')
                  || (cpath[i - 1] == '뚝섬' && cpath[i + 1] == '용답')
                  
                  || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '신내')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '갈매')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '별내')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '퇴계원')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '사릉')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '금곡')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '평내호평')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '천마산')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '마석')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '대성리')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '청평')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '상천')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '가평')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '굴봉산')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '백양리')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '강촌')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '김유정')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '남춘천')
                       || (cpath[i - 1] == '왕십리' && cpath[cpath.length-1] == '춘천')
                  
                 ){
                splitPath = cpath.slice(0, i + 1);
                cpath = cpath.slice(i, cpath.length + 1);
                if (i == 1) {
                  splitLine.push(splitLine[0]);
                } 
                else {
                  splitLine.push(splitLine[i - 1]);
                }
                resultPath.push(splitPath);
                resultLine.push(splitLine);
                splitPath = [];
                splitLine = [];
                break;
              }
              splitLine.push(splitLine[i - 1]);
            } 
            else {
              splitPath = cpath.slice(0, i + 1);
              cpath = cpath.slice(i, cpath.length + 1);
              splitLine.push(splitLine[i - 1]);
              resultPath.push(splitPath);
              resultLine.push(splitLine);
              splitPath = [];
              splitLine = [];
              break;
            }
          }
        }
      }
    return {
      resultPath: resultPath,
      resultLine: resultLine
    };
  }

  var plusTime = typeof (wishTime) === 'undefined' ? 0 : wishTime;
  var date = new Date();
  var utcTime = Number(date.getHours()) * 60 + Number(date.getMinutes()) + plusTime - 500;
  if (utcTime + 540 > 1740)
    var nowMinTime = (utcTime + 540) % 1440;
  else
    var nowMinTime = (utcTime + 540);

  function changeTime(time) {
    var minTime = Number(time.substr(0, 2)) * 60 + Number(time.substr(3, 2));
    return minTime;
  }

  function minusTime(time) {
    time -= 1;
    var hour = Math.floor(time / 60);
    var min = time % 60;
    var res = '';
    if (min < 10) {
      res = hour + ':0' + min;
    } else
      res = hour + ':' + min;

    return res;
  }

  function noMinusTime(time) {
    var hour = Math.floor(time / 60);
    var min = time % 60;
    var res = '';
    if (min < 10) {
      res = hour + ':0' + min;
    } else
      res = hour + ':' + min;

    return res;
  }

  function noSecond(time) {
    return time.substr(0, 5);
  }

  function matchStation(station, line) {
    for (let i = 0; i < stationData.length; i++) {
      if (stationData[i].station_nm == station && stationData[i].line_num == line)
        return stationData[i].station_cd;
    }
    return null;
  }

  function matchLine(engLine, korLine) {
    switch (engLine) {
      case '1':
        if (korLine == '01호선') return true;
        else return false;
      case '2':
        if (korLine == '02호선') return true;
        else return false;
      case '3':
        if (korLine == '03호선') return true;
        else return false;
      case '4':
        if (korLine == '04호선') return true;
        else return false;
      case '5':
        if (korLine == '05호선') return true;
        else return false;
      case '6':
        if (korLine == '06호선') return true;
        else return false;
      case '7':
        if (korLine == '07호선') return true;
        else return false;
      case '8':
        if (korLine == '08호선') return true;
        else return false;
      case '9':
        if (korLine == '09호선') return true;
        else return false;
      case 'A':
        if (korLine == '공항철도') return true;
        else return false;
      case 'B':
        if (korLine == '분당선') return true;
        else return false;
      case 'E':
        if (korLine == '용인경전철') return true;
        else return false;
      case 'G':
        if (korLine == '경춘선') return true;
        else return false;
      case 'I':
        if (korLine == '인천선') return true;
        else return false;
      case 'I2':
        if (korLine == '인천2호선') return true;
        else return false;
      case 'K':
        if (korLine == '경의선') return true;
        else return false;
      case 'KK':
        if (korLine == '경강선') return true;
        else return false;
      case 'S':
        if (korLine == '신분당선') return true;
        else return false;
      case 'SU':
        if (korLine == '수인선') return true;
        else return false;
      case 'U':
        if (korLine == '의정부경전철') return true;
        else return false;
      case 'UI':
        if (korLine == '우이신설경전철') return true;
        else return false;
      case 'M':
        if (korLine == '서해') return true;
        else return false;
    }
  }

  function changeLineName(line) {
    var res = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];
    for (let i = 0; i < line.length; i++) {
      for (let j = 0; j < line[i].length; j++) {
        switch (line[i][j]) {
          case '1':
            res[i][j] = '1호선';
            break;
          case '2':
            res[i][j] = '2호선';
            break;
          case '3':
            res[i][j] = '3호선';
            break;
          case '4':
            res[i][j] = '4호선';
            break;
          case '5':
            res[i][j] = '5호선';
            break;
          case '6':
            res[i][j] = '6호선';
            break;
          case '7':
            res[i][j] = '7호선';
            break;
          case '8':
            res[i][j] = '8호선';
            break;
          case '9':
            res[i][j] = '9호선';
            break;
          case 'A':
            res[i][j] = '공항철도';
            break;
          case 'B':
            res[i][j] = '분당선';
            break;
          case 'E':
            res[i][j] = '용인경전철';
            break;
          case 'G':
            res[i][j] = '경춘선';
            break;
          case 'I':
            res[i][j] = '인천1호선';
            break;
          case 'I2':
            res[i][j] = '인천2호선';
            break;
          case 'K':
            res[i][j] = '경의선';
            break;
          case 'KK':
            res[i][j] = '경강선';
            break;
          case 'S':
            res[i][j] = '신분당선';
            break;
          case 'SU':
            res[i][j] = '수인선';
            break;
          case 'U':
            res[i][j] = '의정부경전철';
            break;
          case 'UI':
            res[i][j] = '우이신설경전철';
        }
      }
    }
    return res;
  }

  function getStationTime(index, j, arrow, nowMinTime, line) {
    
    for (let i = index == 0 ? 0 : index+1; i < timeSchedule[0][arrow - 1].length; i++) {
      var arriveTime = changeTime(timeSchedule[0][arrow - 1][i].ARRIVETIME);
      var leftTime = changeTime(timeSchedule[0][arrow - 1][i].LEFTTIME);
      var apiLine = timeSchedule[0][arrow - 1][i].LINE_NUM;
      var fastLine = timeSchedule[0][arrow - 1][i].EXPRESS_YN;

      if (leftTime > nowMinTime && matchLine(line, apiLine) && leftTime != 0) {
        let resultTime = timeSchedule[0][arrow - 1][i].LEFTTIME;
        let resultTrain = timeSchedule[0][arrow - 1][i].TRAIN_NO;
        return {
          resultTime: resultTime,
          resultTrain: resultTrain,
          fastLine: fastLine,
          idx: i
        };
      } 
    }
    return false;
  }

  function findSameTrain(j, arrow, time, train) {

    for (let i = 0; i < timeSchedule[1][arrow - 1].length; i++) {
      var arriveTime = changeTime(timeSchedule[1][arrow - 1][i].ARRIVETIME);
      if (arriveTime > time && timeSchedule[1][arrow - 1][i].TRAIN_NO == train && arriveTime != 0) {
        resultTime = timeSchedule[1][arrow - 1][i].ARRIVETIME;
        return resultTime;
      }
    }
    return false;
  }

  function setDay(day) {
    if (utcTime + 540 >= 1440) {
      if (day == 6)
        day = 0;
      else
        day = day + 1;
    }
    return day;
  }

  function nowDay(day) {
    switch (day) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return '1';
      case 6:
        return '2';
      case 0:
        return '3';
    }
  }

  function getResultTime(line, times, j, beforeTime, resFastLine, _nowMinTime) {
    var res = times;
    var index1 = 0;
    var index2 = 0;
    while (1) {
      for (let i = 1; i < 3; i++) {
        var startTime = getStationTime(i == 1 ? index1 : index2, j, i, (j == 0) ? _nowMinTime : changeTime(beforeTime), line);
        console.log(startTime.idx);
        console.log(startTime);
        if (startTime == false) continue;
        if (i == 1) index1 = startTime.idx;
        else index2 = startTime.idx;
        var endTime = findSameTrain(j, i, changeTime(startTime.resultTime), startTime.resultTrain);
        if (endTime != false) {
          res[j].push(startTime.resultTime);
          res[j].push(endTime);
          resFastLine[j].push(startTime.fastLine);
          return {
            res: res,
            resFastLine: resFastLine
          };
        };
      }
    }
  }

  function getStationInfo(station, day, arrow) {

    let url = baseURL + api + '/json/' + service + '/1/800/' + station + '/' + day + '/' + arrow + '/';
    const json = http.getUrl(url, {
      format: "json",
      cacheTime: 0,
      returnHeaders: true
    });
    const timeSchedule = json.parsed.SearchSTNTimeTableByIDService.row;

    return timeSchedule;
  }
  
  
  function findStationName(num) {
    for (let i = 0; i < stationData.length; i++) {
      if (num == stationData[i].num) {
        return stationData[i].station_nm;
      }
    }
  }
  
  function findStationNum(name) {
    for (let i = 0; i < stationData.length; i++) {
      if (name == stationData[i].station_nm) {
        return stationData[i].num;
      }
    }
  }

  function splitTime(path) {
    let resultPath = splitPath(path).resultPath;
    let resultLine = splitPath(path).resultLine;
    var result;
    var times = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];
    var resFastLine = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    
    for (let i = 0; i < resultLine.length; i++) {
      var startStationCode = matchStation(resultPath[i][0], resultLine[i][0]);
      var endStationCode = matchStation(resultPath[i][resultPath[i].length - 1], resultLine[i][resultLine[i].length - 1]);
      for (let a = 0; a <= 1; a++) {
        timeSchedule[0][a] = getStationInfo(startStationCode, nowDay(setDay(date.getDay())), a + 1);
        timeSchedule[1][a] = getStationInfo(endStationCode, nowDay(setDay(date.getDay())), a + 1);
      }
      var beforeTime;
      if (i == 0)
        beforeTime = false;
      else
        beforeTime = times[i - 1][1];

      var result = getResultTime(resultLine[i][0], times, i, beforeTime, resFastLine, nowMinTime);
      timeSchedule = [[{}, {}],[{}, {}]];
    }
    console.log(result, 'timetime');
    let totalTime = changeTime(times[resultLine.length - 1][1]) - changeTime(times[0][0]);
    //  setTimeout(() => {console.log(result)}, 2000);
    return {
      result: result,
      totalTime: totalTime
    };
  }

  var timeSchedule = [
    [{}, {}],
    [{}, {}]
  ];
  
  let Start = String(startPoint.replace(/(\s*)/g,""));
  let End = String(endPoint.replace(/(\s*)/g,""));
  let StartNum = findStationNum(Start);
  let EndNum = findStationNum(End);
  
  const pathData = require("./pathData/" + StartNum + ".js");

  let pathNum = pathData[EndNum];
  let path = [];
  
  for (let i = 0; i < pathNum.length; i++) {
    path[i] = findStationName(pathNum[i]);
  }
  
//  var graph = new Graph(graphData);
//  let path = graph.findShortestPath(String(startPoint.replace(/(\s*)/g,"")), String(endPoint.replace(/(\s*)/g,"")));

//  let path = shortestTransfer(Start, End);
  console.log(path, 'path 끝');
  let res = splitPath(path);
  let split = res.resultPath;
  let split2 = split;
  console.log(split2);
  let engline = res.resultLine;
  console.log(engline);
  console.log('asdf');
  let korLine = changeLineName(engline);
  console.log(korLine);
  let setTime = splitTime(path);
  let time = setTime.result.res;
  console.log(time, 'fsadfasdf');
  let fastLine = setTime.result.resFastLine;
  let totalTime = setTime.totalTime;

  var result = [];

  for (let i = 0; i < split2.length; i++) {
    var result_in = {};
    result_in['imgLine'] = engline[i][0];
    result_in['line'] = korLine[i][0];
    result_in['startTime'] = noSecond(minusTime(changeTime(time[i][0])));
    result_in['path'] = split2[i];
    result_in['endTime'] = noSecond(noMinusTime(changeTime(time[i][1])));
    if (fastLine[i][0] == 'G') {
      result_in['startStation'] = split2[i][0];
      result_in['endStation'] = split2[i][split2[i].length - 1];
    } else {
      result_in['startStation'] = split2[i][0] + '(급)';
      result_in['endStation'] = split2[i][split2[i].length - 1] + '(급)';
    }
    result_in['totalTime'] = totalTime + 1;
    result_in['limitTime'] = changeTime(time[0][0]) - nowMinTime + plusTime - 1;
    console.log(nowMinTime - changeTime(time[0][0]));
    result.push(result_in);
  }
  return result;
}