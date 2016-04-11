// --- support stream class -------
var Stream = (function () {
    function Stream(val) {
        this._pos = 0;
        this._val = val;
    }
    Object.defineProperty(Stream.prototype, "peek", {
        get: function () {
            return this._val.charAt(this._pos);
        },
        enumerable: true,
        configurable: true
    });
    Stream.prototype.next = function () {
        this._pos++;
    };
    Object.defineProperty(Stream.prototype, "atEnd", {
        get: function () {
            return this._pos >= this._val.length;
        },
        enumerable: true,
        configurable: true
    });
    Stream.prototype.skipSeparators = function () {
        while (this.isSeparator(this.peek)) {
            this.next();
        }
    };
    Stream.prototype.isSeparator = function (s) {
        return s == " " || s == "\t" || s == "\r" || s == "\n";
    };
    return Stream;
})();
var SExpReader = (function () {
    function SExpReader() {
        this.isAddPrefixToSymbols = false;
        this.regAlnum = /[^A-Za-z0-9\+\-\=\*\?\_]/g;
    }
    SExpReader.prototype.parseSexp = function (str, isAddPrefixToSymbols) {
        if (isAddPrefixToSymbols === void 0) { isAddPrefixToSymbols = false; }
        this.isAddPrefixToSymbols = isAddPrefixToSymbols;
        return this.readStream(new Stream(str));
    };
    SExpReader.prototype.serializeSexp = function (sexp, isAddPrefixToSymbols) {
        if (isAddPrefixToSymbols === void 0) { isAddPrefixToSymbols = false; }
        this.isAddPrefixToSymbols = isAddPrefixToSymbols;
        return this.serialize(sexp);
    };
    SExpReader.prototype.serialize = function (sexp) {
        if (sexp instanceof Array) {
            var ar = [];
            for (var i = 0; i < sexp.length; i++) {
                ar.push(this.serialize(sexp[i]));
            }
            return "(" + ar.join(" ") + ")";
        }
        else {
            if (typeof sexp === "number") {
                return sexp.toString();
            }
            if (typeof sexp === "string") {
                // some comples cases
                var s = sexp;
                if (this.isAddPrefixToSymbols) {
                    if (s.substr(0, 2) == "__") {
                        return s.substr(2);
                    }
                    else {
                        s = this.strReplace("\\", "\\\\", s);
                        s = this.strReplace("\"", "\\\"", s);
                        return '"' + s + '"';
                    }
                }
                else {
                    if (s.match(this.regAlnum) !== null || s.length == 0) {
                        s = this.strReplace("\\", "\\\\", s);
                        s = this.strReplace("\"", "\\\"", s);
                        return '"' + s + '"'; // return with quotes
                    }
                    else {
                        return s; // alpha-numerical string returns without quotes
                    }
                }
            }
        }
        return "";
    };
    SExpReader.prototype.strReplace = function (replaceFrom, replaceTo, content) {
        var tArr = content.split(replaceFrom);
        return tArr.join(replaceTo);
    };
    SExpReader.prototype.readStream = function (stream) {
        stream.skipSeparators();
        // comments ; to \n
        if (stream.peek == ";") {
            stream.next();
            while (stream.peek != "\n" && stream.peek != "\r") {
                if (stream.atEnd) {
                    //throw new Error("Quote expected!");
                    break;
                }
                stream.next();
            }
            stream.next();
            return this.readStream(stream);
        }
        // ( - list
        if (stream.peek == "(") {
            stream.next();
            return this.readListRest(stream);
        }
        // atom
        return this.readAtom(stream);
    };
    SExpReader.prototype.readListRest = function (stream) {
        stream.skipSeparators();
        if (stream.atEnd) {
            throw new Error("missing ')'");
        }
        if (stream.peek == ")") {
            stream.next();
            return new Array();
        }
        var element;
        var restElement;
        element = this.readStream(stream);
        stream.skipSeparators();
        var lc = new Array();
        if (stream.peek == ")") {
            stream.next();
            lc[0] = element;
            return lc;
        }
        // not last element? 
        lc = this.readListRest(stream); // read list to the end to LC
        this.sexpConsToRest(element, lc); // and attach current element to the LC
        return lc;
    };
    SExpReader.prototype.sexpConsToRest = function (first, rest) {
        rest.splice(0, 0, first);
    };
    SExpReader.prototype.readAtom = function (stream) {
        var buffer = "";
        stream.skipSeparators();
        // string
        if (stream.peek == "\"") {
            stream.next();
            while (stream.peek != "\"") {
                if (stream.atEnd) {
                    throw new Error("Quote expected!");
                }
                // quoted symbol
                if (stream.peek != "\\") {
                    buffer += stream.peek;
                }
                else {
                    // immediately add quoted symbol
                    stream.next();
                    buffer += stream.peek;
                }
                stream.next();
            }
            stream.next();
            return buffer;
        }
        while (!stream.atEnd && stream.peek != " " && stream.peek != "(" && stream.peek != ")" && stream.peek != "\t" && stream.peek != "\n" && stream.peek != "\r") {
            buffer += stream.peek;
            stream.next();
        }
        // is number?
        if (!isNaN(parseFloat(buffer))) {
            var num = parseFloat(buffer);
            // if no . then integer
            if (buffer.indexOf(".") == -1) {
                return parseInt(buffer);
            }
            else {
                return num;
            }
        }
        if (this.isAddPrefixToSymbols) {
            return "__" + buffer;
        }
        return buffer;
    };
    return SExpReader;
})();
//# sourceMappingURL=SExpReader.js.map