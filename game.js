//set up canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
ctx.font = "30px Arial";

//canvas size vars
var centerX = canvas.width/2;
var centerY = canvas.height/2;
var screenWidth = canvas.width;
var screenHeight = canvas.height;

//place canvas origin at (0,0) and rotate so that down is - and up is +
ctx.translate(centerX, centerY);
ctx.rotate(Math.PI)

//bowl dim vars
var bowlRadius = 250;
var bowlBaseWidth = 150;
var bowlBaseY = -200;
var bowlMaxY = 150;
var lidRad = 20;

//water vars
var waterHeight = Math.round(Math.random() * (-100 + 70) - 70);
var noiseVertices = 256;
var noiseVerticesMask = noiseVertices - 1;
var amplitude = 40;
var scale = .03;
var r = [];
for (i = 0; i < noiseVertices; ++i ) {
    r.push(Math.random());
}

//player stat vars
var playerY = waterHeight;
var playerX = 0;
var playerRotation = 60;
var playerWidth = 74;
var playerHeight = 50;
var playerRadius = computeCircle(playerWidth/2, 0, playerHeight/2, 0);

//controler vars
var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var facingRight = false;

//image vars
var images = {};
var totalResources = 4;
var numResourcesLoaded = 0;
var fps = 30;
//load images
loadImage("fishRight");
loadImage("fishLeft");
loadImage("flyRight");
loadImage("flyLeft");

//projectile vars
var canShoot = true;
var projectiles = [];
var projectileSpeed = 15;

//bug vars
var bugs = [];
var bugSpeed = 5;
var bugSpawnChance = .01;
var bugsShot = 0;

//wind vars
var windSpeed = 0;
var windChangeChance = .01;

//add key listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

//handle key downs
function keyDownHandler(e){
    if(e.keyCode == 68){
        rightPressed = true;
    }else if(e.keyCode == 65){
        leftPressed = true;
    }else if(e.keyCode == 87){
        upPressed = true;
    }else if(e.keyCode == 83){
        downPressed = true;
    }else if(e.keyCode == 32 && canShoot){
        shootWater();
        canShoot = false;
    }
}

//handle key ups
function keyUpHandler(e){
    if(e.keyCode == 68){
        rightPressed = false;
    }else if(e.keyCode == 65){
        leftPressed = false;
    }else if(e.keyCode == 87){
        upPressed = false;
    }else if(e.keyCode == 83){
        downPressed = false;
    }else if(e.keyCode == 32){
        canShoot = true;
    }
}

//load image
function loadImage(name){
    images[name] = new Image();
    images[name].onload = function(){
        resourceLoaded();
    }
    images[name].src = "images/" + name + ".png";
}

//this function handles all of the logic to draw the bowl
function drawBowl(){
    //for every pixel in the square surrounding the bowl 
    for(x = -bowlRadius; x <= bowlRadius; x++){
        for(y = -bowlRadius; y <= bowlRadius; y++){
            //if y is at the height of the base of the bowl
            if(y == bowlBaseY){
                //draw a line as the base of the bowl
                if(x > -bowlBaseWidth && x < bowlBaseWidth){
                    drawRect(x, y, 1, 1, "#000000");
                }
            //else if y is between bowl base height and bowl max height
            }else if(y > bowlBaseY && y <= bowlMaxY){
                //if (x,y) lies on the circle with r = bowlRadius, center = (0,0)
                if(computeCircle(x, 0, y, 0) == bowlRadius){
                    //draw a dot
                    drawRect(x, y, 1, 1, "#000000");
                }
                //if the perlin noise function places its point inside the bowl
                if(computeCircle(x, 0, y + perlinNoise1D(x), 0) < bowlRadius){
                    //if y is at the height of the water
                    if(y == waterHeight){
                        //draw a point at x and y + where the perlin noise function places y for that x and mirror to other side
                        drawRect(x, y + perlinNoise1D(x), 1, 1, "#233dbc");
                        drawRect(-x, y + perlinNoise1D(x), 1, 1, "#233dbc");
                    }
                }
            //if y is at bowl max y
            }else if(y > bowlMaxY){
                //if (x, y) lies on the circle with r = lidRad, center =(the horizontal component of the radius to y + the radius of the lid, y)
                if(computeCircle(x, getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad, y, bowlMaxY, lidRad) == lidRad){
                    //draw a point and mirror it
                    drawRect(x, y, 1, 1, "#000000");
                    drawRect(-x, y, 1, 1, "#000000");
                }
            }
            
            
        }
    }
}

