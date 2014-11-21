
function Code()
{ 
	var self = this;

	this.allCharacters = ['K','M','R','S','U','A','P','T','L','O','W','I','.','N','J','E','F','0','Y',',','V','G',
					   '5','/','Q','9','Z','H','3','8','B','?','4','2','7','C','1','D','6','X','BT','SK','AR'];

	this.allDitsAndDahs = ['-.-', '--', '.-.', '...', '..-', '.-', '.--.', '-', '.-..', '---', '.--', '..', '.-.-.-',
						 '-.', '.---', '.', '..-.', '-----', '-.--', '--..--', '...-', '--.', '.....', '-..-.', '--.-', 
						 '----.', '--..', '....', '...--', '---..', '-...', '..--..', '....-', '..---', '--...', '-.-.', 
						 '.----', '-..', '-....', '-..-', '-...-', '...-.-', '.-.-.'];
						 
	this.characters = [];
	this.ditsAndDahs = "";
	
	this.words = ['the', 'key', 'qth', 'rst', 'rig', 'can'];
	
	//T = 1200 / W
	//T = dit length in milliseconds, W = WPM
	//20 WPM = dit length of 60 milliseconds
	this.wordsPerMinute = 20;
	this.timingUnit = 1200 / this.wordsPerMinute;
	this.frequency = 650;
	this.ditDahSpaceTime = this.timingUnit;
	//this.characterSpaceTime = this.timingUnit * 3;
	this.ditTime = this.timingUnit;
	this.dahTime = this.timingUnit * 3;
	this.measurementInterval = 10000; //How often to take a speed measurement
	this.characterCount = 0;  //Number of characters copied in a measurement period
	this.characterIndex = 0;
	this.kochListIndex = 0;
	this.ditDahIndex = 0;
	this.ditDahSpace = false; //Tells the function whether to play a dit/dah or a space
	this.toneTimeoutId = 0;
	this.codeStarted = false;
	this.characterPlaying = false;
	this.charSelectedColor = "lightblue";
	this.charUnselectedColor = "white";
	this.userSpeed = 0;
	
	this.proficiencySpeedThreshold = 10; //How fast you have to be to get a new letter
	this.proficiencyTimeThreshold = this.measurementInterval * 2; //How long you have to be proficient to get a new letter, multiple of measurementInterval
	
	
	this.startSession = function(){
		
		self.updateFreq();
		self.updateSpeed();
		self.updateProficiency();
	
		setTimeout(self.measureUserSpeed, this.measurementInterval);
		
		if(self.characters.length === 0){
			//If no characters are selected, assume Koch method
			this.addNextLetter();
		
		}
		
		self.codeStarted = true;
		this.playCode();
	}
	
	this.playCode = function(){
		self.stopTone();
				
		self.characterPlaying = true;
	
		if(self.ditDahSpace === false){
		
			self.ditsAndDahs = self.allDitsAndDahs[self.allCharacters.indexOf(self.characters[self.characterIndex])];  //Look up current ditdah pattern and store for comparison.
			
			if(self.ditDahIndex > self.ditsAndDahs.length - 1){  //Check if all dits and dahs were sent for a character, if so move to next letter	
				self.ditDahIndex = 0;  
				self.characterPlaying = false;
				self.characterSpace = true;
				//console.log("Sent letter ", self.characters[self.characterIndex]);					
				return
			}
									
			if(self.ditsAndDahs.charAt(self.ditDahIndex) === '.'){
				//console.log("dit");
				self.startTone(self.frequency);
				self.toneTimeoutId = setTimeout(self.playCode, self.ditTime);
			}
			
			else if(self.ditsAndDahs.charAt(self.ditDahIndex) === '-'){
				//console.log("dah");
				self.startTone(self.frequency);
				self.toneTimeoutId = setTimeout(self.playCode, self.dahTime);
			}
			
			else{
				console.log("Neither a dit nor a dah");
				self.stopTone();
			}
			self.ditDahSpace = true;
			self.ditDahIndex++;
		}
		
		else {//self.ditDahSpace === true)
			self.ditDahSpace = false;
			self.toneTimeoutId = setTimeout(self.playCode, self.ditDahSpaceTime);
		}
	}
	
	this.pauseSession = function(){
		clearTimeout(self.toneTimeoutId);
		self.stopTone();
		self.codeStarted = false;
		self.ditDahIndex = 0;  //Start character over upon resume
		document.getElementById("startcode").innerHTML="Resume Code";
	}
	
	this.initAudio = function (){
		// Create an oscillator and an amplifier.
		// Use audioContext from webaudio_tools.js
		if( audioContext )
		{
			oscillator = audioContext.createOscillator();
			fixOscillator(oscillator);
			oscillator.frequency.value = 440;
			amp = audioContext.createGain();
			amp.gain.value = 0;
		
			// Connect oscillator to amp and amp to the mixer of the audioContext.
			// This is like connecting cables between jacks on a modular synth.
			oscillator.connect(amp);
			amp.connect(audioContext.destination);
			oscillator.start(0);
			writeMessageToID( "soundStatus", "<p>Audio initialized.</p>");
		}
	}
	
	this.startTone = function( frequency ){
		var now = audioContext.currentTime;
		
		oscillator.frequency.setValueAtTime(frequency, now);
		
		// Ramp up the gain so we can hear the sound.
		// We can ramp smoothly to the desired value.
		// First we should cancel any previous scheduled events that might interfere.
		amp.gain.cancelScheduledValues(now);
		// Anchor beginning of ramp at current value.
		amp.gain.setValueAtTime(amp.gain.value, now);
		//amp.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
		amp.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.005);
		
		writeMessageToID( "soundStatus", "<p>Play tone at frequency = " + frequency  + "</p>");
	}
	
	this.stopTone = function(){
		var now = audioContext.currentTime;
		amp.gain.cancelScheduledValues(now);
		amp.gain.setValueAtTime(amp.gain.value, now);
		//amp.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 1.0);
		amp.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 0.005);
		writeMessageToID( "soundStatus", "<p>Stop tone.</p>");
	}
	
	this.updateFreq = function(){
		self.frequency = document.getElementById("tonefreq").value;  //Get tone frequence from user, putting this after the freq range 
																     //checks had a bug where the tone would go out of range but the text wouldn't
		if(self.frequency < 100){
			document.getElementById("tonefreq").value = 100;
			self.frequency = 100;
		}
		if(self.frequency > 3000){
			document.getElementById("tonefreq").value = 3000;
			self.frequency = 3000;
		}
	}
	
	this.updateSpeed = function(){
		self.wordsPerMinute = document.getElementById("characterspeed").value;  //Get tone frequence from user, putting this after the freq range 
																     //checks had a bug where the tone would go out of range but the text wouldn't
		if(self.wordsPerMinute < 10){
			document.getElementById("characterspeed").value = 10;
			self.wordsPerMinute = 10;
		}
		if(self.wordsPerMinute > 50){
			document.getElementById("characterspeed").value = 50;
			self.wordsPerMinute = 50;
		}
		
		this.timingUnit = 1200 / this.wordsPerMinute;
		this.ditDahSpaceTime = this.timingUnit;
		//this.characterSpaceTime = this.timingUnit * 3;
		this.ditTime = this.timingUnit;
		this.dahTime = this.timingUnit * 3;
	}
	
	this.updateProficiency = function(){
		self.proficiencySpeedThreshold = document.getElementById("proficiencyspeed").value;  //Get tone frequence from user, putting this after the freq range 
			
		if(self.proficiencySpeedThreshold < 5){
			document.getElementById("proficiencyspeed").value = 5;
			self.proficiencySpeedThreshold = 5;
		}
		if(self.proficiencySpeedThreshold > 40){
			document.getElementById("proficiencyspeed").value = 40;
			self.proficiencySpeedThreshold = 40;
		}
		
		console.log("Proficiency speed set to: ", self.proficiencySpeedThreshold);
	}
	
	this.toggleCharacter = function(id){
		//Check if character is already selected
		console.log(self.characters.indexOf(id.toUpperCase()));
		if(self.characters.indexOf(id.toUpperCase()) > -1){
			console.log("Removing character ", id);
			//document.getElementById(id).style.backgroundColor=this.charUnselectedColor;
			document.getElementById(id).style.background="linear-gradient(black, #404040)";
			self.characters.splice(self.characters.indexOf(id.toUpperCase()), 1);	
		}
		else{
			console.log("Adding character ", id);
			//document.getElementById(id).style.backgroundColor=this.charSelectedColor;
			document.getElementById(id).style.background="linear-gradient(green, #404040)";
			self.characters.push(id.toUpperCase());	
		}
	}

	this.measureUserSpeed = function(){
		measureId = setTimeout(self.measureUserSpeed, self.measurementInterval);
		self.userSpeed = (self.characterCount * 60 / (self.measurementInterval / 1000));
		self.userSpeed = Math.round(self.userSpeed) / 5; //Round to the nearest tenth
		
		document.getElementById("speedmeasurement").innerHTML = self.userSpeed.toString();
		self.characterCount = 0;
		
		if(self.userSpeed >= self.proficiencySpeedThreshold){
			self.addNextLetter();			
		}
	}
	
	this.addNextLetter = function(){
		//If the user has already selected this letter, move to the next unlearned letter in the Koch list
		do{
			if(self.characters.indexOf(self.allCharacters[self.kochListIndex]) > -1){
				self.kochListIndex++;
			}			
		}
		while(self.characters.indexOf(self.allCharacters[self.kochListIndex]) > -1);
			
		self.characters.push(self.allCharacters[self.kochListIndex]);
		//console.log("Test data: ", self.allCharacters[self.kochListIndex].toLowerCase().toString());
		console.log("Test data: ", self.allCharacters[self.kochListIndex].toLowerCase());
		
		//document.getElementById(self.allCharacters[self.kochListIndex].toLowerCase()).style.backgroundColor=self.charSelectedColor;
		document.getElementById(self.allCharacters[self.kochListIndex].toLowerCase()).style.background="linear-gradient(green, #404040)";
		
		console.log("Adding new character: ", self.allCharacters[self.kochListIndex]);
		self.kochListIndex++;
	}
	
	this.startWords = function(){
	
		self.stopTone();
				
		self.characterPlaying = true;
	
		if(self.ditDahSpace === false){
		
			self.ditsAndDahs = self.allDitsAndDahs[self.allCharacters.indexOf(self.characters[self.characterIndex])];  //Look up current ditdah pattern and store for comparison.
			
			if(self.ditDahIndex > self.ditsAndDahs.length - 1){  //Check if all dits and dahs were sent for a character, if so move to next letter	
				self.ditDahIndex = 0;  
				self.characterPlaying = false;
				self.characterSpace = true;
				//console.log("Sent letter ", self.characters[self.characterIndex]);					
				return
			}
									
			if(self.ditsAndDahs.charAt(self.ditDahIndex) === '.'){
				//console.log("dit");
				self.startTone(self.frequency);
				self.toneTimeoutId = setTimeout(self.playCode, self.ditTime);
			}
			
			else if(self.ditsAndDahs.charAt(self.ditDahIndex) === '-'){
				//console.log("dah");
				self.startTone(self.frequency);
				self.toneTimeoutId = setTimeout(self.playCode, self.dahTime);
			}
			
			else{
				console.log("Neither a dit nor a dah");
				self.stopTone();
			}
			self.ditDahSpace = true;
			self.ditDahIndex++;
		}
		
		else {//self.ditDahSpace === true)
			self.ditDahSpace = false;
			self.toneTimeoutId = setTimeout(self.playCode, self.ditDahSpaceTime);
		}
	}
	this.pauseWords = function(){
	}
}

