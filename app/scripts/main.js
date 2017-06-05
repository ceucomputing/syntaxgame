// Syntax Error Game

// 2017-96-05: Implemented basic UI
// 2017-06-02: Implemented syntax error generation and basic game
// 2017-06-01: Implemented custom tokenizer

// ================================================================================
// TOKENIZER
// ================================================================================

// Custom tokenizer for Python code.
var Tokenizer = function(source) {
  this.source = source;
  this.tail = source;
}

Tokenizer.prototype.nextToken = function() {
  if (this.tail.length === 0) return null;
  var index;
  if (this.tail.charAt(0) === '\n') {
    // Case 1: Newlines are atomic tokens
    index = 1;
  } else if (this.tail.charAt(0).match(/\w/)) {
    // Case 2: Words are atomic tokens
    index = 0;
    while (this.tail.charAt(index).match(/\w/)) {
      ++index;
    }
  } else  {
    // Case 3: Otherwise, coalesce repeated characters into tokens
    index = 0;
    while (this.tail.charAt(index) === this.tail.charAt(0)) {
      ++index;
    }
  }
  var token = this.tail.slice(0, index);
  this.tail = this.tail.slice(index);
  return token;
}

Tokenizer.prototype.toTokens = function() {
  var result = [];
  var token = this.nextToken();
  while (token) {
    result.push(token);
    token = this.nextToken();
  }
  return result;
}

// ================================================================================
// GENERATOR
// ================================================================================

var Generator = function() {
  var STRLIST = [
    ['names', 'names = [\'Siti\', \'Alex\', \'Bala\''],
    ['places', 'places = [\'Home\', \'School\'']
  ];
  var LIST = [
    ['names', 'names = [\'Siti\', \'Alex\', \'Bala\''],
    ['places', 'places = [\'Home\', \'School\'']
  ];
}

// ================================================================================
// GAME
// ================================================================================

// Encapsulates game state and functionality.
var Game = function() {
  // Constants
  this.CORRECT = 10;
  this.WRONG = -5;
  // TODO: Level and time limit progression constants

  // Source-related state
  this.lines = [];
  this.correctionsByLine = [];
  this.sourceElement = $('#source');

  // Game-related state
  this.score = 0;
  this.scoreElement = $('#score');

  this.level = 0;
  this.levelElement = $('#level');

  this.timer = null;
  this.timeLeft = 0;
  this.timeElement = $('#timeleft');

  this.errorsTotal = 0;
  this.errorsFound = 0;
  this.errorsFoundElement = $('#errorsfound');
  this.errorsLeftElement = $('#errorsleft');
}

Game.prototype.start = function() {
  this.setScore(0);
  this.setLevel(0);
  this.nextLevel();
}

Game.prototype.clickHandler = function(line, index, element) {
  // Only handle click if timer is active
  if (this.timer === null) return;
  var that = this;
  var prompt = bootbox.prompt({
    title: 'What do you think this should be?',
    value: element.text(),
    callback: function(result) {
      if (result === null) return;
      result = result.trim();
      if (result === element.text().trim()) {
        // No change in answer, so treat as cancel
        return;
      }
      var corrections = that.correctionsByLine[line];
      for (var i = 0; i < corrections.length; ++i) {
        var correction = corrections[i];
        if (index === correction[0] && result === correction[1].trim()) {
          // Correct answer given, so increase score and disable alternative options
          that.correctionsByLine[line] = [];
          element.text(correction[1]);
          element.addClass('correct');
          element.off('click');
          that.incrementScore(that.CORRECT);
          that.incrementErrorsFound();
          return;
        }
      }
      // Incorrect answer given, so reduce score and ask again
      that.incrementScore(that.WRONG);
      that.clickHandler(line, index, element);
    }
  });
  prompt.init(function() {
    $('.bootbox-input').select();
  });
}

Game.prototype.setSource = function(source) {
  var that = this;

  // Obtain errorified source and candidate corrections
  var tokenizer = new Tokenizer(source);
  this.lines = splitArray(tokenizer.toTokens(), '\n');
  this.correctionsByLine = [];
  var errorLines = [];
  for (var i = 0; i < this.lines.length; ++i) {
    // Insert empty entry into correctionsByLine
    this.correctionsByLine.push([]);
    // Clone this.lines into errorLines
    errorLines.push(this.lines[i].slice());
  }
  var candidates = [];
  for (var i = 0; i < errorLines.length; ++i) {
    var corrections = errorify(errorLines[i]);
    if (corrections.length > 0) {
      candidates.push([i, corrections]);
    }
  }

  // Limit number of errors to this.errorsTotal
  if (candidates.length <= this.errorsTotal) {
    this.setErrorsTotal(candidates.length);
  }
  for (var i = 0; i < this.errorsTotal; ++i) {
    // Choose random candidate
    var random = i + Math.floor(Math.random() * (candidates.length - i));
    // Swap with index i so that remaining candidates have equal probability of being chosen
    var temp = candidates[i];
    candidates[i] = candidates[random];
    candidates[random] = temp;
    // Process chosen candidate immediately
    var chosen = candidates[i];
    this.lines[chosen[0]] = errorLines[chosen[0]];
    this.correctionsByLine[chosen[0]] = chosen[1];
  }

  // Create DOM elements and attach events
  this.sourceElement.html('');
  for (var i = 0; i < this.lines.length; ++i) {
    var line = this.lines[i];
    for (var j = 0; j < line.length; ++j) {
      var token = line[j];
      if (token.match(/\s/)) {
        this.sourceElement.append(document.createTextNode(token));
      } else {
        var element = $('<a>', {
          href: '#',
          text: token,
          click: function() {
            var localLine = i;
            var localIndex = j;
            return function(event) {
              that.clickHandler(localLine, localIndex, $(event.target));
              return false;
            }
          }()
        });
        var corrections = this.correctionsByLine[i];
        // TODO: Make more efficient.
        for (var k = 0; k < corrections.length; ++k) {
          var correction = corrections[k];
          if (j == correction[0]) {
            correction.push(element);
            break;
          }
        }
        this.sourceElement.append(element);
      }
    }
  }
}

