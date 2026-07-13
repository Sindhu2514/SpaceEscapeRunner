import React,{useState,useRef,useEffect} from "react";
import {View,Text,StyleSheet,ImageBackground,Image,Pressable,Dimensions} from "react-native";

const {width,height}=Dimensions.get("window");

const ROCKET_WIDTH=75;
const ROCKET_HEIGHT=90;
const MOVE_STEP=8;
const ASTEROID_SIZE=60;
const ASTEROID_SPEED=5;

type Asteroid={
x:number;
y:number;
};

export default function HomeScreen(){

const createAsteroid=()=>{
return{
x:Math.random()*(width-ASTEROID_SIZE),
y:-ASTEROID_SIZE,
};
};

const [rocketX,setRocketX]=useState((width-ROCKET_WIDTH)/2);
const [asteroids,setAsteroids]=useState<Asteroid[]>([
createAsteroid(),
{x:Math.random()*(width-ASTEROID_SIZE),y:-300},
{x:Math.random()*(width-ASTEROID_SIZE),y:-600},
]);
const [score,setScore]=useState(0);
const [bestScore,setBestScore]=useState(0);
const [gameOver,setGameOver]=useState(false);
const [gameStarted,setGameStarted]=useState(false);


const [exploding,setExploding]=useState(false);
const moveDirection=useRef<"left"|"right"|null>(null);
const gameOverRef=useRef(false);
const collisionRef=useRef(false);

const stopMoving=()=>{
moveDirection.current=null;
};

const startMovingLeft=()=>{
if(!gameOver){
moveDirection.current="left";
}
};

const startMovingRight=()=>{
if(!gameOver){
moveDirection.current="right";
}
};

const resetGame=()=>{
gameOverRef.current=false;
collisionRef.current=false;
setRocketX((width-ROCKET_WIDTH)/2);
setAsteroids([
{x:Math.random()*(width-ASTEROID_SIZE),y:-ASTEROID_SIZE},
{x:Math.random()*(width-ASTEROID_SIZE),y:-300},
{x:Math.random()*(width-ASTEROID_SIZE),y:-600},
]);
setScore(0);
setGameOver(false);
setGameStarted(false);
moveDirection.current=null;
};

useEffect(()=>{
const movement=setInterval(()=>{
if(gameOverRef.current)return;
if(moveDirection.current==="left"){
setRocketX(prev=>Math.max(prev-MOVE_STEP,-20));
}
if(moveDirection.current==="right"){
setRocketX(prev=>Math.min(prev+MOVE_STEP,width-ROCKET_WIDTH+20));
}
},16);
return()=>clearInterval(movement);
},[]);

useEffect(()=>{
const asteroidMovement=setInterval(()=>{
if(gameOverRef.current||!gameStarted)return;
setAsteroids(prev=>
prev.map((asteroid)=>{
let newY=asteroid.y+ASTEROID_SPEED;
if(newY>height){
setScore(old=>old+1);
return{
x:Math.random()*(width-ASTEROID_SIZE),
y:-ASTEROID_SIZE-Math.random()*300,
};
}
return{
x:asteroid.x,
y:newY,
};
})
);
},16);
return()=>clearInterval(asteroidMovement);
},[gameStarted,gameOver]);

useEffect(()=>{
const collisionCheck=setInterval(()=>{
if(gameOver)return;

const rocketLeft=rocketX+10;
const rocketRight=rocketX+ROCKET_WIDTH-10;
const rocketTop=height-75-ROCKET_HEIGHT+15;
const rocketBottom=height-75-10;

asteroids.forEach((asteroid)=>{
const asteroidLeft=asteroid.x+5;
const asteroidRight=asteroid.x+ASTEROID_SIZE-5;
const asteroidTop=asteroid.y+5;
const asteroidBottom=asteroid.y+ASTEROID_SIZE-5;

if(
!collisionRef.current &&
rocketLeft<asteroidRight &&
rocketRight>asteroidLeft &&
rocketTop<asteroidBottom &&
rocketBottom>asteroidTop
){
gameOverRef.current=true;
collisionRef.current=true;
setExploding(true);

setTimeout(()=>{
setExploding(false);
setGameOver(true);
},1500);
setBestScore(prev=>Math.max(prev,score));
moveDirection.current=null;
}
});

},16);

return()=>clearInterval(collisionCheck);
},[rocketX,asteroids,gameOver,score]);

return(
<View style={styles.container}>
  {!gameStarted&&(
<View style={styles.startContainer}>
<Text style={styles.startTitle}>SPACE ESCAPE</Text>
<Pressable style={styles.startButton} onPress={()=>{
setGameStarted(true);
}}>
<Text style={styles.startText}>START GAME</Text>
</Pressable>
</View>
)}
<View style={styles.scoreContainer}>
<Text style={styles.score}>Score: {score}</Text>
<Text style={styles.bestScore}>Best: {bestScore}</Text>
</View>
<ImageBackground source={require("../../assets/images/space-bg.jpg")} style={styles.space} resizeMode="cover">

{asteroids.map((asteroid,index)=>(
<Image
key={index}
source={require("../../assets/images/asteroid.png")}
style={[
styles.asteroid,
{
top:asteroid.y,
left:asteroid.x,
},
]}
resizeMode="contain"
/>
))}

{exploding?(
<Image
source={require("../../assets/images/explosion.png")}
style={[styles.explosion,{left:rocketX}]}
resizeMode="contain"
/>
):(
<Image
source={require("../../assets/images/rocket.png")}
style={[styles.rocket,{left:rocketX}]}
resizeMode="contain"
/>
)}

{gameOver&&(
<View style={styles.gameOverContainer}>
<Text style={styles.gameOverText}>GAME OVER</Text>

<Text style={styles.finalScoreText}>
Final Score: {score}
</Text>

<Pressable style={styles.restartButton} onPress={resetGame}>
<Text style={styles.restartText}>RESTART</Text>
</Pressable>

</View>
)}

</ImageBackground>

<View style={styles.controls}>
<Pressable style={styles.controlButton} onPressIn={startMovingLeft} onPressOut={stopMoving}>
<Text style={styles.buttonText}>◀</Text>
</Pressable>

<Pressable style={styles.controlButton} onPressIn={startMovingRight} onPressOut={stopMoving}>
<Text style={styles.buttonText}>▶</Text>
</Pressable>
</View>

</View>
);
}

