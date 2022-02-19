import React, { Component } from 'react';
import { Easing, Animated, Alert } from 'react-native';
import { StackNavigator } from 'react-navigation'
import {createMaterialTopTabNavigator} from 'react-navigation-tabs'
import { NavigationContainer } from '@react-navigation/native';
import { NavigationContext } from '@react-navigation/native';
import { createStackNavigator } from 'react-navigation-stack';
import { createAppContainer } from 'react-navigation';
import HomeScreen from './screens/home';
import SettingsScreen from './screens/settings';
import SolvesScreen from './screens/solves';
import TestScreen from './screens/test'
import AsyncStorage  from "@react-native-async-storage/async-storage";

import { Provider } from 'react-redux'
import { createStore, applyMiddleware, combineReducers } from 'redux'
import thunk from 'redux-thunk'
import themeReducer from './redux/themeReducer'
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { MyContext } from "./context";



const store = createStore(
  combineReducers({ themeReducer}),
  applyMiddleware(thunk)
)

const SwipeTabs = createMaterialTopTabNavigator(
  {
    SettingsScreen: {
      screen: SettingsScreen
    },
    HomeScreen: {
      screen: HomeScreen,
        navigationOptions: {},
    },
    SolvesScreen: {
      screen: SolvesScreen
    },
    TestScreen: {
      screen: TestScreen
    },
  },
  {
    initialRouteName: "HomeScreen",
    animationEnabled: true,
    tabBarOptions: {
      showLabel: false,
      showIcon: false,
      style: { height: 0 }
    }
  }
);


const NavigationApp = createAppContainer(SwipeTabs);

export default class App extends Component {

  constructor (props){
    super(props);

    this.state = {
        test: 'test',
        solves: [],
        solvesCount: 0,

        currentSolve: '-',
        mo3: '-',
        ao5: '-',
        ao12: '-',
        ao100: '-',

        bestSolve: '-',
        bestMo3: '-',
        bestAo5: '-',
        bestAo12: '-',
        bestAo100: '-',

        selectedCube: '',

        inspection: false,
    };
  }

  componentDidMount = async() => {
    activateKeepAwake(); 
    this.getFirstSession();
    this.getSolves();
    this.displayAverages();
  }

  addDummySolves = async() => {
    //for testing only!!!
    var solves = [];
    for (let index = 0; index < 500; index++) {
      var random = (Math.random() * (20 - 0)).toFixed(2)
      var solve = {time: random, timeInSeconds:random, scramble: 'dummyScramble', date: 'dummyDate', mo3: random, mo3InSeconds:random, ao5: random, ao5InSeconds: random, ao12: random,ao12InSeconds: random, ao100: random,ao100InSeconds: random, cubeType: '3x3'};
      solves.push(solve);
    }
    var solvesToSave = {solves: solves};
    await AsyncStorage.setItem("solves", JSON.stringify(solvesToSave));
  }

  getFirstSession = async() => {
    var sessions = await AsyncStorage.getItem('sessions')
    if(sessions == null){
      this.setState({selectedCube: '3x3'});
    }
    else{
      sessions = JSON.parse(sessions);
      sessions = sessions['sessions'];
      this.setState({selectedCube: sessions[0]['name']});
    }
  }

  getSolves = async() => {
    var solves = await AsyncStorage.getItem('solves');
    if (solves != null){
      solves = JSON.parse(solves);
      solves = solves['solves'];

      //solves Filter
      
      var solvesFilter = await AsyncStorage.getItem('filterItem');
      if (solvesFilter == 'time')
      {
        solves = solves.sort((a, b) => parseFloat(a.timeInSeconds) - parseFloat(b.timeInSeconds))
        solves.reverse();
      }

      //filter solves with cube type
      var cubeType = this.state.selectedCube;
      var filteredArray = []

      solves.forEach(solve => {
          if (solve['cubeType'] == cubeType){filteredArray.push(solve)}
      });

      var solvesCount = filteredArray.length;

      filteredArray.reverse();
      this.setState({solves: filteredArray, solvesCount: solvesCount});
    }
  }

  setSolves = (solves) => {
    this.setState({solves: solves})
  }

  setSolvesCount = (count) => {
    this.setState({solvesCount: count})
  }

  setSelectedCube = (cubeType) => {
    this.setState({selectedCube: cubeType})
  }

  setInspection = (inspection) => {
    this.setState({inspection: inspection})
  }


  secToMin = (seconds) =>{
    var result = '';
    if(seconds > 60){
        var minutes =  seconds / 60;
        var minutesOnly = Math.floor(minutes);
        var seconds = ((minutes % 1) * 60).toFixed(2);
        if(seconds < 10){result = `${minutesOnly}:0${seconds}`}
        else{result = `${minutesOnly}:${seconds}`}
    }
    else{
        result = seconds
    }
    
    return result;
  }

