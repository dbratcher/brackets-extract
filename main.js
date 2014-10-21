/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */

/** {brackets-extract} Extract Refactoring for Brackets
    Provides extract to variable and extract to method functionality for Brackets via an extension.
*/

define(function (require, exports, module) {
  'use strict';

  var CommandManager = brackets.getModule("command/CommandManager"),
    Menus = brackets.getModule("command/Menus"),
    EditorManager = brackets.getModule("editor/EditorManager"),
    Editor = brackets.getModule("editor/Editor").Editor,
    Dialogs = brackets.getModule("widgets/Dialogs"),
    DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
    Strings = require("i18n!nls/strings"),
    BracketsStrings = brackets.getModule("i18n!nls/strings"),
    ModalBar = brackets.getModule('widgets/ModalBar').ModalBar;

  var COMMAND_ID = "me.drewbratcher.extract",
    CONTEXTUAL_COMMAND_ID = "me.drewbratcher.extractContextual";

  var dialog = require("text!dialog.html");
  var instancePrompt = require("text!prompt.html");
  var templateVars = {
    BracketsStrings: BracketsStrings,
    Strings: Strings
  };

  function splitPieces(pieces, char) {
    var newPieces = [];
    pieces.forEach(function(piece) {
      newPieces = newPieces.concat(piece.split(char));
    });
    return newPieces;
  }

  function extractVariables(text) {
    // ignore comments
    text = text.replace(/\/\/.+\n/g, '');
    text = text.replace(/\/\*.+\*\//g, '');

    // ignore quotes
    text = text.replace(/['].+[']/g, '');
    text = text.replace(/["].+["]/g, '');

    // remove properties
    text = text.replace(/\.[a-z0-9]+/i, '');

    // break blocks into words
    var blocks = text.split(' ');
    blocks = splitPieces(blocks, '.');
    blocks = splitPieces(blocks, '[');
    blocks = splitPieces(blocks, ']');
    blocks = splitPieces(blocks, ';');
    blocks = splitPieces(blocks, ',');

    // filter alphanumerics
    blocks = blocks.filter(function(word) {
      return word.match(/^[a-z][a-z0-9]+$/i);
    });

    // ignore language specifics
    blocks = blocks.filter(function(word) {
      return ((word !== 'console') && (word !== 'delete') && (word !== 'throw') && (word !== 'return'));
    });

    // check what's defined
    var defined = [];
    for(var i = 0; i<blocks.length; i++) {
      if(blocks[i-1] && blocks[i-1]=='var') {
        defined.push(blocks[i]);
      }
    }
    // uniquely specify params
    var params = [];
    blocks.forEach(function(word) {
      if(defined.indexOf(word)==-1 && params.indexOf(word)==-1 && word !='var') {
        params.push(word);
      }
    });
    return params;
  }

  function extract() {
    var unformattedText;
    var editor = EditorManager.getCurrentFullEditor();
    var selectedText = editor.getSelectedText();

    if (selectedText.length > 0) {
      unformattedText = selectedText;
    } else {
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, Strings.DIALOG_ERROR_TITLE, Strings.DIALOG_ERROR_NO_SELECTION);
      return;
    }

    if (editor.document.language.getId() === "javascript") {
      var openedDialog = Dialogs.showModalDialogUsingTemplate(Mustache.render(dialog, templateVars));
      var $dom = openedDialog.getElement();
      $dom.find('#newName').select();
      openedDialog.done(function (id) {
        if (id == "save") {
          var newName = $dom.find("#newName").val();
          var varOrFunc = $dom.find("#varOrFunc:checked").val();
          var replace = $dom.find("#replace:checked").val();
          //var replace = $dom.find("#replace").val();
          newName = newName.trim();
          unformattedText = unformattedText.trim();
          if (unformattedText.charAt(unformattedText.length - 1) != ';') {
            unformattedText = unformattedText + ';';
          }
          var newText;
          if (varOrFunc == 'variable') {
            newText = "var " + newName + " = " + unformattedText + "\n";
          } else {
            // add function indent
            unformattedText = '  ' + unformattedText.split('\n').join('\n  ');
            var params = extractVariables(unformattedText);
            newName = newName + '('+params.join(', ')+')';
            newText = [
              "function " + newName + " {",
              unformattedText,
              "}"
            ];
            // check if need semicolon
            var trimmedText = unformattedText.trim();
            if(trimmedText[trimmedText.length-1] == ';') {
              newName += ';';
            }
            // check if return in last line
            var lines = unformattedText.split('\n');
            var lastLine = lines[lines.length-1];
            if(lastLine.indexOf('return')!=-1) {
              newName = 'return ' + newName;
            }
          }
          performExtraction(newName, newText, replace);
        }
      });
    } else {
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, Strings.DIALOG_ERROR_TITLE, Strings.DIALOG_ERROR_UNSUPPORTED_FILE);
      return;
    }
  }

  var confirmBar = null;
  var lastLineReplaced = 0;
  function askQuestions(editor, doc, selections, i, newText) {
    if(i>=selections.length) {
      confirmBar.close(false, false);
      confirmBar = null;
      return;
    }
    if (confirmBar === null) {
      templateVars.Inputs = {TOTAL:selections.length};
      confirmBar = new ModalBar(Mustache.render(instancePrompt, templateVars), false, false);
      $("button", confirmBar.getRoot()).first().focus();
    }
    $("#rename-question-num").text("" + (i + 1));
    if(selections[i].start.line == lastLineReplaced) {
      var instanceStartCh = selections[i].start.ch;
      selections[i].start.ch -= (selections[i].end.ch - selections[i].start.ch) - newText.length;
      selections[i].end.ch -= (selections[i].end.ch - instanceStartCh) - newText.length;
    }
    lastLineReplaced = selections[i].start.line;
    editor.setSelection(selections[i].start, selections[i].end, true);
    confirmBar.getRoot().off("click");
    confirmBar.getRoot().on("click", "button", function(e) {
      var button = e.target.id;
      if(button == 'extract-yes') {
        doc.replaceRange(newText, selections[i].start, selections[i].end);
        askQuestions(editor, doc, selections, i+1, newText);
      } else if(button == 'extract-no') {
        askQuestions(editor, doc, selections, i+1, newText);
      } else if(button == 'extract-yes-all') {
        selections.splice(0, i);
        selections.forEach(function(instance1) {
          doc.replaceRange(newText, instance1.start, instance1.end);
        });
      } else if(button == 'extract-no-all') {
        confirmBar.close(false, false);
        confirmBar = null;
      }
    });
  }

  function positionToSelection(pos, fileText, length) {
    // truncate file to position
    var truncated = fileText.substring(0, pos);
    // count line endings
    var lines = (truncated.match(/\n/g)||[]).length;
    // get char offset since last line ending
    var chars = truncated.length - truncated.lastIndexOf('\n') - 1;

    var begin = { ch: chars, line: lines};
    var stop = { ch: chars, line: lines};
    stop.ch += length;
    var selection = {start: begin, end: stop};
    return selection;
  }

  // returns array of {start, end} objects given regex word and file text fileText
  function findInstances(word, fileText) {
    var matches = [];
    var reg = new RegExp(word, 'g');
    var found = reg.exec(fileText);
    while(found) {
      matches.push(positionToSelection(found.index, fileText, found[0].length));
      found = reg.exec(fileText);
    }
    return matches;
  }

  function performExtraction(newName, newText, replace) {
    var editor = EditorManager.getCurrentFullEditor(),
      doc = editor.document,
      selection = editor.getSelection(),
      fileText = doc.getText();
    var originalLine = doc.getLine(selection.start.line);
    var lineText = originalLine.trimLeft();
    var numSpaces = originalLine.length - lineText.length;
    var indent = originalLine.substr(0, numSpaces);


    if (newText instanceof Array) {
      newText = newText.join('\n' + indent) + '\n';
    }

    doc.batchOperation(function () {

      var newStart = {ch:selection.start.ch, line:selection.start.line};
      newStart.ch = 0;
      console.log(newStart);
      console.log(selection);
      if(replace=='selected') {
        doc.replaceRange(newName, selection.start, selection.end);
      } else {
        var instances = findInstances(editor.getSelectedText().trim(), fileText);

        if(replace == 'instances') {
          askQuestions(editor, doc, instances, 0, newName);
        } else if(replace == 'all') {
          instances.forEach(function(instance) {
            if(extracted.line == lastLineReplaced) {
              var instanceStartCh = instance.start.ch;
              instance.start.ch -= (instance.end.ch - instance.start.ch) - newName.length;
              instance.end.ch -= (instance.end.ch - instanceStartCh) - newName.length;
            }
            lastLineReplaced = instance.start.line;
            var extracted = instance.start;
            doc.replaceRange(newName, instance.start, instance.end);

          });
        }
      }
      doc.replaceRange(indent + newText, newStart, newStart);
    });
  }

  CommandManager.register(Strings.COMMAND_NAME, COMMAND_ID, extract);

  var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);

  menu.addMenuDivider();
  menu.addMenuItem(COMMAND_ID, "Ctrl-Shift-E");

  CommandManager.register(Strings.COMMAND_NAME, CONTEXTUAL_COMMAND_ID, extract);
  var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
  contextMenu.addMenuItem(CONTEXTUAL_COMMAND_ID);

});