Game.prototype.setScore = function(score) {
  this.score = score;
  this.scoreElement.text(score);
}

Game.prototype.incrementScore = function(increment) {
  this.setScore(this.score + increment);
}

Game.prototype.clearTimer = function(timeLeft) {
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
  this.sourceElement.addClass('disabled');
}

Game.prototype.setTimer = function(timeLeft) {
  this.clearTimer();
  this.setTimeLeft(timeLeft);
  this.timer = setInterval(this.handleTick.bind(this), 1000);
  this.sourceElement.removeClass('disabled');
}

Game.prototype.setTimeLeft = function(timeLeft) {
  this.timeLeft = timeLeft;
  var min = Math.floor(timeLeft / 60);
  var sec = timeLeft % 60;
  min = (min < 10) ? ('0' + min) : min.toString();
  sec = (sec < 10) ? ('0' + sec) : sec.toString();
  this.timeElement.text(min + ':' + sec);
}

Game.prototype.handleTick = function() {
  this.setTimeLeft(this.timeLeft - 1);
  if (this.timeLeft == 0) {
    // TODO: complete handling of time's up
    this.clearTimer();
    bootbox.hideAll();
    bootbox.alert('Game over! Your final score is: ' + this.score);
    // Highlight all remaining corrections
    for (var i = 0; i < this.correctionsByLine.length; ++i) {
      var corrections = this.correctionsByLine[i];
      if (corrections.length > 0) {
        var correction = corrections[0];
        correction[2].addClass('wrong');
      }
    }
  }
}

Game.prototype.setErrorsTotal = function(errorsTotal) {
  this.errorsTotal = errorsTotal;
  this.errorsLeftElement.text(this.errorsTotal - this.errorsFound);
}

Game.prototype.setErrorsFound = function(errorsFound) {
  this.errorsFound = errorsFound;
  this.errorsFoundElement.text(this.errorsFound);
  this.errorsLeftElement.text(this.errorsTotal - this.errorsFound);
}

Game.prototype.setLevel = function(level) {
  this.level = level;
  this.levelElement.text(level);
}

Game.prototype.incrementErrorsFound = function() {
  this.setErrorsFound(this.errorsFound + 1);
  if (this.errorsFound == this.errorsTotal) {
    // Proceed to next level
    this.nextLevel();
  }
}

Game.prototype.nextLevel = function() {
  this.setLevel(this.level + 1);

  // TODO: adapt according to level
  this.setErrorsTotal(5);
  this.setErrorsFound(0);

  // TODO: Create proper generator
  var source = $("#entry-template").html();
  var template = Handlebars.compile(source);
  var source = template({ x: 'example', 'value': 'my_list' });
  this.setSource(source);

  // TODO: adapt according to level
  this.setTimer(60);
}

// ================================================================================
// UTILITIES
// ================================================================================

