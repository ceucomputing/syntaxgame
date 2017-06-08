// Syntax Error Game

// 2017-06-08: Added sound effects and music
// 2017-06-06: Implemented basic generator
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
    ,
    ['places', 'places = [\'Home\', \'School\']']
  ];
  var LIST = [
    ['names', 'names = [\'Siti\', \'Alex\', \'Bala\']'],
    ['places', 'places = [\'Home\', \'School\']']
  ];

  this.complexity = 0;
}

Generator.prototype.strList = function() {
  switch (randIndex(5)) {
    case 0:
      return ['names', 'names = [\'Siti\', \'Alex\', \'Bala\']'];
    case 1:
      return ['places', 'places = [\'Home\', \'School\']'];
    case 2:
      return ['fruits', 'fruits = [\'Apple\', \'Orange\', \'Pear\']'];
    case 3:
      return ['s', 's = ["A", "B", "C", "D"]'];
    case 4:
      return ['colours', 'colours = ["red", "orange", "green", "blue"]'];
  }
}

Generator.prototype.intList = function() {
  var length = 2 + randIndex(3);
  var line = ' = [';
  switch (randIndex(3)) {
    case 0:
      for (var i = 0; i < length; ++i) {
        line += 1965 + randIndex(2020 - 1965) + ', ';
      }
      line = line.slice(0, -2) + ']';
      return ['years', 'years' + line];
    case 1:
      for (var i = 0; i < length; ++i) {
        line += 15 + randIndex(99 - 15) + ', ';
      }
      line = line.slice(0, -2) + ']';
      return ['ages', 'ages' + line];
    case 2:
      for (var i = 0; i < length; ++i) {
        line += (randIndex(2) == 0 ? -1 : 1) * (1 + randIndex(100)) + ', ';
      }
      line = line.slice(0, -2) + ']';
      return ['x', 'x' + line];
  }
}

Generator.prototype.floatList = function() {
  var length = 2 + randIndex(3);
  var line = ' = [';
  switch (randIndex(2)) {
    case 0:
      for (var i = 0; i < length; ++i) {
        var dp = randIndex(2);
        line += ((randIndex(2) == 0 ? -1 : 1) * (1.0 + Math.random() * 100.0)).toFixed(dp);
        if (randIndex(4) == 0) {
          // Decrease probability of exponentials
          line += randIndex(2) == 0 ? 'e' : 'E';
          line += (randIndex(2) == 0 ? -1 : 1) * (1 + randIndex(9));
        }
        line += ', ';
      }
      line = line.slice(0, -2) + ']';
      var name = randIndex(2) == 0 ? 'readings' : 'y';
      return [name, name + line];
    case 1:
      for (var i = 0; i < length; ++i) {
        var dp = randIndex(2);
        line += (1.0 + Math.random() * 100.0).toFixed(dp);
        line += ', ';
      }
      line = line.slice(0, -2) + ']';
      return ['lengths', 'lengths' + line];
  }
}

Generator.prototype.numberList = function() {
  switch (randIndex(2)) {
    case 0:
      return this.intList();
    case 1:
      return this.floatList();
  }
}