//function to generate perlin noise
function perlinNoise1D(x){
    //apply the scale var to x
    var xScaled = x * scale;
    //round x down
    var xFloor = Math.floor(xScaled);
    //find the diffrence between them
    var t = xScaled - xFloor;
    //smooth step interpolation calculation
    var tSmoothStep = t * t * (3 - 2 * t);
    //calculating the min and max X values
    var xMin = xFloor % noiseVerticesMask;
    var xMax = (xMin + 1) % noiseVerticesMask;

    //calculate y
    var y = r[xMin] * (1 - tSmoothStep) + r[xMax] * tSmoothStep;

    //apply amplitude to y
    return y * amplitude;
}

//function to shoot water when space is pressed;
function shootWater(){
    createProjectile();
    createProjectile();
    createProjectile();
}

//random helper function
function randomBetweenRange(min, max){
    return Math.random() * (max - min) + min;
}

//function to create a bug
function createBug(){
    //bug vars
    var bugX;
    var bugY;
    var bugVelocityX;
    var bugVelocityY;
    var startingSide = randomBetweenRange(-1, 1);
    var isHit = false;
    var bugRadius = 15;
    
    //pick which side of the bowl the bug will start on
    if(startingSide > 0){
        bugX = bowlRadius - randomBetweenRange(0, 50);
        bugVelocityX = -bugSpeed;
    }else{
        bugX = -bowlRadius + randomBetweenRange(0, 50);
        bugVelocityX = bugSpeed;
    }
    
    //pick a height for the bug to be placed at
    bugY = bowlMaxY + lidRad + randomBetweenRange(20, 40); 

    bugVelocityY = 0;
    
    //add bug to bugs array
    bugs.push({x: bugX, y: bugY, dx: bugVelocityX, dy:bugVelocityY, hit:isHit, r:bugRadius})
}

//function to draw a bug for every bug in the bug array
function drawBugs(){
    for(i = 0; i < bugs.length; i++){
        if(bugs[i].dx < 0 ){
            ctx.drawImage(images["flyRight"], bugs[i].x - bugs[i].r/2, bugs[i].y - bugs[i].r/2);
        }else{
            ctx.drawImage(images["flyLeft"], bugs[i].x - bugs[i].r/2, bugs[i].y - bugs[i].r/2);
        }
    }
}

//function to create a projectile
function createProjectile(){
    //projectile vars
    var projectileX;
    var projectileY;
    var projectileRadius = Math.random() * (10 - 3) + 3; 
    var projectileVelocityX;
    var projectileVelocityY;

    //place the projectile at the same angle as the player and give it proper velocities
    projectileX = playerX + (Math.random() * (10 + 10) -10) + Math.cos(playerRotation * Math.PI / 180) * playerRadius;
    projectileY = playerY + (Math.random() * (10 + 10) -10) + Math.sin(playerRotation * Math.PI / 180) * playerRadius;
    projectileVelocityX = projectileSpeed * Math.cos(playerRotation * Math.PI / 180);
    projectileVelocityY = projectileSpeed * Math.sin(playerRotation * Math.PI / 180);


    //make sure the the placed projectile is not overlapping any others, get them to spread down and "surround the fish"
    for(i = 0; i < projectiles.length; i++){
        if(computeDistanceBetweenCircles(projectileRadius, projectileX, projectileY, projectiles[i].r, projectiles[i].x, projectiles[i].y) < projectileRadius + projectiles[i].r){
            while(computeDistanceBetweenCircles(projectileRadius, projectileX, projectileY, projectiles[i].r, projectiles[i].x, projectiles[i].y) < projectileRadius + projectiles[i].r){
                var cordToChange = Math.round(Math.random());
                if(cordToChange == 0){
                    projectileX -= 1;
                }else{
                    projectileY -= 1;
                }
            }  
        }
    }

    //add projectile to projectile array
    projectiles.push({x: projectileX, y:projectileY, r: projectileRadius, dx: projectileVelocityX, dy: projectileVelocityY, type: "water"});
}

