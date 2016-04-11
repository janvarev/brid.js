// An environment!
function makeEnv( keys, values, outer ){
  var env = {
    "values": makeHash(keys, values),
    "outer":  outer
  };
  return(env);
}

// Convenience function for above
function makeHash(keys, values){
  var hash = {};
  for (var i in keys) {
    hash[keys[i]] = values[i];
  }
  return hash;
}

function findEnv( env, key ){
  if( env.values.hasOwnProperty( key ) ){
    return env;
  }

  if( env.outer ){
    return findEnv( env.outer, key );
  }
}

function defInEnv( env, key, value ){
  return (env.values[key] = value);
}

// This function differs from the above
// in that it climbs to the environment
// where the key was originally defined
// to mutate it in place.
function setInEnv( env, key, value ){
  return (findEnv(env, key).values[key] = value);
}

function getFromEnv( env, key ){
  return (findEnv(env, key).values[key]);
}

function values( obj ){
  return Object.keys(obj).map(function(x){ return obj[x] });
}

function arrayp( a ){
  return ( a instanceof Array );
}

function functionp( a ){
  return ( a instanceof Function );
}

function hashp( a ){
  return ( a instanceof Object && !( arrayp(a) ) && !( functionp(a) ));
}

function numberp( a) {
  return (typeof a == "number");
}

function stringp( a) {
  return (typeof a == "string");
}


function brid(x, env){
  if( typeof x == "string" ){ // variable reference
	if(x.substr(0, 2) == "__") { // if not-quoted symbol
		return getFromEnv(env, x);
    } else {
		return x;
	}
  } else if( hashp(x) ){
    // unlike Clojure, our keys cannot be arbitrary objects
    // so let's not evaluate keys as expressions
    return makeHash(Object.keys(x), values(x).map(function(v){ return brid(v, env) }));
  } else if( !arrayp(x) ){ // constant literal
    return x;
  } else if(x.length == 0) {
    return [];
  } else if(x[0] == '__quote'){
    return x[1];
  } else if(x[0] == '__if'){
    var test   = x[1];
    var conseq = x[2];
    var alt    = x[3];
    var branch;
    if( brid(test, env) )
      { branch = conseq }
      else { branch = alt };
    return ( brid( branch, env ));
  } else if(x[0] == '__set!'){
    var v   = x[1];
    var exp = x[2];
    return (setInEnv(env, v, brid(exp, env)));
  } else if(x[0] == '__define'){
    var v   = x[1];
    var exp = x[2];
    return (defInEnv(env, v, brid(exp, env)));
  } else if(x[0] == '__lambda'){
    var vars = x[1];
    var exp  = x[2];
    // is it cheating to use the closure from here?
    var r = function(){ return brid( exp, makeEnv(vars, arguments, env) ) };
    return r;
  } else if(x[0] == '__begin'){
    var args = x.slice(1);
    var r;
    for(var i in args){
      r = brid(args[i], env)
    }
    return r;
  } else if(x[0] == '__eval'){
    var arg = x[1];
    var r = brid( brid(arg, env), env );
    return r;
  } else { // something user defined
    var exps = x.map(function(exp){ return brid(exp, env)});
    var proc = exps.shift();
    return proc.apply(proc, exps);
  }
}

// Grrr, JavaScript
function argsToArray(args){
  var r = [];
  for( var i in args ){
    r.push(args[i]);
  }
  return(r);
}

function plus(){
  return argsToArray(arguments).reduce(function(a,b){return a+b}, 0);
}

function minus(){
  if (arguments.length == 1){
    return -arguments[0];
  } else if (arguments.length > 1){
    return argsToArray(arguments).slice(1).reduce(function(a,b){return a-b}, arguments[0]);
  } else {
    throw "wrong number of arguments to -";
  }
}

function write(s){
  var output = document.getElementById('output');
  output.value += s;
  output.scrollTop = output.scrollHeight;
}

function writeln(s){
  write(s + "\n");
}

function get(hash, key){
  if( hash instanceof Object ){
    if( hash.hasOwnProperty( key ) ){
      return hash[key];
    }
  }
}

function copyHash( hash ){
  var keys = Object.keys(hash);
  var r = {};
  for( var i in keys ){
    var key = keys[i];
    if( hash.hasOwnProperty( key ) ){
      r[key] = hash[key];
    }
  }
  return r;
}

function assoc(hash, key, value){
  var r = copyHash(hash);
  r[key] = value;
  return r;
}

function eqp(a, b){
  return a === b;
}

function equalp(a, b){
  if(typeof(a) != typeof(b)){
    return false;
  }

  if( arrayp(a) ){
    return arrayp(b) && arrayEquals(a,b);
  }

  if( hashp(a) ){
    return hashp(b) && hashEquals(a,b);
  }
  return a == b;
}

function arrayEquals(a, b){
  if( a.length != b.length ){
    return false;
  }
  for( var i in a ){
    if(a[i] != b[i]){
      return false;
    }
  }
  return true;
}

