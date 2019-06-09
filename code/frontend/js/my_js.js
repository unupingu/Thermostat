/*******************THERMOSTAT*****************************/
var thermostatDial = (function() {
	
	/*
	 * Utility functions
	 */
	
	// Create an element with proper SVG namespace, optionally setting its attributes and appending it to another element
	function createSVGElement(tag,attributes,appendTo) {
		var element = document.createElementNS('http://www.w3.org/2000/svg',tag);
		attr(element,attributes);
		if (appendTo) {
			appendTo.appendChild(element);
		}
		return element;
	}
	
	// Set attributes for an element
	function attr(element,attrs) {
		for (var i in attrs) {
			element.setAttribute(i,attrs[i]);
		}
	}
	
	// Rotate a cartesian point about given origin by X degrees
	function rotatePoint(point, angle, origin) {
		var radians = angle * Math.PI/180;
		var x = point[0]-origin[0];
		var y = point[1]-origin[1];
		var x1 = x*Math.cos(radians) - y*Math.sin(radians) + origin[0];
		var y1 = x*Math.sin(radians) + y*Math.cos(radians) + origin[1];
		return [x1,y1];
	}
	
	// Rotate an array of cartesian points about a given origin by X degrees
	function rotatePoints(points, angle, origin) {
		return points.map(function(point) {
			return rotatePoint(point, angle, origin);
		});
	}
	
	// Given an array of points, return an SVG path string representing the shape they define
	function pointsToPath(points) {
		return points.map(function(point, iPoint) {
			return (iPoint>0?'L':'M') + point[0] + ' ' + point[1];
		}).join(' ')+'Z';
	}
	
	function circleToPath(cx, cy, r) {
		return [
			"M",cx,",",cy,
			"m",0-r,",",0,
			"a",r,",",r,0,1,",",0,r*2,",",0,
			"a",r,",",r,0,1,",",0,0-r*2,",",0,
			"z"
		].join(' ').replace(/\s,\s/g,",");
	}
	
	function donutPath(cx,cy,rOuter,rInner) {
		return circleToPath(cx,cy,rOuter) + " " + circleToPath(cx,cy,rInner);
	}
	
	// Restrict a number to a min + max range
	function restrictToRange(val,min,max) {
		if (val < min) return min;
		if (val > max) return max;
		return val;
	}
	
	// Round a number to the nearest 0.5
	function roundHalf(num) {
		return Math.round(num*2)/2;
	}
	
	function setClass(el, className, state) {
		el.classList[state ? 'add' : 'remove'](className);
	}
	
	/*
	 * The "MEAT"
	 */

	return function(targetElement, options) {
		var self = this;
		
		/*
		 * Options
		 */
		options = options || {};
		options = {
			diameter: options.diameter || 400,
			minValue: options.minValue || 10, // Minimum value for target temperature
			maxValue: options.maxValue || 30, // Maximum value for target temperature
			numTicks: options.numTicks || 150, // Number of tick lines to display around the dial
			onSetTargetTemperature: options.onSetTargetTemperature || function() {}, // Function called when new target temperature set by the dial
		};
		
		/*
		 * Properties - calculated from options in many cases
		 */
		var properties = {
			tickDegrees: 300, //  Degrees of the dial that should be covered in tick lines
			rangeValue: options.maxValue - options.minValue,
			radius: options.diameter/2,
			ticksOuterRadius: options.diameter / 30,
			ticksInnerRadius: options.diameter / 8,
			hvac_states: ['off', 'heating', 'cooling'],
			dragLockAxisDistance: 15,
		}
		properties.lblAmbientPosition = [properties.radius, properties.ticksOuterRadius-(properties.ticksOuterRadius-properties.ticksInnerRadius)/2]
		properties.offsetDegrees = 180-(360-properties.tickDegrees)/2;
		
		/*
		 * Object state
		 */
		var state = {
			target_temperature: options.minValue,
			ambient_temperature: options.minValue,
			hvac_state: properties.hvac_states[0],
			has_leaf: false,
			away: false
		};
		
		/*
		 * Property getter / setters
		 */
		Object.defineProperty(this,'target_temperature',{
			get: function() {
				return state.target_temperature;
			},
			set: function(val) {
				state.target_temperature = restrictTargetTemperature(+val);
				render();
			}
		});
		Object.defineProperty(this,'ambient_temperature',{
			get: function() {
				return state.ambient_temperature;
			},
			set: function(val) {
				state.ambient_temperature = roundHalf(+val);
				render();
			}
		});
		Object.defineProperty(this,'hvac_state',{
			get: function() {
				return state.hvac_state;
			},
			set: function(val) {
				if (properties.hvac_states.indexOf(val)>=0) {
					state.hvac_state = val;
					render();
				}
			}
		});
		Object.defineProperty(this,'has_leaf',{
			get: function() {
				return state.has_leaf;
			},
			set: function(val) {
				state.has_leaf = !!val;
				render();
			}
		});
		Object.defineProperty(this,'away',{
			get: function() {
				return state.away;
			},
			set: function(val) {
				state.away = !!val;
				render();
			}
		});
		
		/*
		 * SVG
		 */
		var svg = createSVGElement('svg',{
			width: '100%', //options.diameter+'px',
			height: '100%', //options.diameter+'px',
			viewBox: '0 0 '+options.diameter+' '+options.diameter,
			class: 'dial'
		},targetElement);
		// CIRCULAR DIAL
		var circle = createSVGElement('circle',{
			cx: properties.radius,
			cy: properties.radius,
			r: properties.radius,
			class: 'dial__shape'
		},svg);
		// EDITABLE INDICATOR
		var editCircle = createSVGElement('path',{
			d: donutPath(properties.radius,properties.radius,properties.radius-4,properties.radius-8),
			class: 'dial__editableIndicator',
		},svg);
		
		/*
		 * Ticks
		 */
		var ticks = createSVGElement('g',{
			class: 'dial__ticks'	
		},svg);
		var tickPoints = [
			[properties.radius-1, properties.ticksOuterRadius],
			[properties.radius+1, properties.ticksOuterRadius],
			[properties.radius+1, properties.ticksInnerRadius],
			[properties.radius-1, properties.ticksInnerRadius]
		];
		var tickPointsLarge = [
			[properties.radius-1.5, properties.ticksOuterRadius],
			[properties.radius+1.5, properties.ticksOuterRadius],
			[properties.radius+1.5, properties.ticksInnerRadius+20],
			[properties.radius-1.5, properties.ticksInnerRadius+20]
		];
		var theta = properties.tickDegrees/options.numTicks;
		var tickArray = [];
		for (var iTick=0; iTick<options.numTicks; iTick++) {
			tickArray.push(createSVGElement('path',{d:pointsToPath(tickPoints)},ticks));
		};
		
		/*
		 * Labels
		 */
		var lblTarget = createSVGElement('text',{
			x: properties.radius,
			y: properties.radius,
			class: 'dial__lbl dial__lbl--target'
		},svg);
		var lblTarget_text = document.createTextNode('');
		lblTarget.appendChild(lblTarget_text);
		//
		var lblTargetHalf = createSVGElement('text',{
			x: properties.radius + properties.radius/2.5,
			y: properties.radius - properties.radius/8,
			class: 'dial__lbl dial__lbl--target--half'
		},svg);
		var lblTargetHalf_text = document.createTextNode('5');
		lblTargetHalf.appendChild(lblTargetHalf_text);
		//
		var lblAmbient = createSVGElement('text',{
			class: 'dial__lbl dial__lbl--ambient'
		},svg);
		var lblAmbient_text = document.createTextNode('');
		lblAmbient.appendChild(lblAmbient_text);
		//
		var lblAway = createSVGElement('text',{
			x: properties.radius,
			y: properties.radius,
			class: 'dial__lbl dial__lbl--away'
		},svg);
		var lblAway_text = document.createTextNode('AWAY');
		lblAway.appendChild(lblAway_text);
		//
		var icoLeaf = createSVGElement('path',{
			class: 'dial__ico__leaf'
		},svg);
		
		/*
		 * LEAF
		 */
		var leafScale = properties.radius/5/100;
		var leafDef = ["M", 3, 84, "c", 24, 17, 51, 18, 73, -6, "C", 100, 52, 100, 22, 100, 4, "c", -13, 15, -37, 9, -70, 19, "C", 4, 32, 0, 63, 0, 76, "c", 6, -7, 18, -17, 33, -23, 24, -9, 34, -9, 48, -20, -9, 10, -20, 16, -43, 24, "C", 22, 63, 8, 78, 3, 84, "z"].map(function(x) {
			return isNaN(x) ? x : x*leafScale;
		}).join(' ');
		var translate = [properties.radius-(leafScale*100*0.5),properties.radius*1.5]
		var icoLeaf = createSVGElement('path',{
			class: 'dial__ico__leaf',
			d: leafDef,
			transform: 'translate('+translate[0]+','+translate[1]+')'
		},svg);
			
		/*
		 * RENDER
		 */
		function render() {
			renderAway();
			renderHvacState();
			renderTicks();
			renderTargetTemperature();
			renderAmbientTemperature();
			renderLeaf();
		}
		render();

		/*
		 * RENDER - ticks
		 */
		function renderTicks() {
			var vMin, vMax;
			if (self.away) {
				vMin = self.ambient_temperature;
				vMax = vMin;
			} else {
				vMin = Math.min(self.ambient_temperature, self.target_temperature);
				vMax = Math.max(self.ambient_temperature, self.target_temperature);
			}
			var min = restrictToRange(Math.round((vMin-options.minValue)/properties.rangeValue * options.numTicks),0,options.numTicks-1);
			var max = restrictToRange(Math.round((vMax-options.minValue)/properties.rangeValue * options.numTicks),0,options.numTicks-1);
			//
			tickArray.forEach(function(tick,iTick) {
				var isLarge = iTick==min || iTick==max;
				var isActive = iTick >= min && iTick <= max;
				attr(tick,{
					d: pointsToPath(rotatePoints(isLarge ? tickPointsLarge: tickPoints,iTick*theta-properties.offsetDegrees,[properties.radius, properties.radius])),
					class: isActive ? 'active' : ''
				});
			});
		}
	
		/*
		 * RENDER - ambient temperature
		 */
		function renderAmbientTemperature() {
			lblAmbient_text.nodeValue = Math.floor(self.ambient_temperature);
			if (self.ambient_temperature%1!=0) {
				lblAmbient_text.nodeValue += '⁵';
			}
			var peggedValue = restrictToRange(self.ambient_temperature, options.minValue, options.maxValue);
			degs = properties.tickDegrees * (peggedValue-options.minValue)/properties.rangeValue - properties.offsetDegrees;
			if (peggedValue > self.target_temperature) {
				degs += 8;
			} else {
				degs -= 8;
			}
			var pos = rotatePoint(properties.lblAmbientPosition,degs,[properties.radius, properties.radius]);
			attr(lblAmbient,{
				x: pos[0],
				y: pos[1]
			});
		}

		/*
		 * RENDER - target temperature
		 */
		function renderTargetTemperature() {
			lblTarget_text.nodeValue = Math.floor(self.target_temperature);
			setClass(lblTargetHalf,'shown',self.target_temperature%1!=0);
		}
		
		/*
		 * RENDER - leaf
		 */
		function renderLeaf() {
			setClass(svg,'has-leaf',self.has_leaf);
		}
		
		/*
		 * RENDER - HVAC state
		 */
		function renderHvacState() {
			Array.prototype.slice.call(svg.classList).forEach(function(c) {
				if (c.match(/^dial--state--/)) {
					svg.classList.remove(c);
				};
			});
			svg.classList.add('dial--state--'+self.hvac_state);
		}
		
		/*
		 * RENDER - awau
		 */
		function renderAway() {
			svg.classList[self.away ? 'add' : 'remove']('away');
		}
		
		/*
		 * Drag to control
		 */
		var _drag = {
			inProgress: false,
			startPoint: null,
			startTemperature: 0,
			lockAxis: undefined
		};
		
		function eventPosition(ev) {
			if (ev.targetTouches && ev.targetTouches.length) {
				return  [ev.targetTouches[0].clientX, ev.targetTouches[0].clientY];
			} else {
				return [ev.x, ev.y];
			};
		}
		
		var startDelay;
		function dragStart(ev) {
			startDelay = setTimeout(function() {
				setClass(svg, 'dial--edit', true);
				_drag.inProgress = true;
				_drag.startPoint = eventPosition(ev);
				_drag.startTemperature = self.target_temperature || options.minValue;
				_drag.lockAxis = undefined;
			},1000);
		};
		
		function dragEnd (ev) {
			clearTimeout(startDelay);
			setClass(svg, 'dial--edit', false);
			if (!_drag.inProgress) return;
			_drag.inProgress = false;
			if (self.target_temperature != _drag.startTemperature) {
				if (typeof options.onSetTargetTemperature == 'function') {
					options.onSetTargetTemperature(self.target_temperature);
				};
			};
		};
		
		function dragMove(ev) {
			ev.preventDefault();
			if (!_drag.inProgress) return;
			var evPos =  eventPosition(ev);
			var dy = _drag.startPoint[1]-evPos[1];
			var dx = evPos[0] - _drag.startPoint[0];
			var dxy;
			if (_drag.lockAxis == 'x') {
				dxy  = dx;
			} else if (_drag.lockAxis == 'y') {
				dxy = dy;
			} else if (Math.abs(dy) > properties.dragLockAxisDistance) {
				_drag.lockAxis = 'y';
				dxy = dy;
			} else if (Math.abs(dx) > properties.dragLockAxisDistance) {
				_drag.lockAxis = 'x';
				dxy = dx;
			} else {
				dxy = (Math.abs(dy) > Math.abs(dx)) ? dy : dx;
			};
			var dValue = (dxy*getSizeRatio())/(options.diameter)*properties.rangeValue;
			self.target_temperature = roundHalf(_drag.startTemperature+dValue);
		}
		
		svg.addEventListener('mousedown',dragStart);
		svg.addEventListener('touchstart',dragStart);
		
		svg.addEventListener('mouseup',dragEnd);
		svg.addEventListener('mouseleave',dragEnd);
		svg.addEventListener('touchend',dragEnd);
		
		svg.addEventListener('mousemove',dragMove);
		svg.addEventListener('touchmove',dragMove);
		//
		
		/*
		 * Helper functions
		 */
		function restrictTargetTemperature(t) {
			return restrictToRange(roundHalf(t),options.minValue,options.maxValue);
		}
		
		function angle(point) {
			var dx = point[0] - properties.radius;
			var dy = point[1] - properties.radius;
			var theta = Math.atan(dx/dy) / (Math.PI/180);
			if (point[0]>=properties.radius && point[1] < properties.radius) {
				theta = 90-theta - 90;
			} else if (point[0]>=properties.radius && point[1] >= properties.radius) {
				theta = 90-theta + 90;
			} else if (point[0]<properties.radius && point[1] >= properties.radius) {
				theta = 90-theta + 90;
			} else if (point[0]<properties.radius && point[1] < properties.radius) {
				theta = 90-theta+270;
			}
			return theta;
		};
		
		function getSizeRatio() {
			return options.diameter / targetElement.clientWidth;
		}
		
	};
})();