//draw projectiles, a blue circle if water, and the proper bug if it is a bug
function drawProjectiles(){
    for(i = 0; i < projectiles.length; i++){
        if(projectiles[i].type == "water"){
            ctx.strokeStyle = "#233dbc";
            ctx.beginPath();
            ctx.arc(projectiles[i].x, projectiles[i].y, projectiles[i].r, 0, 2*Math.PI);
            ctx.stroke();
        }else if(projectiles[i].type == "bug"){
            if(projectiles[i].dx < 0 ){
                ctx.drawImage(images["flyRight"], projectiles[i].x - projectiles[i].r/2, projectiles[i].y - projectiles[i].r/2);
            }else{
                ctx.drawImage(images["flyLeft"], projectiles[i].x - projectiles[i].r/2, projectiles[i].y - projectiles[i].r/2);
            }
        }
        
    }
}

//compute circle helper function
function computeCircle(x, centerX, y, centerY){
    return Math.round(Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)));
}

//function to draw player
function drawPlayer(x, y, width, height, degrees){
    //save canvas context
    ctx.save();

    ctx.beginPath();

    //move origin to player
    ctx.translate(x, y);

    //rotate canvas to draw player at players rotation
    ctx.rotate(degrees * Math.PI / 180);

    //apply proper image depending on which way the player is facing
    if(facingRight){
        ctx.drawImage(images["fishRight"], -width/2, -height/2);
    }else{
        ctx.drawImage(images["fishLeft"], -width/2, -height/2);
    }
    
    //restore canvas context
    ctx.restore();
}

//get the x component of the radius at given y component
function getCircleXFromY(y, circCenterX, circCenterY, radius){
    return Math.round(Math.sqrt(Math.pow(radius, 2) - Math.pow(y - circCenterY, 2))) + circCenterX;
}

//get the y component of the radius at given x component
function getCircleYFromX(y, circCenterX, circCenterY, radius){
    return Math.round(Math.sqrt(Math.pow(radius, 2) - Math.pow(x - circCenterX, 2))) + circCenterY;
}

//draw a rectangle
function drawRect(x, y, width, height, color){
    ctx.beginPath();
    ctx.rect( x , y , width, height );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

//function to handle player movement 
function handlePlayerMovement(){
    //move player with "a" and "d" keys, bounded by testing circle around player stays in the bowls radius
    if(leftPressed && ( computeDistanceBetweenCircles(playerRadius - 7, playerX, playerY, bowlRadius, 0, 0) < bowlRadius - playerRadius || playerX < 0)){
        if(facingRight){
            facingRight = false;
            playerRotation = 90 + (90 - playerRotation);
        }
        playerX += 7;
    }else if(rightPressed && (computeDistanceBetweenCircles(playerRadius + 7, playerX, playerY, bowlRadius, 0, 0) < bowlRadius - playerRadius || playerX > 0)){
        if(!facingRight){
            facingRight = true;
            playerRotation = 90 + (90 - playerRotation);
        }
        playerX -=7;
    }

    //rotate player with "w" and "s" keys bounded by +- 60 degrees from 90
    if(upPressed){
        if(facingRight && playerRotation > 90){
            playerRotation -= 5;
        }else if(!facingRight && playerRotation < 90){
            playerRotation += 5;
        }
    }
    if(downPressed){
        if(facingRight && playerRotation < 150){
            playerRotation += 5;
        }else if(!facingRight && playerRotation > 30){
            playerRotation -= 5;
        }
    }
}

//test to see if a circle with radius r at (x,y) would collide with any part of the bowl
function didCollideWithBowl(r, x, y, dx, dy){
    //calculate dist between bowl and object
    var distBetweenBowl = computeDistanceBetweenCircles(r, x, y, bowlRadius, 0, 0);
    //calculate dist between bowl and where object will be next update
    var futuredDistBetweenBowl = computeDistanceBetweenCircles(r, x + dx, y + dy, bowlRadius, 0, 0);
    //if collides with main bowl return 1
    if( (futuredDistBetweenBowl > bowlRadius - r && distBetweenBowl < bowlRadius && y + dy < bowlMaxY) || (futuredDistBetweenBowl < bowlRadius + r && distBetweenBowl > bowlRadius && y + dy < bowlMaxY)){
        return 1;
    }else{
        var futuredDistBetweenLidLeft = computeDistanceBetweenCircles(r, x + dx, y + dy, lidRad, getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad, bowlMaxY);
        var futuredDistBetweenLidRight = computeDistanceBetweenCircles(r, x + dx, y + dy, lidRad, -getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) - lidRad, bowlMaxY);
        //if collides with left lid circle return 2
        if(futuredDistBetweenLidLeft < lidRad + r){
            return 2;
        //if collides with right lid circle return 3
        }else if(futuredDistBetweenLidRight < lidRad + r){
            return 3;
        }
    }
    //else no collision
    return 0;
}

