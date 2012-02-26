var sort = function(list, keyFunction) {
  list.sort(function(a, b) {
    a = keyFunction(a);
    b = keyFunction(b);
    if (a == b)
      return 0;
    if (a < b)
      return -1;
    return 1;
  });
  return list;
};

var each = function(list, eachFunction) {
  for (var index in list) {
    eachFunction(index, list[index]);
  }
}

var select = function(list, selectFunction) {
  var ret = [];
  each(list, function(index, value) {
    ret.push(selectFunction(index, value));
  });
  return ret;
}

var filter = function(list, selectFunction) {
  var ret = [];
  each(list, function(index, value) {
    var selected = selectFunction(index, value);
    if (selected != null)
      ret.push(selected);
  });
  return ret;
}

try {
  exports.sort = sort;
  exports.select = select;
  exports.filter = filter;
  exports.each = each;
}
catch (e) {
}