/* ==== */

var nest = new thermostatDial(document.getElementById('thermostat'),{
	onSetTargetTemperature: function(v) {
		document.getElementById('input_target_temperature').value = +v;
	}
});

document.getElementById('input_target_temperature').addEventListener('input',function() {
	nest.target_temperature = this.value;
});
document.getElementById('input_ambient_temperature').addEventListener('input',function() {
	nest.ambient_temperature = this.value;
});
document.getElementById('input_state').addEventListener('change',function() {
	nest.hvac_state = this.value;
});
document.getElementById('input_leaf').addEventListener('change',function() {
	nest.has_leaf = this.value;
});
document.getElementById('input_away').addEventListener('change',function() {
	nest.away = this.value;
});



/**********************************************SIDENAV******************************/
/* Set the width of the side navigation to 250px */
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}


/*VARIABLES GLOBALES*/
var global_array = ["WAKE", "LEAVE", "RETURN", "SLEEP"];
var pos_global_array = 0;
var global_hour=0;
var global_hours = [6,10,16,22];
var pos_global_hours=0;
var global_temp=0;
window.onload = function(){
	var summer =document.getElementById("Summer").onclick = change_color;
	var summer =document.getElementById("Winter").onclick = change_color;
	var summer =document.getElementById("Manual").onclick = change_color;
	var week = document.getElementById("week").onclick = color;
	
	var anterior = document.getElementById("anterior").onclick = profiles;
	var despues = document.getElementById("despues").onclick = profiles;

	var minus = document.getElementById("minus").onclick = hours; 
	var plus = document.getElementById("plus").onclick = hours;

	var minus_temp = document.getElementById("minus_temp").onclick = temp;
	var plus_temp = document.getElementById("plus_temp").onclick = temp;
}	

