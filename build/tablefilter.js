// Copyright (C) 2012-2013 Steven Berry (www.sberry.me)
// Licensed: http://opensource.org/licenses/mit-license.php

(function(window, $, undefined) {
	var gid = 0;
	var idCache = [];
	var $css = $('<style type="text/css"></style>');
	$('head').first().append($css);
	var prefix = 'tf_' + document.URL + '#';
	
	$.tablefilter = {
		debuffer: 350 // Default based on avg WPM and empirical testing in IE7
	};
	
	$.fn.tablefilter = function(findSelector, args) {
		var globalSave, result;
		var targetSelector = this.selector;
		
		if (typeof args === 'undefined') {
			args = findSelector;
			findSelector = 'tbody tr';
		}
		
		if (typeof args === 'undefined') {
			return this;
		}
		
		globalSave = (typeof args['save'] === 'boolean' && !!window.localStorage) ? args['save'] : false;		
		
		result = this.filter('table').each(function(i, table) {
			var $noelements;
			
			table.tf = table.tf || {};
			if (typeof table.tf.noelements === 'undefined') {
				$noelements = $('<div class="tf-noelements">No items found.</div>');
				$(table).after($noelements);
				table.tf.noelements = $noelements[0];
			}
		});
		
		for (var selector in args['filters']) {
			$(selector).each(function(i, el) {
				var
					// References
					filter, defaultMethodKey,
					// Control Parameters
					event, checkColumns, reverse, save, applyClass, matchAttr,
					// Worker Functions
					filterMethod, getMatchAttr, onMatch, onNoMatch, saveMethod, getRemoveCondition,
					// Callback Functions
					action, callback, timeout;
				
				if (typeof el.tfid === 'undefined') {
					el.tfid = ++gid;
					idCache.push(el.tfid);
				}
				
				filter = args.filters[selector];
				
				event = filter.event;
				checkColumns = makeArray(filter.columns);
				reverse = getDefault(filter.reverse, typeof filter.apply === 'undefined');
				//save = getDefault(filter.save, globalSave);
				applyClass = filter.apply || ('tf-autogen-hide-' + el.tfid);
				matchAttr = filter.attribute || 'text';
				
				defaultMethodKey = (checkColumns.length > 0) ? 'cellMatch' : 'rowMatch';
				filterMethod = filterMethods[filter.method] || filterMethods[defaultMethodKey];
				
				if (typeof filter.match !== 'undefined') {
					getMatchAttr = function() {
						return filter.match;
					};
				}
				else {
					getMatchAttr = function() {
						return $(this).val();
					};
				}
				
				if (el.type === 'checkbox') {
					onMatch = addClass;
					onNoMatch = removeClass;
					getRemoveCondition = function() {
						return reverse ? this.checked : !this.checked;
					};
				}
				else {
					onMatch = reverse ? removeClass : addClass;
					onNoMatch = reverse ? addClass : removeClass;
					getRemoveCondition = function() {
						return $(this).val().length == 0;
					};
				}
				
				action = function(e) {
					var start = new Date();
					
					var $tableSet = $(targetSelector).filter('table');
					
					if (getRemoveCondition.call(this)) {
						$tableSet.find('tbody tr').removeClass(applyClass);
					}
					else {
						var value = getMatchAttr.call(this);
						filterMethod.call($tableSet, findSelector, value, matchAttr, checkColumns, applyClass, onMatch, onNoMatch);
					}
					
					//saveMethod.call(this);
					$tableSet.each(function(i, table) {
						if (table.tf.noelements !== 'undefined') {
							$(table.tf.noelements).css('display', $(table).find(findSelector).filter(':visible').length > 0 ? 'none' : 'block');
						}
						
						$(table).trigger('filterend');
					});
					
					console.log((new Date() - start) + 'ms');
				};
				
				if ($.inArray(event, ['keyup', 'keydown']) >= 0) {
					callback = function(e) {
						var that = this;
						clearTimeout(timeout);
						timeout = setTimeout(function() {
							action.call(that, e);
						}, $.tablefilter.debuffer);
					};
				}
				else {
					callback = action;
				}
				
				$(el).bind(event, callback);
				$(el).trigger(event);
			});
		}
		
		buildCss();
		
		return result;
	};
	
	$.fn.extend({
		tfmeta: function(name) {
			if (typeof name === 'undefined') {
				return this.text();
			}
			
			switch (name) {
				case 'text':
					return this.text();
				default:
					return this.attr(name);
			}
		}
	});
	
	var filterMethods = {
		search: function(findSelector, value, matchAttr, checkColumns, applyClass, onMatch, onNoMatch) {
			var text;
			var tokens = tokenize(value);
			
			$(this).find(findSelector).each(function(i, el) {
				(function() {
					for (var j = 0; j < tokens.length; j++) {
						text = $(el).tfmeta(matchAttr);
						if (!contains(text, tokens[j], 'i')) {
							onNoMatch.call(el, applyClass);
							return;
						}
					}
					onMatch.call(el, applyClass);
				})();
			});
		},
		
		rowMatch: function(findSelector, value, matchAttr, checkColumns, applyClass, onMatch, onNoMatch) {
			var text;
			
			$(this).find(findSelector).each(function(i, el) {
				text = $(el).tfmeta(matchAttr);
				if (equals(text, value)) {
					onMatch.call(el, applyClass);
				}
				else {
					onNoMatch.call(el, applyClass);
				}
			});
		},
		
		cellMatch: function(findSelector, value, matchAttr, checkColumns, applyClass, onMatch, onNoMatch) {
			var text, $cells;
			
			$(this).find(findSelector).each(function(i, el) {
				$cells = $(el).children('td');
				(function() {
					for (var j = 0; j < checkColumns.length; j++) {
						text = $cells.eq(checkColumns[j]).tfmeta(matchAttr);						
						if (equals(text, value)) {
							onMatch.call(el, applyClass);
							return;
						}
					}
					onNoMatch.call(el, applyClass);
				})();
			});
		}
	};
	
	var
		getDefault = function(val, def) {
			return (typeof val === 'undefined') ? def : val;
		},
		
		buildCss = function() {
			var cssText = '';
			for (var i = 0; i < idCache.length; i++) {
				cssText += '.tf-autogen-hide-' + idCache[i] + '{display: none;} ';
			}
				
			try { $css.html($.trim(cssText)); }
			catch (ex) { $css[0].styleSheet.cssText = $.trim(cssText); }
		},
		
		tokenize = function(val) {
			var tokens = val.match(/\w+|"[^"]+"/g) || [''];
			for (var i = 0; i < tokens.length; i++) {
				tokens[i] = tokens[i].replace(/"/g, '');
			}
			
			return tokens;
		},
		
		makeArray = function(val) {
			if (typeof val === 'undefined') {
				return [];
			}
			
			return $.isArray(val) ? val : [val];
		},
		
		addClass = function(name) {
			$(this).addClass(name);
		},
		
		removeClass = function(name) {
			$(this).removeClass(name);
		},
		
		contains = function(val1, val2, flags) {
			if (typeof val1 === 'undefined' || typeof val2 === 'undefined') {
				return false;
			}
			
			val1 = val1.toString().toLowerCase();
			val2 = val2.toString().toLowerCase();
		
			return val1.indexOf(val2) >= 0;
		},
		
		equals = function(val1, val2, flags) {
			if (typeof val1 === 'undefined' || typeof val2 === 'undefined') {
				return false;
			}
			
			val1 = val1.toString().toLowerCase();
			val2 = val2.toString().toLowerCase();
			
			return val1 === val2;
		},
		
		storeValue = function() {			
			if (typeof this.id !== 'undefined') {
				var key = prefix + this.id;
				
				try {
					window.localStorage[key] = (this.type === 'checkbox') ? this.checked : this.value;
				}
				catch(ex) { }
			}
		},

		loadValue = function() {
			if (typeof this.id !== 'undefined') {
				var key = prefix + this.id;
				
				if (typeof window.localStorage[key] !== 'undefined') {
					if (this.type === 'checkbox') {
						this.checked = window.localStorage[key] === 'true';
					}
					else {
						this.value = window.localStorage[key];
					}
				}
			}
		},
		
		loadState = function(selector) {
			$(selector).each(function(i, el) {
				loadValue.call(el);
			});
		};
})(window, jQuery);