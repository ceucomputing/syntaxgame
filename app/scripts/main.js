// Syntax Error Game

// 2017-06-02:
// 2017-06-01: Implemented custom tokenizer

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

// Given a separator, splits given array into array of sub-arrays.
var splitArray = function(array, separator) {
  var result = [];
  var current = [];
  for (var index = 0; index <= array.length; ++index) {
    var item = (index < array.length) ? array[index] : null;
    if (item) {
      current.push(item);
    }
    if (item === null || item === separator) {
      result.push(current);
      current = [];
    }
  }
  return result;
}

// Generates DOM for array of tokens.
var renderSource = function(element, lines, handler) {
  element.html('');
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    for (var j = 0; j < line.length; ++j) {
      var token = line[j];
      if (token.match(/\s/)) {
        element.append(document.createTextNode(token));
      } else {
        $('<a>', {
          href: '#',
          text: token,
          click: function() {
            var localLine = i;
            var localIndex = j;
            return function(event) {
              handler(localLine, localIndex, $(event.target));
              return false;
            }
          }()
        }).appendTo(element);
      }
    }
  }
}

// Given an array of tokens for a line of Python code, randomly inserts an correctable syntax error.
// If no error is possible, returns null.
// Otherwise returns array of errorified tokens and array of valid corrections.
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

    // Type 2: Detect end-of-line colons
    if (token === ':') {
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
    }

    // Type 3: Detect keywords
    if (token === 'while') {
      candidates.push([token, [index], 1, ['when', 'where']]);
    }
    if (token === 'in') {
      candidates.push([token, [index], 1, ['of', 'on', 'is']]);
    }
    if (token === 'and') {
      candidates.push([token, [index], 1, ['&&']]);
    }
    if (token === 'or') {
      candidates.push([token, [index], 1, ['||']]);
    }
    if (token === 'not') {
      var fullToken = token;
      var extend = index + 1 < line.length && line[index + 1].match(/\s+/);
      if (extend) {
        fullToken += line[index + 1];
      }
      candidates.push([fullToken, [index], extend ? 2 : 1, ['!']]);
    }

    // Type 4: Detect operators
    if (token === '%') {
      candidates.push([token, [index], 1, ['%%']]);
    }
    if (token === '==') {
      candidates.push([token, [index], 1, ['=']]);
    }
    if (token === '!' && index + 1 < line.length && line[index + 1] === '=') {
      candidates.push(['!=', [index], 2, ['<>', '!==']]);
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
    return [line, []];
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
  return [line, corrections];
}

var source = $("#entry-template").html();
var template = Handlebars.compile(source);
var tokenizer = new Tokenizer(template({ x: 'example', 'value': 'my_list' }));
var tokens = tokenizer.toTokens();

var lines = splitArray(tokens, '\n');

var errors = [];
for (var i = 0; i < lines.length; ++i) {
  var errored = errorify(lines[i]);
  errors.push(errored[1]);
}

var handler = function(line, index, element) {
  bootbox.prompt({
    title: 'What do you think this should be?',
    value: element.text(),
    callback: function(result) {
      var error = errors[line];
      for (var i = 0; i < error.length; ++i) {
        var option = error[i];
        if (option[0] == index && option[1] == result) {
          // Correct!
          element.text(result);
          element.addClass('correct');
          bootbox.alert('That\'s right!');
          return;
        }
      }
      bootbox.alert('That\'s wrong!');
    }
  });
}

var html = renderSource($('#source'), lines, handler);

// var source   = $("#entry-template").html();
// var template = Handlebars.compile(source);

// var context = {title: "My New Post", body: "This is my first post!"};
// var html    = template(context);

// console.log(html);
// $('#output').html(html);