const styles=StyleSheet.create({
container:{
flex:1,
backgroundColor:"#000",
},

startContainer:{
position:"absolute",
top:0,
left:0,
right:0,
bottom:0,
justifyContent:"center",
alignItems:"center",
zIndex:500,
backgroundColor:"rgba(0,0,0,0.5)",
},

startTitle:{
color:"#FFFFFF",
fontSize:45,
fontWeight:"900",
marginBottom:40,
},

finalScoreText:{
  fontSize:24,
  fontWeight:"bold",
  color:"#FFD700",
  marginBottom:20,
  textShadowColor:"black",
  textShadowOffset:{width:1,height:1},
  textShadowRadius:3,
},

startButton:{
width:180,
height:60,
borderRadius:30,
backgroundColor:"#FFFFFF",
justifyContent:"center",
alignItems:"center",
},

startText:{
color:"#6A00FF",
fontSize:22,
fontWeight:"900",
},

space:{
flex:1,
},

asteroid:{
position:"absolute",
width:ASTEROID_SIZE,
height:ASTEROID_SIZE,
},

rocket:{
position:"absolute",
bottom:75,
width:ROCKET_WIDTH,
height:ROCKET_HEIGHT,
},

explosion:{
position:"absolute",
bottom:70,
width:150,
height:150,
},

scoreContainer:{
position:"absolute",
top:55,
left:20,
right:20,
zIndex:100,
flexDirection:"row",
justifyContent:"space-between",
},

score:{
color:"#fff",
fontSize:22,
fontWeight:"bold",
},

bestScore:{
color:"#FFD700",
fontSize:22,
fontWeight:"bold",
},

gameOverContainer:{
position:"absolute",
top:"38%",
left:0,
right:0,
alignItems:"center",
zIndex:200,
},

gameOverText:{
color:"#FF3B30",
fontSize:42,
fontWeight:"900",
textShadowColor:"#000",
textShadowOffset:{
width:2,
height:2,
},

textShadowRadius:5,
},

restartButton:{
marginTop:30,
width:160,
height:55,
borderRadius:30,
backgroundColor:"#FFFFFF",
justifyContent:"center",
alignItems:"center",
elevation:8,
},

restartText:{
color:"#6A00FF",
fontSize:22,
fontWeight:"900",
},

controls:{
position:"absolute",
bottom:30,
left:20,
right:20,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
},

controlButton:{
width:70,
height:70,
borderRadius:35,
backgroundColor:"rgba(255,255,255,0.18)",
justifyContent:"center",
alignItems:"center",
},

buttonText:{
color:"#FFFFFF",
fontSize:32,
fontWeight:"bold",
},
});