Generator.prototype.expanders = {
  'PROGRAM': function() {
    // switch (randIndex(5)) {
    switch (randIndex(5)) {
      case 0:
        return ['@MIN'];
      case 1:
        return ['@MAX'];
      case 2:
        return ['@AVERAGE'];
      case 3:
        return ['@SEARCH'];
      case 4:
        return ['@EXTRACT'];
    }
  },

  // Minimum function
  'MIN': function() {
    var list = this.numberList();
    switch (this.complexity) {
      case 0:
        return [
          list[1],
          '@PRINT 0 Minimum min(' + list[0] + ')'
        ];
      case 1:
        return [
          list[1],
          '@MIN1_PART0 ' + list[0],
          spaces(1) + list[0] + '_min = ' + list[0] + '[0]',
          spaces(1) + 'for i in ' + list[0] + ':',
          '@LT 2 if i ' + list[0] + '_min',
          spaces(3) + list[0] + '_min = i',
          '@PRINT 0 Minimum ' + list[0] + '_min'
        ];
      default:
        return [
          list[1],
          '@MIN2_PART0 ' + list[0],
          spaces(1) + list[0] + '_min = ' + list[0] + '[0]',
          spaces(1) + list[0] + '_min_index = 0',
          spaces(1) + 'for i in range(len(' + list[0] + ')):',
          '@LT 2 if ' + list[0] + '[i] ' + list[0] + '_min',
          spaces(3) + list[0] + '_min = ' + list[0] + '[i]',
          spaces(3) + list[0] + '_min_index = i',
          '@PRINT 0 Minimum ' + list[0] + '_min',
          '@PRINT 0 Minimum-index ' + list[0] + '_min_index'
        ];
    }
  },
  'MIN1_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          '@IFLEN0 0 ' + x,
          spaces(1) + x + '_min = None',
          'else:'
        ];
      case 1:
        return [
          x + '_min = None',
          '@IFLENNOT0 0 ' + x
        ];
    }
  },
  'MIN2_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          '@IFLEN0 0 ' + x,
          spaces(1) + x + '_min = None',
          spaces(1) + x + '_min_index = None',
          'else:'
        ];
      case 1:
        return [
          x + '_min = None',
          x + '_min_index = None',
          '@IFLENNOT0 0 ' + x
        ];
    }
  },

  // Maximum function
  'MAX': function() {
    var list = this.numberList();
    switch (this.complexity) {
      case 0:
        return [
          list[1],
          '@PRINT 0 Maximum max(' + list[0] + ')'
        ];
      case 1:
        return [
          list[1],
          '@MAX1_PART0 ' + list[0],
          spaces(1) + list[0] + '_max = ' + list[0] + '[0]',
          spaces(1) + 'for i in ' + list[0] + ':',
          '@LT 2 if ' + list[0] + '_max i',
          spaces(3) + list[0] + '_max = i',
          '@PRINT 0 Maximum ' + list[0] + '_max'
        ];
      default:
        return [
          list[1],
          '@MAX2_PART0 ' + list[0],
          spaces(1) + list[0] + '_max = ' + list[0] + '[0]',
          spaces(1) + list[0] + '_max_index = 0',
          spaces(1) + 'for i in range(len(' + list[0] + ')):',
          '@LT 2 if ' + list[0] + '_max ' + list[0] + '[i]',
          spaces(3) + list[0] + '_max = ' + list[0] + '[i]',
          spaces(3) + list[0] + '_max_index = i',
          '@PRINT 0 Maximum ' + list[0] + '_max',
          '@PRINT 0 Maximum-index ' + list[0] + '_max_index'
        ];
    }
  },
  'MAX1_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          '@IFLEN0 0 ' + x,
          spaces(1) + x + '_max = None',
          'else:'
        ];
      case 1:
        return [
          x + '_max = None',
          '@IFLENNOT0 0 ' + x
        ];
    }
  },
  'MAX2_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          '@IFLEN0 0 ' + x,
          spaces(1) + x + '_max = None',
          spaces(1) + x + '_max_index = None',
          'else:'
        ];
      case 1:
        return [
          x + '_max = None',
          x + '_max_index = None',
          '@IFLENNOT0 0 ' + x
        ];
    }
  },

  // Average function
  'AVERAGE': function() {
    var list = this.numberList();
    switch (this.complexity) {
      case 0:
        return [
          list[1],
          '@IFLENNOT0 0 ' + list[0],
          spaces(1) + list[0] + '_average = sum(' + list[0] + ') / len(' + list[0] + ')',
          '@PRINT 1 Average ' + list[0] + '_average'
        ];
      default:
        return [
          list[1],
          '@AVERAGE1_PART0 ' + list[0],
          spaces(1) + list[0] + '_average = 0',
          spaces(1) + 'for i in ' + list[0] + ':',
          '@AUGMENT 2 ' + list[0] + '_average + i',
          '@AUGMENT 1 ' + list[0] + '_average / len(' + list[0] + ')',
          '@PRINT 0 Average ' + list[0] + '_average'
        ];
    }
  },
  'AVERAGE1_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          '@IFLEN0 0 ' + x,
          spaces(1) + x + '_average = None',
          'else:'
        ];
      case 1:
        return [
          x + '_average = None',
          '@IFLENNOT0 0 ' + x
        ];
    }
  },

  // Search function
  'SEARCH': function() {
    var list = this.strList();
    switch (this.complexity) {
      case 0:
        return [
          list[1],
          'search = input(\'Enter search: \')',
          list[0] + '_result = search in ' + list[0],
          '@PRINT 0 Search ' + list[0] + '_result'
        ];
      default:
        return [
          list[1],
          'search = input(\'Enter search: \')',
          '@SEARCH1_PART0 ' + list[0],
          '@PRINT 0 Search ' + list[0] + '_index'
        ];
    }
  },
  'SEARCH1_PART0': function(x) {
    switch(randIndex(2)) {
      case 0:
        return [
          x + '_index = None',
          'for i in range(len(' + x + ')):',
          spaces(1) + 'if ' + x + '[i] == search:',
          spaces(2) + x + '_index = i',
          spaces(2) + 'break'
        ];
      case 1:
        return [
          x + '_index = None',
          'i = 0',
          '@LT 0 while i len(' + x + ')',
          spaces(1) + 'if ' + x + '[i] == search:',
          spaces(2) + x + '_index = i',
          spaces(2) + 'break',
          '@AUGMENT 1 i + 1'
        ];
    }
  },

  // Extract function
  'EXTRACT': function() {
    switch (this.complexity) {
      case 0:
        var list = this.strList();
        return [
          list[1],
          list[0] + '_extract = []',
          '@EXTRACT_PART0 STR ' + list[0],
          '@PRINT 0 Extract ' + list[0] + '_extract'
        ];
      default:
        var list1 = this.intList();
        var list2 = this.intList();
        // Rename second list in case it clashes with first
        list2[1] = 'other' + list2[1].slice(list2[0].length);
        list2[0] = 'other';
        return [
          list1[1],
          list2[1],
          list1[0] + '_extract = []',
          '@EXTRACT_PART0 LIST ' + list1[0] + ' ' + list2[0],
          '@PRINT 0 Extract ' + list1[0] + '_extract'
        ];
    }
  },
  'EXTRACT_PART0': function(type, x, y) {
    switch (randIndex(3)) {
      case 0:
        return [
          'for i in range(len(' + x + ')):',
          '@IF' + type + ' 1 ' + x + '[i]' + (y ? ' ' + y : ''),
          '@AUGMENT 2 ' + x + '_extract + ' + x + '[i:i+1]'
        ];
      case 1:
        return [
          'i = 0',
          '@LT 0 while i len(' + x + ')',
          '@IF' + type + ' 1 ' + x + '[i]' + (y ? ' ' + y : ''),
          '@AUGMENT 2 ' + x + '_extract + [' + x + '[i]]',
          '@AUGMENT 1 i + 1'
        ];
      case 2:
        return [
          'for i in ' + x + ':',
          '@IF' + type + ' 1 i' + (y ? ' ' + y : ''),
          '@AUGMENT 2 ' + x + '_extract + [i]'
        ];
    }
  },

  // Utility functions
  'IFSTR': function(indent, x) {
    var s = spaces(indent);
    var method;
    switch (randIndex(6)) {
      case 0:
        method = 'isalpha'
        break;
      case 1:
        method = 'isalnum'
        break;
      case 2:
        method = 'isdigit'
        break;
      case 3:
        method = 'isspace'
        break;
      case 4:
        method = 'islower'
        break;
      case 5:
        method = 'isupper'
        break;
    }
    return [s + 'if ' + x + '.' + method + '():'];
  },
  'IFLIST': function(indent, x, y) {
    var s = spaces(indent);
    return [s + 'if ' + x + ' in ' + y + ':'];
  },
  'IFLEN0': function(indent, x) {
    var s = spaces(indent);
    switch (randIndex(2)) {
      case 0:
        return [s + 'if len(' + x + ') == 0:'];
      case 1:
        return [s + 'if ' + x + ' == []:'];
    }
  },
  'IFLENNOT0': function(indent, x) {
    var s = spaces(indent);
    switch (randIndex(3)) {
      case 0:
        return [s + 'if len(' + x + ') != 0:'];
      case 1:
        return [s + 'if len(' + x + ') > 0:'];
      case 2:
        return [s + 'if ' + x + ' != []:'];
    }
  },
  'LT': function(indent, keyword, x, y) {
    var s = spaces(indent);
    switch (randIndex(2)) {
      case 0:
        return [s + keyword + ' ' + x + ' < ' + y + ':'];
      case 1:
        return [s + keyword + ' ' + y + ' > ' + x + ':'];
    }
  },
  'PRINT': function(indent, label, x) {
    var s = spaces(indent);
    switch (randIndex(2)) {
      case 0:
        return [s + 'print(' + x + ')'];
      case 1:
        return [s + 'print(\'' + label + ': \' + str(' + x + '))'];
    }
  },
  'AUGMENT': function(indent, x, op, y) {
    var s = spaces(indent);
    switch (randIndex(2)) {
      case 0:
        return [s + x + ' ' + op + '= ' + y];
      case 1:
        return [s + x + ' = ' + x + ' ' + op + ' ' + y];
    }
  },
}

