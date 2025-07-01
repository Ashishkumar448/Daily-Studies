// i'll make it a sandwich maker instead.

var meat = document.getElementById('meat');
var sauce = document.getElementById('sauce');
var greens = document.getElementById('greens');
var cheese = document.getElementById('cheese');

var meatspot = document.getElementById('meatspot');
var cheesespot = document.getElementById('cheesespot');
var saucespot = document.getElementById('saucespot');
var greensspot = document.getElementById('greensspot');





function isEmpty() {
	 var isMeatEmpty = document.getElementById('meatspot').innerHTML == ""; 
var isCheeseEmpty = document.getElementById('cheesespot').innerHTML == "";
 var isSauceEmpty = document.getElementById('saucespot').innerHTML == ""; 
var isGreensEmpty = document.getElementById('greensspot').innerHTML == "";
	
	var sandwichSpot = document.getElementById('sandwich');
	
	if (isMeatEmpty || isCheeseEmpty || isSauceEmpty || isGreensEmpty) {

	} else {
		sandwichSpot.innerHTML = "<p>🥪</p>";
		
		var plate = document.createElement('div');
plate.id = 'plate';
plate.className = 'plate';
document.getElementById('sandwich').appendChild(plate);
plate.innerHTML = "🍽️";
// Now create and append to iDiv
var innerDiv = document.createElement('div');
innerDiv.className = 'block-2';

// The variable iDiv is still good... Just append to it.
plate.appendChild(innerDiv);
		
// sandwichSpot.classList.add('bounce');
			document.styleSheets[0].insertRule('.toast-snack:after {width: 77px !important;height: 20px !important;top: 137px !important; left: 11px !important;transform: rotatez(-557deg) !important; }', 0);
	}
	
}


meat.onclick = function(){
	meatspot.innerHTML = meat.innerHTML;
	isEmpty();
};

cheese.onclick = function(){
	cheesespot.innerHTML = cheese.innerHTML;
		isEmpty();
};

sauce.onclick = function(){
	saucespot.innerHTML = sauce.innerHTML;
		isEmpty();
};

greens.onclick = function(){
	greensspot.innerHTML = greens.innerHTML;
		isEmpty();
};