// Given an array of tokens for one line of Python code, randomly inserts an correctable syntax error.
// Modifies array of tokens in-place and returns array of valid corrections.
var errorify = function(line) {
  // Each candidate error is an array of:
  // [0]: Corrected code
  // [1]: Array of possible starting indices
  // [2]: Number of tokens from starting index to replace
  // [3]: Array of possible replacements
  var candidates = [];

  var inStringLiteral = false;
  var delimiter;
  var delimiterIndex;

  var previousNonSpaceToken = null;
  var previousNonSpaceIndex;

  for (var index = 0; index < line.length; ++index) {
    var token = line[index];
    if (token.match(/\s+/)) {
      // Ignore whitespace
      continue;
    }
    if (!inStringLiteral && token === '#') {
      // Remainder of line is a comment, so break
      break;
    }

    // Type 1: Detect quotes
    if (token === '\'' || token === '"') {
      if (inStringLiteral && token === delimiter) {
        if (index - 1 >= 0 && line[index - 1].endsWith('\\')) {
          // Quote is escaped, so ignore
          continue;
        }
        // End of string literal
        inStringLiteral = false;
        candidates.push([token, [delimiterIndex, index], 1, [token === '\'' ? '"' : '\'']]);
      } else {
        // Start of string literal
        inStringLiteral = true;
        delimiter = token;
        delimiterIndex = index;
      }
    }

    // Ignore all non-quote tokens in string literals
    if (inStringLiteral) {
      continue;
    }

    switch (token) {
      // Type 2: Detect end-of-line colons
      case ':':
        var valid = true;
        for (var i = index + 1; i < line.length; ++i) {
          if (!line[i].match(/\s+/)) {
            valid = false;
            break;
          }
        }
        if (valid && previousNonSpaceToken !== null) {
          var fullToken = previousNonSpaceToken + token;
          candidates.push([fullToken, [previousNonSpaceIndex], index - previousNonSpaceIndex + 1, [previousNonSpaceToken]]);
        }
        candidates.push([token, [index], 1, [';']]);
        break;

      // Type 3: Detect keywords
      case 'True':
        candidates.push([token, [index], 1, ['true', 'TRUE']]);
        break;
      case 'False':
        candidates.push([token, [index], 1, ['false', 'FALSE']]);
        break;
      case 'None':
        candidates.push([token, [index], 1, ['none', 'NONE', 'nil']]);
        break;
      case 'while':
        candidates.push([token, [index], 1, ['when', 'where', 'which']]);
        break;
      case 'for':
        candidates.push([token, [index], 1, ['four', 'fur']]);
        break;
      case 'if':
        candidates.push([token, [index], 1, ['in', 'is', 'of']]);
        break;
      case 'in':
        candidates.push([token, [index], 1, ['of', 'on', 'if']]);
        break;
      case 'and':
        candidates.push([token, [index], 1, ['&&']]);
        break;
      case 'or':
        candidates.push([token, [index], 1, ['||']]);
        break;
      case 'not':
        var fullToken = token;
        var extend = index + 1 < line.length && line[index + 1].match(/\s+/);
        if (extend) {
          fullToken += line[index + 1];
        }
        candidates.push([fullToken, [index], extend ? 2 : 1, ['!']]);
        break;

      // Type 4: Detect operators
      case '%':
        candidates.push([token, [index], 1, ['%%', 'mod']]);
        break;
      case '==':
        candidates.push([token, [index], 1, ['=']]);
        break;
      case '+':
        candidates.push([token, [index], 1, ['++']]);
        break;
      case ',':
        candidates.push([token, [index], 1, ['.', ';']]);
        break;
      case '.':
        candidates.push([token, [index], 1, [',']]);
        break;
      case '-':
        candidates.push([token, [index], 1, ['--']]);
        break;
      case '!':
        if (index + 1 < line.length && line[index + 1] === '=') {
          candidates.push(['!=', [index], 2, ['<>', '!==']]);
        }
        break;
    }

    // Type 5: Detect brackets
    if (token.charAt(0).match(/\(|\)|\[|\]/)) {
      var complement;
      switch (token.charAt(0)) {
        case '(':
          complement = '[';
          break;
        case ')':
          complement = ']';
          break;
        case '[':
          complement = '(';
          break;
        case ']':
          complement = ')';
          break;
      }
      var options = [complement + token.slice(1)];
      if (token.length > 1) {
        options.push(token.slice(1) + complement);
        options.push(token.slice(1));
      }
      candidates.push([token, [index], 1, options]);
    }

    // Update previous non-space, non-literal token
    previousNonSpaceToken = token;
    previousNonSpaceIndex = index;
  }

  if (candidates.length === 0) {
    return [];
  }

  // Randomly choose an error
  var error = candidates[Math.floor(Math.random() * candidates.length)];
  var errorIndex = error[1][Math.floor(Math.random() * error[1].length)];
  var errorToken = error[3][Math.floor(Math.random() * error[3].length)];
  line.splice(errorIndex, error[2], errorToken);
  var corrections = [[errorIndex, error[0]]];
  if (error[1].length > 1) {
    for (var i = 0; i < error[1].length; ++i) {
      if (error[1][i] != errorIndex) {
        corrections.push([error[1][i], errorToken]);
      }
    }
  }
  return corrections;
}

// Given a separator, splits given array into array of sub-arrays.
var splitArray = function(array, separator) {
  var result = [];
  var current = [];
  for (var index = 0; index < array.length; ++index) {
    var item = array[index];
    current.push(item);
    if (item === separator) {
      result.push(current);
      current = [];
    }
  }
  result.push(current);
  return result;
}

// ================================================================================
// GLOBALS
// ================================================================================

// Global game object.
var game;

$(document).ready(function() {
  game = new Game();
  game.start();

  $('#main').on('click', function() {
    game.start();
  });
});

// var source   = $("#entry-template").html();
// var template = Handlebars.compile(source);

// var context = {title: "My New Post", body: "This is my first post!"};
// var html    = template(context);

// console.log(html);
// $('#output').html(html);
