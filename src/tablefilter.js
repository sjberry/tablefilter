/**
 * @license
 * Copyright (C) 2013 Steven Berry (http://www.sberry.me/tablefilter)
 * Licensed: MIT (http://opensource.org/licenses/mit-license.php)
 * License Stipulations:
 *     1) Retain this comment block.
 *     2) Send me an email if you use this and have questions/comments!
 *
 * Steven Berry
 * www.sberry.me
 * steven@sberry.me
 */
(function(root, factory) {
	if (typeof module === 'object' && module && typeof module.exports === 'object') {
		factory.call(root,
			require('jquery')
		);
	}
	else if (typeof define === 'function' && define.amd) {
		define(['jquery'], function() {
			return factory.apply(root, arguments);
		});
	}
	else {
		factory.call(root, root.jQuery);
	}
})(this, function($, undefined) {
	'use strict';

	var window = this;
	var gid = 0;
	var idCache = [];
	var prefix = 'tf_' + document.URL + '#';

	var $css = $('<style type="text/css"></style>');
	$('head').first().append($css);

	var filterMethods = {
		/**
		 * Placeholder.
		 *
		 * @param el
		 * @param selector
		 * @param value
		 * @param attribute
		 * @param columns
		 * @param apply
		 * @param onMatch
		 * @param onNoMatch
		 */
		search: function Filter$search(el, selector, value, attribute, columns, apply, onMatch, onNoMatch) {
			var tokens;

			tokens = _tokenize(value);

			$(el).find(selector).each(function(i, el) {
				var j, text, matches;

				for (j = 0; j < tokens.length; j++) {
					text = _meta(el, attribute);

					if (!_contains(text, tokens[j], 'i')) {
						matches = false;
						break;
					}
				}

				if (matches === false) {
					onNoMatch(el, apply);
				}
				else {
					onMatch(el, apply);
				}
			});
		},

		/**
		 * Placeholder.
		 *
		 * @param el
		 * @param selector
		 * @param value
		 * @param attribute
		 * @param columns
		 * @param apply
		 * @param onMatch
		 * @param onNoMatch
		 */
		rowMatch: function Filter$rowMatch(el, selector, value, attribute, columns, apply, onMatch, onNoMatch) {
			var text;

			$(el).find(selector).each(function(i, el) {
				text = _meta(el, attribute);

				if (_equals(text, value)) {
					onMatch(el, apply);
				}
				else {
					onNoMatch(el, apply);
				}
			});
		},

		/**
		 * Placeholder.
		 *
		 * @param el
		 * @param selector
		 * @param value
		 * @param attribute
		 * @param columns
		 * @param apply
		 * @param onMatch
		 * @param onNoMatch
		 */
		cellMatch: function Filter$cellMatch(el, selector, value, attribute, columns, apply, onMatch, onNoMatch) {
			var text;

			$(el).find(selector).each(function(i, el) {
				var j, matches, $cells;

				$cells = $(el).children('td');

				for (j = 0; j < columns.length; j++) {
					text = _meta($cells.eq(columns[j]), attribute);

					if (_equals(text, value)) {
						matches = true;
						break;
					}
				}

				if (matches === true) {
					onMatch(el, apply);
				}
				else {
					onNoMatch(el, apply);
				}
			});
		}
	};


	/**
	 * Placeholder.
	 *
	 * @param el
	 * @param name
	 * @private
	 */
	function _addClass(el, name) {
		$(el).addClass(name);
	}


	/**
	 * Placeholder.
	 *
	 * @private
	 */
	function _buildCss() {
		var i, cssText;

		cssText = '';

		for (i = 0; i < idCache.length; i++) {
			cssText += '.tf-autogen-hide-' + idCache[i] + '{display: none;} ';
		}

		try {
			$css.html($.trim(cssText));
		}
		catch (ex) {
			$css[0].styleSheet.cssText = $.trim(cssText);
		}
	}


	/**
	 * Placeholder.
	 *
	 * @param val1
	 * @param val2
	 * @param [flags]
	 * @returns {boolean}
	 * @private
	 */
	function _contains(val1, val2, flags) {
		if (typeof val1 === 'undefined' || typeof val2 === 'undefined') {
			return false;
		}

		val1 = val1.toString().toLowerCase();
		val2 = val2.toString().toLowerCase();

		return val1.indexOf(val2) >= 0;
	}


	/**
	 * Placeholder.
	 *
	 * @param {Function} fn
	 * @param {Number} delay
	 * @private
	 */
	function _debounce(fn, delay) {
		var timeout;

		return function() {
			var args, that;

			args = arguments;
			that = this;

			clearTimeout(timeout);

			timeout = setTimeout(function() {
				fn.apply(that, args);
			}, delay);
		};
	}


	/**
	 * Placeholder.
	 *
	 * @param val1
	 * @param val2
	 * @param [flags]
	 * @returns {boolean}
	 * @private
	 */
	function _equals(val1, val2, flags) {
		if (typeof val1 === 'undefined' || typeof val2 === 'undefined') {
			return false;
		}

		val1 = val1.toString().toLowerCase();
		val2 = val2.toString().toLowerCase();

		return val1 === val2;
	}


	/**
	 * Placeholder.
	 *
	 * @param val
	 * @param def
	 * @returns {*}
	 * @private
	 */
	function _getDefault(val, def) {
		return (typeof val === 'undefined') ? def : val;
	}


	/**
	 * Placeholder.
	 *
	 * @private
	 */
	function _loadValue() {
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
	}


	/**
	 * Placeholder.
	 *
	 * @param selector
	 * @private
	 */
	function _loadState(selector) {
		$(selector).each(function(i, el) {
			_loadValue.call(el);
		});
	}


	/**
	 * Placeholder.
	 *
	 * @param val
	 * @returns {*}
	 * @private
	 */
	function _makeArray(val) {
		if (typeof val === 'undefined') {
			return [];
		}

		return $.isArray(val) ? val : [val];
	}


	/**
	 * Placeholder.
	 *
	 * @private
	 * @param el
	 * @param name
	 * @returns {*}
	 */
	function _meta(el, name) {
		var $el = $(el);

		name += '';

		switch (name) {
			case 'undefined':
				return $el.text();
			case 'value':
				return $el.val();
			case 'text':
				return $el.text();
			default:
				return $el.attr(name);
		}
	}


	/**
	 * Placeholder.
	 *
	 * @param el
	 * @param name
	 * @private
	 */
	function _removeClass(el, name) {
		$(el).removeClass(name);
	}


	/**
	 * Placeholder.
	 *
	 * @private
	 */
	function _storeValue() {
		if (typeof this.id !== 'undefined') {
			var key = prefix + this.id;

			try {
				window.localStorage[key] = (this.type === 'checkbox') ? this.checked : this.value;
			}
			catch(ex) { }
		}
	}


	/**
	 * Placeholder.
	 *
	 * @param val
	 * @returns {Array}
	 * @private
	 */
	function _tokenize(val) {
		var i, tokens;

		tokens = val.match(/\w+|"[^"]+"/g) || [''];

		for (i = 0; i < tokens.length; i++) {
			tokens[i] = tokens[i].replace(/"/g, '');
		}

		return tokens;
	}


	$.fn.tablefilter = function jQuery$tablefilter(findSelector, args) {
		var globalSave, $tableSet;

		if (typeof args === 'undefined') {
			args = findSelector;
			findSelector = 'tbody tr';
		}

		if (typeof args === 'undefined') {
			return this;
		}

		//globalSave = (typeof args['save'] === 'boolean' && !!window.localStorage) ? args['save'] : false;

		$tableSet = this.filter('table').each(function(i, table) {
			var $noelements;

			table.tf = table.tf || {};

			if (typeof table.tf.noelements === 'undefined') {
				$noelements = $('<div class="tf-noelements">No items found.</div>');
				$(table).after($noelements);
				table.tf.noelements = $noelements[0];
			}
		});

		$.each(args.filters, function(selector, filter) {
			var attribute, columns, event, match, method, reverse, save;

			attribute = filter.attribute;
			columns = _makeArray(filter.columns);
			event = filter.event;
			match = filter.match;
			method = filterMethods[filter.method] || filterMethods[(columns.length > 0) ? 'cellMatch' : 'rowMatch'];
			reverse = _getDefault(filter.reverse, typeof filter.apply === 'undefined');
			//save = _getDefault(filter.save, globalSave);

			$(selector).each(function(i, el) {
				var apply, callback, getMatchValue, getRemoveCondition, onMatch, onNoMatch;

				if (typeof el.tfid === 'undefined') {
					el.tfid = ++gid;
					idCache.push(el.tfid);
				}

				apply = filter.apply || ('tf-autogen-hide-' + el.tfid);

				if (typeof match === 'undefined') {
					getMatchValue = function(el) {
						return $(el).val();
					};
				}
				else {
					getMatchValue = function() {
						return match;
					};
				}

				if (el.type === 'checkbox') {
					onMatch = _addClass;
					onNoMatch = _removeClass;
					getRemoveCondition = function(el) {
						return reverse ? el.checked : !el.checked;
					};
				}
				else {
					onMatch = reverse ? _removeClass : _addClass;
					onNoMatch = reverse ? _addClass : _removeClass;
					getRemoveCondition = function(el) {
						return $(el).val().length === 0;
					};
				}

				callback = function() {
					var value;

					if (getRemoveCondition(this)) {
						$tableSet.find('tbody tr').removeClass(apply);
					}
					else {
						value = getMatchValue(this);
						method($tableSet, findSelector, value, attribute, columns, apply, onMatch, onNoMatch);
					}

					//saveMethod.call(this);
					$tableSet.each(function(i, table) {
						if (table.tf.noelements !== 'undefined') {
							$(table.tf.noelements).css('display', $(table).find(findSelector).filter(':visible').length > 0 ? 'none' : 'block');
						}

						$(table).trigger('filterend');
					});
				};

				if (event === 'keyup' || event === 'keydown') {
					callback = _debounce(callback, $.tablefilter.debounce);
				}

				$(el).on(event, callback);

				// Trigger the event the input listens to so that the table is filtered reflecting the current state of the input.
				$(el).trigger(event);
			});
		});

		_buildCss();

		return $tableSet;
	};

	$.tablefilter = {
		debounce: 350 // Default based on avg WPM and empirical testing in IE7
	};
});