Generator.prototype.generateProgram = function() {
  var program = ['@PROGRAM'];

  var changed;
  do {
    changed = false;
    for (var i = program.length - 1; i >= 0; --i) {
      var line = program[i];
      if (line.charAt(0) == '@') {
        changed = true;
        var command = line.slice(1).split(' ');
        var expansion = this.expanders[command[0]].apply(this, command.slice(1));
        Array.prototype.splice.apply(program, [i, 1].concat(expansion));
      }
    }
  } while (changed);

  return program;
}

// ================================================================================
// GAME
// ================================================================================

// Encapsulates game state and functionality.
var Game = function(am) {
  // Constants
  this.CORRECT = 10;
  this.WRONG = -5;

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

  // Overlay elements
  this.rightOverlay = $('#right-overlay');
  this.wrongOverlay = $('#wrong-overlay');
  this.bannerOverlay = $('#banner-overlay');
  this.bannerOverlayLevel = $('#banner-overlay span');
  this.reportOverlay = $('#report-overlay');
  this.reportOverlayScore = $('#report-overlay span');

  // For end-of-quiz review
  this.archive = [];
  this.previousArchiveElement = $('#archive-prev');
  this.nextArchiveElement = $('#archive-next');

  // Audio manager
  this.am = am;

  // Program generator
  this.generator = new Generator();
}