//function to handle projectile movement
function handleProjectileMovement(){
    for( i = 0; i < projectiles.length; i++ ){
        //test which surface was collided with
        var surfaceCollidedWith = didCollideWithBowl(projectiles[i].r, projectiles[i].x, projectiles[i].y, projectiles[i].dx, projectiles[i].dy);
        //if there was a collision
        if( surfaceCollidedWith != 0 ){
            //if collision was wiht main bowl
            if( surfaceCollidedWith == 1 ){
                //set vars to rebound projectile off circle
                var normMagnitude = computeDistanceBetweenCircles(projectiles[i].r, projectiles[i].x, projectiles[i].y, bowlRadius, 0, 0);
                var normalX = projectiles[i].x  / normMagnitude;
                var normalY = projectiles[i].y  / normMagnitude;
                var tangentX = -normalY;
                var tangentY = normalX;
                var normalSpeed = -(normalX * projectiles[i].dx + normalY * projectiles[i].dy);
                var tangentSpeed = tangentX * projectiles[i].dx + tangentY * projectiles[i].dy;
                
                //apply the proper velocitys
                projectiles[i].dx = (normalSpeed * normalX + tangentSpeed * tangentX) * .9;
                projectiles[i].dy = (normalSpeed * normalY + tangentSpeed * tangentY) * .9;
            //if collides with left lid circle
            }else if( surfaceCollidedWith == 2 ){
                //set vars to rebound projectile off circle
                var normMagnitude = computeDistanceBetweenCircles(projectiles[i].r, projectiles[i].x, projectiles[i].y, lidRad, getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad, bowlMaxY);
                var normalX = (projectiles[i].x - getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad) / normMagnitude;
                var normalY = (projectiles[i].y - bowlMaxY) / normMagnitude;
                var tangentX = -normalY;
                var tangentY = normalX;
                var normalSpeed = -(normalX * projectiles[i].dx + normalY * projectiles[i].dy);
                var tangentSpeed = tangentX * projectiles[i].dx + tangentY * projectiles[i].dy;
                
                //apply the proper velocitys
                projectiles[i].dx = -(normalSpeed * normalX + tangentSpeed * tangentX) * .9;
                projectiles[i].dy = -(normalSpeed * normalY + tangentSpeed * tangentY) * .9;
            //if collides with right lid circle
            }else if( surfaceCollidedWith == 3 ){
                //set vars to rebound projectile off circle
                var normMagnitude = computeDistanceBetweenCircles(projectiles[i].r, projectiles[i].x, projectiles[i].y, lidRad, -(getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad), bowlMaxY);
                var normalX = (projectiles[i].x - -(getCircleXFromY(bowlMaxY, 0, 0, bowlRadius) + lidRad)) / normMagnitude;
                var normalY = (projectiles[i].y - bowlMaxY) / normMagnitude;
                var tangentX = -normalY;
                var tangentY = normalX;
                var normalSpeed = -(normalX * projectiles[i].dx + normalY * projectiles[i].dy);
                var tangentSpeed = tangentX * projectiles[i].dx + tangentY * projectiles[i].dy;
                
                //apply the proper velocitys
                projectiles[i].dx = (normalSpeed * normalX + tangentSpeed * tangentX) * .9;
                projectiles[i].dy = (normalSpeed * normalY + tangentSpeed * tangentY) * .9;
            }
        }

        //apply wind force if projectiles are above the bowl
        if(projectiles[i].y > bowlMaxY + lidRad){
            projectiles[i].dx -= windSpeed / projectiles[i].r;
        }
        //projectiles fall with gravity, effected by their size or r
        projectiles[i].dy -= .05 * projectiles[i].r;

        //update projectile position
        projectiles[i].x += projectiles[i].dx;
        projectiles[i].y += projectiles[i].dy;
        

        //if projectiles position places them outside the screen or in the water remove them from the projectile array and the game
        if(projectiles[i].x < -centerX || projectiles[i].x > centerX){
            projectiles.splice(i, 1);
        }else if(projectiles[i].y < -centerY || projectiles[i].y > centerY + 100){
            projectiles.splice(i, 1);
        }else if(computeDistanceBetweenCircles(projectiles[i].r, projectiles[i].x, projectiles[i].y, bowlRadius, 0, 0) < bowlRadius){
            if(projectiles[i].x < 0 && projectiles[i].y < waterHeight + perlinNoise1D(-projectiles[i].x) || projectiles[i].x > 0 && projectiles[i].y < waterHeight + perlinNoise1D(projectiles[i].x)){
                projectiles.splice(i, 1);
            }
            
        }

        
    }

    
}
//handle bug movement
function handleBugMovement(){
    for(i = 0; i < bugs.length; i++){
        // make bugs effected by windspeed
        bugs[i].x += (bugs[i].dx - windSpeed);
        bugs[i].y += (bugs[i].dy);
        //check if a bug got hit
        for(j = 0; j < projectiles.length; j++){
            if(computeDistanceBetweenCircles(bugs[i].r, bugs[i].x, bugs[i].y, projectiles[j].r, projectiles[j].x, projectiles[j].y) < bugs[i].r + projectiles[j].r){                
                bugs[i].hit = true;
            }
        }
        //if bug is out of bounds remove from bug array
        if(bugs[i].x < -centerX || bugs[i].x >  centerX){
            bugs.splice(i, 1);
        //if bug is hit by water, add bug to projectile array and remove from bug array
        }else if(bugs[i].hit){
            bugsShot += 1;
            projectiles.push({x: bugs[i].x, y: bugs[i].y, r: bugs[i].r, dx: bugs[i].dx, dy: bugs[i].dy, type: "bug"});
            bugs.splice(i, 1);
        }
    }
}
//helper function to compute distance between circles
function computeDistanceBetweenCircles(circ1R, circ1X, circ1Y, circ2R, circ2X, circ2Y){
    var dx = circ1X - circ2X;
    var dy = circ1Y - circ2Y;
    var distance = computeCircle(dx, 0, dy, 0);

    return distance;
}