//-----------Start of Code-----------------------------

var oscillator;
var amp;

var code = new Code();

// init once the page has finished loading.
window.onload = code.initAudio;

$(document).ready(function() {
  
	$(document).keypress(function(event){
		if(code.codeStarted === true && code.characterPlaying === false){
					
			if(code.characters[code.characterIndex] === String.fromCharCode(event.which).toUpperCase()){
				//console.log("Correct key pressed");
				document.getElementById("chardisplay").innerHTML=code.characters[code.characterIndex];
				document.getElementById("chardisplay").style.backgroundColor="white";
				
				code.characterIndex = Math.round((Math.random() * (code.characters.length - 1))); //+ 1);
				code.characterCount++;				
			}
			
			else{
				document.getElementById("chardisplay").style.backgroundColor="red";
				
				code.startTone(200);
			}
		
		code.playCode();
		//code.toneTimeoutId = setTimeout(code.playCode, code.characterSpaceTime);  //Don't need this anymore because characters are not sent consectutively
		}
	})

	$( ".letterbox" ).click(function() {
		code.toggleCharacter(this.id);
	});
});





//-------------------------------------Junk------------------------------------------
	/*this.characters = [['K', '-.-'],['M', '--'],['R', '.-.'],['S', '...'],['U', '..-'],['A', '.-'],['P', '.--.'],['T', '-'],['L', '.-..'],['O', '---'],['W', '.--']
				 ['I', '..'],['.', '.-.-.-'],['N', '-.'],['J', '.---'],['E', '.'],['F', '..-.'],['0', '-----'],['Y', '-.--'],[',', '--..--'],['V', '..._'],
				 ['G', '--.'],['5', '.....'],['/', '-..-.'],['Q', '--.-'],['9', '----.'],['Z', '--..'],['H', '....'],['3', '...--'],['8', '---..'],['B', '-...'],
				 ['?', '..--..'],['4', '...._'],['2', '..---'],['7', '--...'],['C', '-.-.'],['1', '.----'],['D', '-..'],['6', '-....'],['X', '-..-'],['BT', '-...-'],
				 ['SK', '...-.-'],['AR', '.-.-.'] ]
	*/