  displayAverages = async () => {
        
    //get averages
    var solves = await AsyncStorage.getItem("solves");
    if (solves != null)
    {
    solves = JSON.parse(solves);
    solves = solves['solves'];

    //filter solves with cube type
    var filteredArray = []
    solves.forEach(solve => {
        if (solve['cubeType'] == this.state.selectedCube){filteredArray.push(solve)}
    });
    solves = filteredArray;

    if (solves.length > 0){
        solves.reverse();
        var lastSolve = solves[0];
        var lastSolveTime = lastSolve['time'];
        if(lastSolve['isPlus2'] == true){lastSolveTime = (Number(lastSolveTime) +2).toFixed(2);}
        else{if(lastSolve['isDNF'] == true){lastSolveTime = 'DNF'}}
        this.setState({currentSolve: lastSolveTime, mo3: lastSolve['mo3'], ao5: lastSolve['ao5'], ao12: lastSolve['ao12'], ao100: lastSolve['ao100']})
    

        //get best averages
        var times = [];
        var mo3s = [];
        var ao5s = [];
        var ao12s = [];
        var ao100s = [];

        var minMo3 = '-';
        var minAo5 = '-';
        var minAo12 = '-';
        var minAo100 = '-';

        solves.forEach(element => {
            if(element['isPlus2'] == true){times.push(Number(element['timeInSeconds']) + 2);}
            else{if(element['isDNF'] != true){times.push(Number(element['timeInSeconds']));}}
            if (solves.length >= 3)
            {
              if (Number(element['mo3InSeconds']) != 0 && element['mo3'] != 'DNF'){
                mo3s.push(Number(element['mo3InSeconds']));
              } 
            }
            if (solves.length >= 5)
            {
              if (!Number(element['ao5InSeconds']) == 0 && element['ao5'] != 'DNF'){
                  ao5s.push(Number(element['ao5InSeconds']));
              } 
            }
            
            if (solves.length >= 12)
            {
              if (! Number(element['ao12InSeconds']) == 0 && element['ao12'] != 'DNF'){
                  ao12s.push(Number(element['ao12InSeconds']));
              } 
            }

            if (solves.length >= 100)
            {
              if (! Number(element['ao100InSeconds']) == 0 && element['ao100'] != 'DNF'){
                  ao100s.push(Number(element['ao100InSeconds']));
              }
            }
            
            
        });
        var minTime = Math.min(...times).toFixed(2);
        if(minTime>60){minTime = this.secToMin(minTime)}

        if(times.length == 0){minTime = 'DNF'}

        if (solves.length >= 3)
        {
          if(mo3s.length == 0){
            minMo3 = 'DNF'
          }
          else {
            minMo3 =  Math.min(...mo3s).toFixed(2);
            if(minMo3>60){minMo3 = this.secToMin(minMo3)}
          }

          if (solves.length >= 5)
          {
            if(ao5s.length == 0){
              minAo5 = 'DNF'
            }
            else {
              minAo5 =  Math.min(...ao5s).toFixed(2);
              if(minAo5>60){minAo5 = this.secToMin(minAo5)}
            }

            if (solves.length >= 12)
            {
              if(ao12s.length == 0){
                minAo12 = 'DNF'
              }
              else {
                minAo12 = Math.min(...ao12s).toFixed(2);
                if(minAo12>60){minAo12 = this.secToMin(minAo12)}
              }
            }

            if (solves.length >= 100)
              {
                if(ao100s.length == 0){
                  minAo100 = 'DNF'
                }
                else {
                  minAo100 = Math.min(...ao100s).toFixed(2);
                  if(minAo100>60){minAo100 = this.secToMin(minAo100)}
                }
              }
          }
        }

        this.setState({bestSolve: minTime, bestMo3: minMo3, bestAo5: minAo5, bestAo12: minAo12, bestAo100: minAo100})
    }
    else{this.setState({currentSolve: '-', mo3: '-', ao5: '-', ao12: '-', ao100: '-', bestSolve: '-', bestMo3: '-', bestAo5: '-', bestAo12: '-', bestAo100: '-'})}
    }
  }

