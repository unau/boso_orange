var cell_size = 24;
var char_wall = '■';
var char_space_fw = '　';
var char_space_hw = ' ';
var char_space = char_space_hw;
var char_mark = '＠';
var char_refl = '＼';
var char_refr = '／';
var boso_diff_history_buffer_size = 1000;
var initial_scene_source = "これはサンプル場面です。\n適当に書き替えてから kick してください。\n＠ 木寸";

var score = {
  getNextMove: function() {
    return false;
  },
  progress: function() {
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
    unshift: function(cid) {
      this.a.unshift(cid);
    },
    clear: function() {
      this.a = new Array();
    },
    shift: function() {
      return this.a.shift();
    },
    in: function(cid) {
      var i;
      for (i in this.a) {
        if (this.a[i] == cid) {
          return true;
        }
      }
      return false;
    },
    remove: function(cid) {
      boso_step_undo(true); // cancel
      var current_cid = this.a.shift();
      while (current_cid != cid) {
        boso_step_undo(true); // cancel
        current_cid = this.a.shift();
      }
      return true;
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
  tbody.diff_history = {
    init: function() {
      this.buffer = new Array(boso_diff_history_buffer_size);
      this.index = 0;
    },
    append: function(patch) {
      this.buffer[this.index] = patch;
      this.index++;
      if (this.index >= boso_diff_history_buffer_size) {
        this.index = 0;
      }
      this.buffer[this.index] = null;
    },
    getCurrent: function() {
      return this.buffer[this.index];
    },
    getPrevious: function() {
      var prev_index = this.index - 1;
      if (prev_index < 0) {
        prev_index = boso_diff_history_buffer_size - 1;
      }
      return this.buffer[prev_index];
    },
    rewind: function() {
      this.index--;
      if (this.index < 0) {
        this.index = boso_diff_history_buffer_size - 1;
      }
    },
    progress: function() {
      this.index++;
      if (this.index >= boso_diff_history_buffer_size) {
        this.index = 0;
      }
    }
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
  board.diff_history.init();
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
  for (i in lines) {
    var line = lines[i];
    tr = board.createCellLineTr();
    tr.addWall();
    var chs = line.split('');
    var len = line.length;
    var j = 0;
    while (j < len) {
      tr.addTd(chs[j]);
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
  var patch = new Array();
  if (boso_is_space(char1)) {
    /*
    if (board.journey.in(cid1)) {
      board.journey.remove(cid1);
    }
    else {
      board.journey.unshift(cid0);
      patch.push(boso_diff(cell0, char_mark, char_space),
                 boso_diff(cell1, char_space, char_mark));
    }
    */
    patch.push(boso_diff(cell0, char_mark, char_space),
               boso_diff(cell1, char_space, char_mark));
  }
  else {
    cell0.setChar(char_space);
    var change = boso_move1(direction, cell1, cell2, char1, char2);
    if (change) {
      // board.journey.clear();
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
  if (patch && patch.length > 0) {
    // boso_update_step();
    board.patch(patch);
    board.diff_history.append(patch);
    if (trace) {
      score.progress();
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

/**
 * 仮想文字か否か
 * 仮想文字 (文字として単独で存在しえない文字 (にんべん、など))
 */
function boso_is_virtual(char) {
  if (typeof(char) == 'number' && char < 0) {
    return true;
  }
  return false;
}

/**
 * ワンステップの redo
 * boso_reundo() から呼ばれる
 */
function boso_step_redo() {
  var patch = board.diff_history.getCurrent();
  if (! patch || patch.length <= 0) {
    var move = score.getNextMove();
    if (move) { // 解譜バッファに先がある場合
      boso_move(move, true); // 解譜のトレース
      return true;
    }
    return false; // 差分履歴にも解譜にもたどるものがない場合
  }
  // board.journey.unshift(patch[0].cell.cid);
  // board.update_step();
  score.progress();
  var flag = board.patch(patch);
  board.diff_history.progress();
  return true;  
}

/**
 * ワンステップの undo
 * boso_reundo() から呼ばれる
 */
function boso_step_undo(cancel) {
  var patch = board.diff_history.getPrevious();
  if (! patch || patch.length <= 0) {
    return false;
  }
  // boso_update_step(x - 1);
  board.patch(patch, true); // reverse patch
  board.diff_history.rewind();
  if (! cancel) {
    // board.journey.shift(); // 先頭を捨てる
  }
  return true;
}

function boso_reundo(func, till_the_end) {
  var steps = 1;
  var loop = 0;
  var flag = true;
  while (flag) {
    while (flag && loop < steps) {
      flag = func();
      loop++;
    }
    if (! till_the_end) {
      flag = false;
    }
    if (flag) {
      b = 1;
    }
  }
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
}

// end of file
