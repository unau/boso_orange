var cell_size = 24;
var char_wall = '■';
var char_space_fw = '　';
var char_space_hw = ' ';
var char_space = char_space_hw;
var char_mark = '＠';
var char_refl = '＼';
var char_refr = '／';

var initial_scene_source = "これはサンプル場面です。\n適当に書き替えてから kick してください。\n＠ 木寸";

var score = {
  getNextMove: function() {
    return -1;
  },
  promote: function() {
    a = 1;
  },
  append: function() {
    a = 1;
  }
};

var board;

function boso_diff(cell, ch_before, ch_after) {
  var obj = {
    cell: cell,
    ch_before: ch_before,
    ch_after: ch_after
  };
  return obj;
}

function form_board(tbody) {
  tbody.trs = new Array();
  tbody.journey = {
    a: new Array(),
    unshift: function(cell) {
      this.a.unshift(cell);
    },
    clear: function() {
      this.a = new Array();
    }
  };
  tbody.createCellLineTr = function() {
    var tr = form_cell_line($('<tr/>').appendTo(this));
    this.trs.push(tr);
    return tr;
  };
  tbody.addWallLine = function(length) {
    var tr = this.createCellLineTr();
    for (i = 0; i < length; i++) {
      tr.addWall();
    }
  };
  tbody.release = function() {
    for (i in this.trs) {
      this.trs[i].release();
    }
    this.empty();
    this.trs = new Array();
  };
  tbody.connect = function() {
    var i;
    for (i = 0; i < this.trs.length - 1; i++) {
      this.trs[i].connectWithSouthLine(i, this.trs[i + 1]);
    }
  };
  tbody.patch = function(patch, reverse) {
    var i;
    if (reverse) {
      for (i in patch) {
        var tip = patch[i];
        tip['cell'].setChar(tip['ch_before']);
      }
    }
    else {
      for (i in patch) {
        var tip = patch[i];
        tip['cell'].setChar(tip['ch_after']);
      }
    }
  };
  tbody.add_diff = function(patch) {
    a = 1;
  };
  tbody.is_complete = function() {
    return false;
  };
  return tbody;
}

function form_cell_line(tr) {
  tr.tds = new Array();
  tr.release = function() {
    var i;
    for (i in this.tds) {
      this.tds[i].release();
    }
    this.tds = new Array();
  };
  tr.addTd = function(ch) {
    var td = form_cell($('<td/>').appendTo(this).addClass('cell'));
    this.tds.push(td);
    td.setChar(ch);
    /*
    var mark = null;
    if (ch == char_mark) {
      mark = td;
    }
    return mark;
    */
  };
  tr.addWall = function() {
    this.addTd(char_wall);
  };
  tr.addSpace = function() {
    this.addTd(char_space);
  };
  tr.connectWithSouthLine = function(i, south) {
    var j;
    for (j = 0; j < this.tds.length - 1; j++) {
      this.tds[j].cid = '[' + i + ':' + j + ']';
      this.tds[j].nxt[0] = this.tds[j + 1];
      this.tds[j + 1].nxt[2] = this.tds[j];
      this.tds[j].nxt[1] = south.tds[j];
      south.tds[j].nxt[3] = this.tds[j];
    }
  };
  return tr;
}

function pimo() {
  $('#scene_source').val(initial_scene_source);
  board = form_board($('#scene_inner'));
}


function peso() {
  var source = $('#scene_source').val();
  board.release();
  var lines = source.split("\n");
  var max_length = 0;
  var i;
  for (i in lines) {
    len = lines[i].length;
    if (len > max_length) {
      max_length = len;
    }
  }
  board.addWallLine(max_length + 2);
  //var mark = null;
  for (i in lines) {
    line = lines[i];
    tr = board.createCellLineTr();
    tr.addWall();
    var chs = line.split('');
    var len = line.length;
    var j = 0;
    while (j < len) {
      tr.addTd(chs[j]);
      /*
      var a_mark = tr.addTd(chs[j]);
      if (a_mark != null) {
        mark = a_mark;
      }
      */
      j++;
    }
    while (j < max_length) {
      tr.addSpace();
      j++;
    }
    tr.addWall();
  }
  board.addWallLine(max_length + 2);
  board.connect(); // セル間の相互リンク
  // board.findMark();
  // board.mark = mark;
}

function form_cell(td) {
  td.nxt = new Array();
  td.release = function() {
    this.nxt = new Array();
  };
  td.setChar = function(ch) {
    this.html(ch);
    this.removeClass('mark space wall block');
    switch (ch) {
     case char_mark:
      this.addClass('mark');
      board.mark = this;
      break;
     case char_space_fw:
     case char_space_hw:
      this.addClass('space');
      break;
     case char_wall:
      this.addClass('wall');
      break;
     default:
      this.addClass('block');
      break;
    }
  };
  return td;
}