  calculateAverages = async (solve) => {                       
    var solves = await AsyncStorage.getItem("solves");
    solves = JSON.parse(solves);
    solves = solves['solves'];

    //filter solves with cube type
    var filteredArray = []
    solves.forEach(solve => {                                       
        if (solve['cubeType'] == this.state.selectedCube){filteredArray.push(solve)}
    });
    solves = filteredArray;

    solves.reverse();

    if(solve['isPlus2'] || solve['isDNF'] || solve['alreadyAdded']){solves.shift()}

    if(solves.length >= 2)
    {
        //calculate mo3
        var sum = 0;
        var values = [];
        var isDNF = false;
        for (var i = 0; i < 2; i++){
            var currentSolve = solves[i];
            sum = sum + parseFloat(currentSolve['timeInSeconds']);
            if(currentSolve['isPlus2'] == true){sum = sum + 2}
            else{if(currentSolve['isDNF']){isDNF = true}}
        }
        sum = sum + parseFloat(solve['timeInSeconds']);
        if(solve['isPlus2'] == true){sum = sum + 2}
        else{if(solve['isDNF']){isDNF = true}}
        var mo3 = sum / 3;
        mo3 = Number(mo3).toFixed(2);
        solve['mo3InSeconds'] = mo3;
        if(mo3 > 60){mo3 = this.secToMin(mo3)};

        if(isDNF){
            solve['mo3'] = 'DNF'
        }
        else{
            solve['mo3'] = mo3;
        }

        if (solves.length >= 4)
        {
            //calculate ao5
            var sum = 0;
            var values = [];
            var isDNF = false;
            var DNFCounter = 0;
            for (var i = 0; i < 4; i++){
                var currentSolve = solves[i];
                if(currentSolve['isPlus2'] == true){values.push(2)}
                else{
                    if(currentSolve['isDNF']){
                        DNFCounter = DNFCounter + 1; if(DNFCounter >= 2){isDNF = true}
                    }
                    else{
                        values.push(parseFloat(currentSolve['timeInSeconds']));
                    }}
            }
            values.push(solve['isPlus2']? parseFloat(solve['timeInSeconds']) + 2 : parseFloat(solve['timeInSeconds']));
            if(solve['isDNF']){DNFCounter = DNFCounter + 1; if(DNFCounter >= 2){isDNF = true}}

            var max = Math.max(...values);
            var min = Math.min(...values);

            values.forEach(element =>{
                sum = sum + element;
            });
            if(DNFCounter == 1){sum = sum - min;}
            else{sum = sum - max - min;}
            
            var ao5 = sum / 3;
            ao5 = ao5.toFixed(2);
            solve['ao5InSeconds'] = ao5;
            if(ao5>60){ao5 = this.secToMin(ao5)}

            if(isDNF){
                solve['ao5'] = 'DNF'
            }
            else{
                solve['ao5'] = ao5;
            }

            if(solves.length >= 11)
            {
                //calculate ao12
                var sum = 0;
                var values = [];
                var isDNF = false;
                var DNFCounter = 0;
                for (var i = 0; i < 11; i++){
                    var currentSolve = solves[i];
                    if(currentSolve['isPlus2'] == true){values.push(2)}
                    else{if(currentSolve['isDNF']){DNFCounter = DNFCounter + 1; if(DNFCounter >= 2){isDNF = true}}else{values.push(parseFloat(currentSolve['timeInSeconds']));}}
                }
                values.push(solve['isPlus2']? parseFloat(solve['timeInSeconds']) + 2 : parseFloat(solve['timeInSeconds']));
                if(solve['isDNF']){DNFCounter = DNFCounter + 1; if(DNFCounter >= 2){isDNF = true}}

                var max = Math.max(...values);
                var min = Math.min(...values);

                values.forEach(element =>{
                    sum = sum + element;
                });
                if(DNFCounter == 1){sum = sum - min;}
                else{sum = sum - max - min;}

                var ao12 = sum / 10;
                ao12 = ao12.toFixed(2);
                solve['ao12InSeconds'] = ao12;
                if(ao12>60){ao12 = this.secToMin(ao12)}
                
                if(isDNF){
                    solve['ao12'] = 'DNF'
                }
                else{
                    solve['ao12'] = ao12;
                }

                if(solves.length >= 99)
                {
                    //calculate ao100
                    var sum = 0;
                    var values = [];
                    var isDNF = false;
                    var DNFCounter = 0;
                    for (var i = 0; i < 99; i++){
                        var currentSolve = solves[i];
                        if(currentSolve['isPlus2'] == true){values.push(2)}
                        else{if(currentSolve['isDNF']){DNFCounter = DNFCounter + 1; if(DNFCounter >= 6){isDNF = true}}else{values.push(parseFloat(currentSolve['timeInSeconds']));}}
                    }
                    values.push(solve['isPlus2']? parseFloat(solve['timeInSeconds']) + 2 : parseFloat(solve['timeInSeconds']));
                    if(solve['isDNF']){DNFCounter = DNFCounter + 1; if(DNFCounter >= 6){isDNF = true}}

                    values.sort(function(a, b) {
                        return a - b;
                    });
                    values.splice(0,5);
                    values.reverse();
                    values.splice(0,(5 - DNFCounter));

                    values.forEach(element =>{
                        sum = sum + element;
                    });

                    var ao100 = sum / 90;
                    ao100 = ao100.toFixed(2);
                    solve['ao100InSeconds'] = ao100;
                    if(ao100>60){ao100 = this.secToMin(ao100)}
                    
                    if(isDNF){
                        solve['ao100'] = 'DNF'
                    }
                    else{
                        solve['ao100'] = ao100;
                    }
                }
            }
        }
    }


    return solve;
}


  
  render(){
    return(
      <MyContext.Provider value={{...this.state, setSolves: this.setSolves, getSolves: this.getSolves, setSolvesCount: this.setSolvesCount, displayAverages: this.displayAverages, calculateAverages: this.calculateAverages, setSelectedCube: this.setSelectedCube, setInspection: this.setInspection}}>
        <Provider store={store}>
          <NavigationApp/>
        </Provider>
      </MyContext.Provider>
    ) 
  }
}