Game.prototype.start = function() {
  this.archive = [];
  this.hideArchive();
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
          poof(that.rightOverlay, lastMoveEvent);
          that.am.playEffect('ding');
          return;
        }
      }
      // Incorrect answer given, so reduce score and ask again
      that.incrementScore(that.WRONG);
      poof(that.wrongOverlay, lastMoveEvent);
      that.am.playEffect('buzzer');
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
    var random = i + randIndex(candidates.length - i);
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
    this.clearTimer();
    bootbox.hideAll();
    // Highlight all remaining corrections
    for (var i = 0; i < this.correctionsByLine.length; ++i) {
      var corrections = this.correctionsByLine[i];
      if (corrections.length > 0) {
        var correction = corrections[0];
        correction[2].addClass('wrong');
      }
    }
    this.archive.push(this.sourceElement.html());
    this.sourceElement.html(this.archive[this.archive.length - 1]);
    this.showArchive();
    // Show report overlay
    this.reportOverlayScore.text(this.score);
    bootbox.alert({
      className: 'modal-report',
      title: 'Time\'s Up!',
      message: this.reportOverlay.html()
    });
    this.am.playEffect('ding');
    this.am.play('report');
    return;
  }
  if (this.timeLeft <= 5) {
    flashOpacity(this.timeElement);
    this.am.playEffect('alarm');
  }
  this.am.playEffect('tick');
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
    // Stop timer ASAP
    this.clearTimer();
    // Archive current program
    this.archive.push(this.sourceElement.html());
    // Proceed to next level
    this.nextLevel();
  }
}