function hashEquals(a, b){
  return arrayEquals(Object.keys(a), Object.keys(b)) && arrayEquals(values(a), values(b))
}

function gt(){
  var greatest = (-Infinity);
  for( var i in arguments ){
    if( arguments[i] <= greatest ){
      return false;
    }
    greatest = arguments[i];
  }
  return true;
}

function gte(){
  var greatest = (-Infinity);
  for( var i in arguments ){
    if( arguments[i] < greatest ){
      return false;
    }
    greatest = arguments[i];
  }
  return true;
}

function lte(){
  var least = (Infinity);
  for( var i in arguments ){
    if( arguments[i] > least ){
      return false;
    }
    least = arguments[i];
  }
  return true;
}

function lt(){
  var least = (Infinity);
  for( var i in arguments ){
    if( arguments[i] >= least ){
      return false;
    }
    least = arguments[i];
  }
  return true;
}

function eq(){
  var it = arguments[0];
  for( var i in arguments ){
    if( arguments[i] != it ){
      return false;
    }
    it = arguments[i];
  }
  return true;
}

function nth(a, n){
  if( arrayp(a) ){
    return a[n];
  }
}

function count(a){
  if( arrayp(a) ){
    return a.length;
  } else if (hashp(a)) {
    return count( Object.keys(a) );
  }
}

function cons(a,as){
  return ([a].concat(as));
}

function map(f, a){
  return a.map(f);
}

function reduce(f, a, init){
  if(typeof init != "undefined"){
    return a.reduce(function(a,b){ return f(a,b) }, init);
  } else {
    return a.reduce(function(a,b){ return f(a,b) });
  }
}

function toJson( obj ){
  return JSON.stringify(obj, fixJson);
}

function rest(a){
  var a2 = a.concat([]); // copy array
  a2.shift();
  return a2;
}


global = {
  values:{
    '__eq?': eqp,
    '__equal?': equalp,

    '__list?': arrayp,
    '__map?': hashp,
    '__function?': functionp,
    '__number?': numberp,
    '__string?': stringp,

    '__+': plus,
    '__-': minus,
    // TODO: division and modulus
    // TODO: min, max

    '__=':  eq,
    '__>':  gt,
    '__>=': gte,
    '__<':  lt,
    '__<=': lte,

    '__get': get,
    '__assoc': assoc,
    '__keys': Object.keys,
    '__values': values,

    '__nth': nth,
    '__count': count,
    '__cons': cons,
    '__map': map,
    '__reduce': reduce,

    '__print': write,
    '__println': writeln,

    '__serialize': toJson,
    '__unserialize': JSON.parse,
	
	'__rest': rest,
  }
}


function input(){
  return document.getElementById('input').value;
}

function clearInput(){
  return document.getElementById('input').value = '';
}

function fixJson( key, obj ){
  if( functionp(obj) ){
    return "some-lambda"
  } else {
    return obj;
  }
}

var sread = new SExpReader();

function do_repl(){
  var expression = input();
  write( "> " + expression + "\n");
  try{
    //var e = JSON.parse(expression);
	var e = sread.parseSexp(expression, true);
  } catch(er) {
    write(er + "\n");
    return;
  }
  try{
    var r = brid( e, global );
  } catch(er) {
    write(er + "\n");
    return;
  }
  write( JSON.stringify(r, fixJson) + "\n" );
  clearInput();
}

function hello(){
  return document.getElementById('input').value = '(println "hello world")';
}

function mapexample(){
  return document.getElementById('input').value = '(map (lambda (x) (+ x 1)) (quote (1 2 3)))';
  
}

prelude = [ "__begin",
  ["__define", "__false", false],
  ["__define", "__true", true],
  ["__define", "__#f", false],
  ["__define", "__#t", true],
  ["__define", "__null", null],
  ["__define", "__first", ["__lambda", ["__x"], ["__nth", "__x", 0] ] ],
]

brid( prelude, global );

/*
prelude = [ "begin",
  // curried multiplication            
  ["define", "*", ["lambda", ["n"], 
                   ["lambda", ["m"], 
                    ["if", ["eq?", "m", 0], 
                     0, 
                     ["+", "n", [["*", "n"], ["-", "m", 1]]]]]]],
  // factorial          
  ["define", "fact", ["lambda", ["n"],
                      ["if", ["eq?", "n", 0],
                       1, 
                       [["*", "n"], ["fact", ["-", "n", 1]]]]]],
  ["define", "inc", ["lambda", ["x"], ["+", "x", 1] ] ],
  ["define", "dec", ["lambda", ["x"], ["-", "x", 1] ] ],
  ["define", "not", ["lambda", ["x"], ["if", "x", false, true]]],
  ["define", "zero?", ["lambda", ["x"], ["equal?", "x", 0]]],
  ["define", "pos?", ["lambda", ["x"], [">", "x", 0]]],
  ["define", "neg?", ["lambda", ["x"], ["<", "x", 0]]],
  ["define", "false", false],
  ["define", "true", true],
  ["define", "null", null],
]

brid( prelude, global );
*/