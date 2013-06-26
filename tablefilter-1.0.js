// Copyright (C) 2012 Steven Berry (tablefilter.sberry.me)
// Licensed: http://opensource.org/licenses/mit-license.php

(function($, undefined) {
	var gid = 0;
	var idCache = [];
	var $css = $('<style id="tf-css" type="text/css"></style>');
	$('head').first().append($css);
	var prefix = 'tf_' + document.URL + '#';
	
	$.fn.tablefilter = function(args) {
		if (typeof args === 'undefined') {
			args = {
				save: false,
				filters: {}
			};
		}
		var globalSave = (typeof args['save'] !== 'undefined' && !!window.localStorage) ? args['save'] : false;
		
		return this.each(function(i, table) {
			var style, filter, method, columns, reverse, $noelements, match, nomatch, save, saveMethod;
			
			if (table.nodeName !== 'TABLE') {
				return false;
			}
			
			table.tf = table.tf || {};
			if (typeof table.tf.noelements === 'undefined') {
				$noelements = $('<div class="tf-noelements">No items found.</div>');
				$(table).after($noelements);
				table.tf.noelements = $noelements[0];
			}
			
			for (var selector in args['filters']) {
				filter = args.filters[selector];
				columns = fn.makeArray(filter.columns);
				if (typeof filterMethods[filter.method] !== 'undefined') {
					method = filterMethods[filter.method];
				}
				else {
					method = (columns.length > 0) ? filterMethods['cellSearch'] : filterMethods['rowSearch'];
				}
				reverse = fn.getDefault(filter.reverse, typeof filter.apply === 'undefined');
				match = reverse ? fn.removeClass : fn.addClass;
				nomatch = reverse ? fn.addClass : fn.removeClass;
				//save = fn.getDefault(filter.save, globalSave);
				//saveMethod = save ? fn.storeValue : $.noop;
				
				(function(selector, event, table, columns, attribute, apply, method, match, nomatch) {
					var callback = function(e) {
						apply = apply || ('hide-' + this.tfid)
						
						if (this.type !== 'checkbox' && $(this).val().length == 0) {
							$(table).find('tbody tr').removeClass(apply);
						}
						else {
							method.call(table, this, match, nomatch, apply, attribute, columns);
						}
						
						//saveMethod.call(this);
						$(table.tf.noelements).css('display', $(table).find('tbody tr:visible').length > 0 ? 'none' : 'block');
						$(table).trigger('filterend');
					};
					
					$(selector).each(function(i, el) {
						if (!el.tfid) {
							el.tfid = ++gid;
							idCache.push(el.tfid);
						}
						$(el).bind(event, callback);
					});
				})(selector, filter.event, table, columns, filter.attribute || 'text', filter.apply, method, match, nomatch);
				
				style = '';
				for (var i = 0; i < idCache.length; i++) {
					style += '.hide-' + idCache[i] + '{display: none;} ';
				}
				try {
					$css.html($.trim(style));
				}
				catch (ex) {
					$css[0].styleSheet.cssText = $.trim(style);
				}
				
				
				/*if (save) {
					$(selector).each(function(i, el) {
						fn.loadValue.call(el, filter.event);
					});
				}*/
			}
		});
	};
	
	$.fn.extend({
		tfmeta: function(name) {
			switch (name) {
				case 'text':
					return this.text();
				default:
					return this.attr(name);
			}
		}
	});
	
	var filterMethods = {
		rowSearch: function(filter, match, nomatch, apply, attribute) {
			var text;
			var tokens = fn.tokenize($(filter).val());
			
			$(this).find('tbody tr').each(function(i, el) {
				(function() {
					for (var j = 0; j < tokens.length; j++) {
						text = $(el).tfmeta(attribute);
						if (!fn.contains.call(text, tokens[j], 'i')) {
							nomatch.call(el, apply);
							return;
						}
					}
					match.call(el, apply);
				})();
			});
		},
		
		cellSearch: function(filter, match, nomatch, apply, attribute, columns) {
			var text, $cells;
			var value = $(filter).val();
			
			$(this).find('tbody tr').each(function(i, el) {
				$cells = $(el).children('td');
				(function() {
					for (var j = 0; j < columns.length; j++) {
						text = $cells.eq(columns[j]).tfmeta(attribute);						
						if (fn.equals.call(text, value)) {
							match.call(el, apply);
							return;
						}
					}
					nomatch.call(el, apply);
				})();
			});
		},
		
		reset: function() {
			console.log(this);
			try {
				localStorage.clear();
			}
			catch (ex) { }
			
			//window.location.reload();
		}
	};
	
	var fn = {
		getDefault: function(val, def) {
			return (typeof val === 'undefined') ? def : val;
		},
		
		tokenize: function(val) {
			var tokens = val.match(/\w+|"[^"]+"/g) || [''];
			for (var i = 0; i < tokens.length; i++) {
				tokens[i] = tokens[i].replace(/"/g, '');
			}
			
			return tokens;
		},
		
		makeArray: function(val) {
			if (typeof val === 'undefined') {
				return [];
			}
			
			return $.isArray(val) ? val : [val];
		},
	
		addClass: function(name) {
			$(this).addClass(name);
		},
		
		removeClass: function(name) {
			$(this).removeClass(name);
		},
		
		contains: function(text, flags) {
			var pattern = (text.indexOf(' ') < 0) ? text :
				text.replace(/(\S+)/g, function(word) {
					return '\\b' + word + '\\b';
				});
			var re = new RegExp(pattern, flags);
			return re.test(this);
		},
		
		equals: function(text, flags) {
			var re = new RegExp('^' + text + '$', flags);
			return re.test(this);
		},
		
		storeValue: function() {			
			if (!!this.id) {
				var key = prefix + this.id;
				
				try {
					localStorage[key] = (this.type === 'checkbox') ? this.checked : this.value;
				}
				catch(ex) { }
			}
		},

		loadValue: function(event) {
			if (!!this.id) {
				var key = prefix + this.id;
				
				if (this.type === 'checkbox') {
					this.checked = localStorage[key] ? (localStorage[key] == 'true') : this.checked;
				}
				else {
					this.value = localStorage[key] ? localStorage[key] : this.value;
				}
			
				$(this).trigger(event);
			}
		}
	};
})(jQuery);