function change_color(){
	var name= new String(this.id);
	var value = this.value;
	var array = ["Summer", "Winter", "Manual"];
	for(x=0;x<array.length;x++){
		if(value==0){
			if(array[x] != name){
				document.getElementById(name).className = "btn btn-primary";
				document.getElementById(name).value = 1;
				document.getElementById(array[x]).disabled = true;
				document.getElementById(name+"_circ").setAttribute("fill", "#222");
				if(name=="Summer")
					nest.hvac_state = 'cooling';
				else if(name=="Winter")
					nest.hvac_state = 'heating';
					
					
			}
		}else if(value==1){
			if(array[x] != name){
				document.getElementById(name).className = "btn btn-secondary";
				document.getElementById(name).value = 0;
				document.getElementById(array[x]).disabled = false;
				document.getElementById(name+"_circ").setAttribute("fill", "white");
				nest.hvac_state = 'off';
			}
		}
	}
}
function color(){
	var val = this.value;
	if(val==0){
		document.getElementById("week").className = "btn btn-primary";
		document.getElementById("week").value = 1;
	}else{
		document.getElementById("week").className = "btn btn-secondary";
		document.getElementById("week").value = 0;
	}
}
function profiles(){
	var val = this.value;
	var hour;
	/*global_hour = parseFloat(document.getElementById("hour").value);*/
	/*pos_global_hours = pos_global_array;*/
	
	/*global_hours[pos_global_array] = global_hour;*/
	if(val == 0){
		if(pos_global_array!=0){
			pos_global_array--;
			document.getElementById("profile").innerHTML = global_array[pos_global_array];
			document.getElementById("hour").value = global_hours[pos_global_array];
			global_hour = parseFloat(document.getElementById("hour").value);
		}else{
			pos_global_array = 3;
			document.getElementById("profile").innerHTML = global_array[pos_global_array];
			document.getElementById("hour").value = global_hours[pos_global_array];
			global_hour = parseFloat(document.getElementById("hour").value);
		}
	}else if(val==1){
		if(pos_global_array!=3){
			pos_global_array++;
			document.getElementById("profile").innerHTML = global_array[pos_global_array];
			document.getElementById("hour").value = global_hours[pos_global_array];
			global_hour = parseFloat(document.getElementById("hour").value);
		}else{
			pos_global_array = 0;
			document.getElementById("profile").innerHTML = global_array[pos_global_array];
			document.getElementById("hour").value = global_hours[pos_global_array];
			global_hour = parseFloat(document.getElementById("hour").value);
		}
	}
}

function hours(){
	global_hour = parseFloat(document.getElementById("hour").value);
	if(this.value == 0){
		global_hour--;
	}else{
		global_hour++;
	}
	if(pos_global_array==0){
		if(global_hour>=0 && global_hour<global_hours[pos_global_array+1]){
			document.getElementById("hour").value = global_hour;
			global_hours[pos_global_array] = global_hour;
		}
	}else if(pos_global_array==3){
		if(global_hour<=23 && global_hour>global_hours[pos_global_array-1]){
			document.getElementById("hour").value = global_hour;
			global_hours[pos_global_array] = global_hour;
		}
	}else{
		if(global_hour>global_hours[pos_global_array-1] && global_hour<global_hours[pos_global_array+1]){
			document.getElementById("hour").value = global_hour;
			global_hours[pos_global_array]= global_hour;
		}
	}
}
function temp(){
	global_temp = parseFloat(document.getElementById("temp").value);
	if(this.value == 0){
		global_temp--;
	}else{
		global_temp++;
	}
	document.getElementById("temp").value = global_temp;
}