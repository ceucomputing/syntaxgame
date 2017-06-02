// 2017-06-01

var Tokenizer = function(source) {
  this.source = source;
  this.tail = source;
}

Tokenizer.prototype.nextToken = function() {
  if (this.tail.length == 0) return null;
  var index;
  if (this.tail.charAt(0) == '/n') {
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
    while (this.tail.charAt(index) == this.tail.charAt(0)) {
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

var renderTokens = function(tokens) {
  var html = '';
  for (var i = 0; i < tokens.length; ++i) {
    var token = tokens[i];
    if (token.match(/\s/)) {
      html += token;
    } else {
      html += '<a href="#">' + $('<div>').text(token).html() + '</a>';
    }
  }
  return html;
}

var source = $("#entry-template").html();
var template = Handlebars.compile(source);
var tokenizer = new Tokenizer(template({ x: 'example', 'value': 'my_list' }));
var tokens = tokenizer.toTokens();
var html = renderTokens(tokens);

$('#source').html(html);

// var source   = $("#entry-template").html();
// var template = Handlebars.compile(source);

// var context = {title: "My New Post", body: "This is my first post!"};
// var html    = template(context);

// console.log(html);
// $('#output').html(html);