function boso_move(direction, trace) {
  var next_move = score.getNextMove();
  if (next_move == direction) {
    trace = true;
  }
  var cell0 = board.mark;
  var cid0 = cell0.cid;
  var cell1 = cell0.nxt[direction];
  var char1 = cell1.html();
  var cid1 = cell1.cid;
  var cell2 = null;
  var char2 = null;
  var cid2 = null;
  if (cell1.nxt && cell1.nxt[direction]) {
    cell2 = cell1.nxt[direction];
    char2 = cell2.html();
    cid2 = cell2.cid;
  }
  else {
    char2 = char_wall;
  }
  var remove_flag = null;
  var patch = new Array();
  if (char1 == char_space_fw || char1 == char_space_hw) {
    // if (journey_list)
    if (remove_flag == null) {
      board.journey.unshift(cell0);
      patch.push(boso_diff(cell0, char_mark, char_space),
                 boso_diff(cell1, char_space, char_mark));
    }
  }
  else {
    cell0.setChar(char_space);
    var change = boso_move1(direction, cell1, cell2, char1, char2);
    if (change) {
      board.journey.clear();
      patch.push(boso_diff(cell0, char_mark, char_space),
                 boso_diff(cell1, char1, char_mark));
      var i;
      for (i in change) {
        patch.push(change[i]);
      }
    }
    else {
      cell0.setChar(char_mark);
    }
  }
  if (patch) {
    // boso_update_step();
    board.patch(patch);
    board.add_diff(patch);
    if (trace) {
      score.promote();
    }
    else {
      score.append(direction);
    }
    if (board.is_complete()) {
    }
  }
}

function boso_movable(char) {
  switch (char) {
   case char_refl:
   case char_refr:
   case char_wall:
    return false;
   default:
    return true;
  }
}

function boso_is_space(char) {
  switch (char) {
   case char_space_hw:
   case char_space_fw:
    return true;
   default:
    return false;
  }
}

function boso_is_virtual(char) {
  if (typeof(char) == 'number' && char < 0) {
    return true;
  }
  return false;
}

function boso_rule_table(char1, char2, direction) {
  if (boso_movable(char1)) {  // char1 が動かせる場合
    if (boso_is_space(char2)) { // char2 が空白の場合
      if (boso_is_virtual(char1)) { // char1 が仮想文字の場合
        return null; // 単独では存在できず
      }
      else {
        return { a: char1 };
      }
    }
    else if (char2 == char_refl) { // char2 が「＼」の場合
      return { a: char2,
               j: { c: char1, d: (direction & 2) + (1 - (direction % 2))} };
    }
    else if (char2 == char_refr) { // char2 が「／」の場合
      return { a: char2, j: { c: char1, d: 3 - direction } };
    }
    if (typeof(boso_rule[char1]) == 'object') {
      var obj1 = boso_rule[char1];
      if (typeof(obj1[char2]) == 'object') {
        var obj2 = obj1[char2];
        if (typeof(obj2[direction]) == 'object') {
          return obj2[direction];
        }
      }
    }
  }
  return null;
}

function boso_move1(direction, cell1, cell2, char1, char2) {
  var curr = boso_rule_table(char1, char2, direction);
  if (! curr) { // 結合しないとき
    return null;
  }
  var jump = curr['j'];
  if (! jump) { // 結合して、新しく物体を押し出さないとき
    return new Array(boso_diff(cell2, char2, curr['a']));
  }
  // 結合して、新しく物体を押し出すとき
  // すなわち玉突きが起こったとき
  var new_direction = jump['d']; // 押し出された方向
  var cell3 = cell2.nxt[new_direction];
  var saved_char = cell1.html();
  if (boso_movable(saved_char)) {
    // 一回の玉突きで二度同じ所を通らないように
    // 壁でないときは再起呼出しの間だけ一時的に壁にしておく
    cell1.setChar(char_wall);
  }
  var change = boso_move1(new_direction, cell2, cell3, jump['c'], cell3.html());
  if (boso_movable(saved_char)) {
    cell.setChar(saved_char);
  }
  if (! change) { // 失敗なら null を返す
    return null;
  }
  if (char2 == curr['a']) {  // 同じ文字に変化するなら新たな差分なし
    return change;
  }
  if (! change) {
    change = new Array();
  }
  change.unshift(boso_diff(cell2, char2, curr['a']));
  return change;
  a = 1;
}
// end of file