Game.prototype.nextLevel = function() {
  this.setLevel(this.level + 1);

  this.generator.complexity = Math.floor(this.level / 5);
  var source = this.generator.generateProgram();

  var errors = Math.floor(source.length * this.level / (this.level + 15));
  this.setErrorsTotal(Math.max(1, errors));
  this.setErrorsFound(0);

  source = source.join('\n');

  this.setSource(source);

  var time = 30;
  if (this.level >= 15) {
    time = Math.floor(time / Math.pow(1.1, this.level - 15));
  }

  var that = this;
  this.bannerOverlayLevel.text(this.level);
  flash(this.bannerOverlay, function() {
    that.setTimer(Math.max(1, time));
    that.am.playEffect('harp');
  });
  this.am.playEffect('swoosh');
}

Game.prototype.previousArchive = function() {
  if (this.level - 1 < 1) return;
  this.setLevel(this.level - 1);
  this.sourceElement.html(this.archive[this.level - 1]);
  this.showArchive();
}

Game.prototype.nextArchive = function() {
  if (this.level + 1 > this.archive.length) return;
  this.setLevel(this.level + 1);
  this.sourceElement.html(this.archive[this.level - 1]);
  this.showArchive();
}

Game.prototype.hideArchive = function() {
  this.previousArchiveElement.hide();
  this.nextArchiveElement.hide();
}

Game.prototype.showArchive = function() {
  this.previousArchiveElement.show();
  this.nextArchiveElement.show();
  if (this.level == this.archive.length) {
    this.setErrorsFound(this.errorsFound);
  } else {
    this.errorsFoundElement.text('-');
    this.errorsLeftElement.text('-');
  }

  if (this.level - 1 < 1) {
    this.previousArchiveElement.addClass('disabled');
  } else {
    this.previousArchiveElement.removeClass('disabled');
  }

  if (this.level + 1 > this.archive.length) {
    this.nextArchiveElement.addClass('disabled');
  } else {
    this.nextArchiveElement.removeClass('disabled');
  }
}

// ================================================================================
// AUDIOMANAGER
// ================================================================================

// Manager to make sure only music track is played at a time.
var AudioManager = function() {
  this.currentMusic = null;
  this.music = {
    menu: $('#menu-music')[0],
    game: $('#game-music')[0],
    report: $('#report-music')[0]
  };
  for (var track in this.music) {
    this.music[track].loop = true;
  }
  this.effects = {
    swoosh: $('#swoosh-effect')[0],
    tick: $('#tick-effect')[0],
    alarm: $('#alarm-effect')[0],
    ding: $('#ding-effect')[0],
    buzzer: $('#buzzer-effect')[0],
    harp: $('#harp-effect')[0]
  }
}

AudioManager.prototype.play = function(track) {
  if (this.currentMusic === this.music[track]) return;
  if (this.currentMusic !== null) {
    this.currentMusic.pause();
  }
  this.currentMusic = this.music[track];
  this.currentMusic.currentTime = 0;
  this.currentMusic.play();
}

AudioManager.prototype.restart = function(track) {
  if (this.currentMusic === this.music[track]) {
    this.currentMusic.currentTime = 0;
  } else {
    this.play(track);
  }
}