//helper function to draw text
function drawText(){
    ctx.save();
    
        ctx.beginPath();
    
        ctx.translate(centerX, centerY);
    
        ctx.rotate(180 * Math.PI / 180);
        
        ctx.fillText("Current Wind speed is around: " + Math.round(windSpeed), 0, 490);
        ctx.fillText("Bugs shot: " + bugsShot, 550, 490);
        ctx.restore();
}

//main draw function called every update
function draw(){
    //clear canvas
    ctx.clearRect(-centerX, -centerY, canvas.width, canvas.height);
    //draw bowl
    drawBowl();
    //randomly spawn bugs
    var didBugSpawn = Math.random();
    if(didBugSpawn < bugSpawnChance){
        createBug();
    }
    //randomly change wind speed
    var didWindChange = Math.random();
    if(didWindChange < windChangeChance){
        windSpeed = randomBetweenRange(-4, 4);
    }
    
    //draw player, bugs, projectiles, and text
    drawPlayer(playerX, playerY, playerWidth, playerHeight, playerRotation);
    drawBugs();
    drawProjectiles();
    drawText();

    //update player, bugs, and projectiles
    handlePlayerMovement();
    handleBugMovement();
    handleProjectileMovement();
}

//test if all images are loaded, if so start drawing at fps
function resourceLoaded(){
    numResourcesLoaded += 1;
    if(numResourcesLoaded == totalResources){
        setInterval(draw, 1000 / fps);
    }
}