AudioManager.prototype.playEffect = function(effect) {
  this.effects[effect].currentTime = 0;
  this.effects[effect].play();
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
  var listStackDepth = 0;
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
        candidates.push([token, [index], 1, ['none', 'NONE']]);
        break;
      case 'break':
        candidates.push([token, [index], 1, ['brake', 'braek']]);
        break;
      case 'while':
        candidates.push([token, [index], 1, ['when', 'where', 'which']]);
        break;
      case 'for':
        candidates.push([token, [index], 1, ['four', 'fur', 'fore']]);
        break;
      case 'if':
        candidates.push([token, [index], 1, ['in', 'is', 'of', 'iif', 'iff']]);
        break;
      case 'in':
        candidates.push([token, [index], 1, ['of', 'on', 'if', 'iin', 'inn']]);
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
      case ',':
        candidates.push([token, [index], 1, ['.', ';', ',,']]);
        break;
      case '.':
        // Do not replace decimal points in float literals
        // Take advantage of fact that we only have float literals in list literals
        if (listStackDepth == 0) {
          candidates.push([token, [index], 1, ['..', ',']]);
        }
        break;
      case '!':
        if (index + 1 < line.length && line[index + 1] === '=') {
          candidates.push(['!=', [index], 2, ['<>', '!==']]);
        }
        break;
    }

    // Type 5: Detect brackets
    if (token.charAt(0).match(/\(|\)/)) {
      var complement;
      switch (token.charAt(0)) {
        case '(':
          complement = '[';
          break;
        case ')':
          complement = ']';
          break;
      }
      var options = [complement + token.slice(1)];
      if (token.length > 1) {
        options.push(token.slice(1) + complement);
        options.push(token.slice(1));
      }
      candidates.push([token, [index], 1, options]);
    }
    if (token.charAt(0).match(/\[|\]/)) {
      // Keep track of whether we are in a list literal
      for (var i = 0; i < token.length; ++i) {
        switch (token.charAt(i)) {
          case '[':
            ++listStackDepth;
            break;
          case ']':
            --listStackDepth;
            break;
        }
      }
      if (token.length > 1) {
        candidates.push([token, [index], 1, [token.slice(1)]]);
      }
    }

    // Update previous non-space, non-literal token
    previousNonSpaceToken = token;
    previousNonSpaceIndex = index;
  }

  if (candidates.length === 0) {
    return [];
  }

  // Randomly choose an error
  var error = candidates[randIndex(candidates.length)];
  var errorIndex = error[1][randIndex(error[1].length)];
  var errorToken = error[3][randIndex(error[3].length)];
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

// Returns a string of spaces for the given level of indentation.
var spaces = function(indent) {
  var result = '';
  while (indent > 0) {
    result += '    ';
    --indent;
  }
  return result;
}

var randIndex = function(length) {
  return Math.floor(Math.random() * length);
}

var flash = function(e, callback) {
  var dialog = bootbox.dialog({
    className: 'modal-banner',
    message: e.html(),
    closeButton: false
  });

  setTimeout(function() {
    dialog.modal('hide');
    if (callback) {
      callback();
    }
  }, 1000);
}

var poof = function(e, event) {
  e.show();
  var left = event.pageX - e.innerWidth() / 2;
  var top = event.pageY - e.innerHeight() / 2;
  e.css({
    opacity: 1
  });
  e.offset({
    left: left,
    top: top
  })
  e.animate({
    top: top - 100,
    opacity: 0
  }, {
    duration: 500,
    complete: function() {
      e.hide();
    }
  });
}

var flashOpacity = function(e) {
  e.animate({
    opacity: 0
  }, {
    duration: 100,
    complete: function() {
      e.animate({
        opacity: 1
      }, 100);
    }
  });
}

// ================================================================================
// GLOBALS
// ================================================================================

// Global audio manager.
var am;
// Global game object.
var game;
// Last onmousemove event.
var lastMoveEvent;

$(document).ready(function() {
  am = new AudioManager();
  am.play('menu');

  game = new Game(am);
  var titleDiv = $('#title');
  var gameDiv = $('#game');

  $(document).on('mousemove', function(event) {
    lastMoveEvent = event;
  });

  $('#start').on('click', function() {
    titleDiv.slideUp();
    gameDiv.slideDown();
    game.start();
    am.play('game');
  });

  $('#archive-prev').on('click', function() {
    game.previousArchive();
  });

  $('#archive-next').on('click', function() {
    game.nextArchive();
  });

  $('#restart').on('click', function() {
    game.start();
    am.restart('game');
  });

  $('#quit').on('click', function(event) {
    game.clearTimer();
    gameDiv.slideUp();
    titleDiv.slideDown();
    am.play('menu');
  });

  $('#howtoplay').on('click', function(event) {
    bootbox.alert({
      title: 'How to Play',
      message: $('#howtoplay-overlay').html()
    });
  });

  $('#credits').on('click', function(event) {
    bootbox.alert({
      title: 'Credits',
      message: $('#credits-overlay').html()
    });
  });
});

