/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

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
    DocumentManager = brackets.getModule("document/DocumentManager");

  var COMMAND_ID = "me.drewbratcher.extract",
    CONTEXTUAL_COMMAND_ID = "me.drewbratcher.extractContextual";

  var dialog = require("text!dialog.html");

  function extract() {
    var unformattedText;
    var editor = EditorManager.getCurrentFullEditor();
    var selectedText = editor.getSelectedText();

    if (selectedText.length > 0) {
      unformattedText = selectedText;
    } else {
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, "Extract Refactoring Error", "You must highlight some code for extraction.");
      return;
    }

    var doc = DocumentManager.getCurrentDocument();

    var language = doc.getLanguage();
    var fileType = language._id;

    switch (fileType) {

    case 'javascript':
      var openedDialog = Dialogs.showModalDialogUsingTemplate(dialog);
      var $dom = openedDialog.getElement();
      $dom.find('#newName').select();
      openedDialog.done(function (id) {
        if (id == "save") {
          var newName = $dom.find("#newName").val();
          var varOrFunc = $dom.find("#varOrFunc:checked").val();
          //var replace = $dom.find("#replace").val();
          newName = newName.trim();
          unformattedText = unformattedText.trim();
          if (unformattedText.substr(unformattedText.length - 1) != ';') {
            unformattedText = unformattedText + ';';
          }
          var newText;
          if (varOrFunc == 'variable') {
            newText = "var " + newName + " = " + unformattedText + "\n";
          } else {
            newName = newName + '()';
            newText = [
              "function " + newName + " {",
              unformattedText,
              "}"];
          }
          performExtraction(newName, newText);
        }
      });
      break;
    default:
      Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_ERR, "Extract Refactoring Error", "Unsupported File: Must be Javascript.");
      return;
    }
  }

  function performExtraction(newName, newText) {
    var editor = EditorManager.getCurrentFullEditor(),
      cursor = editor.getCursorPos(),
      scroll = editor.getScrollPos(),
      doc = DocumentManager.getCurrentDocument(),
      selection = editor.getSelection();
    var originalLine = doc.getLine(selection.start.line);
    var lineText = originalLine.trimLeft();
    var numSpaces = originalLine.length - lineText.length;
    var indent = originalLine.substr(0, numSpaces);

    if (newText instanceof Array) {
      newText = newText.join('\n' + indent) + '\n';
    }
    doc.batchOperation(function () {
      doc.replaceRange(newName, selection.start, selection.end);
      var newStart = selection.start;
      newStart.ch = 0;
      doc.replaceRange(indent + newText, newStart, newStart);
    });
  }

  CommandManager.register("Extract", COMMAND_ID, extract);

  var menu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);

  var windowsCommand = {
    key: "Ctrl-Shift-E",
    platform: "win"
  };

  var macCommand = {
    key: "Cmd-Shift-E",
    platform: "mac"
  };

  var command = [windowsCommand, macCommand];

  menu.addMenuDivider();
  menu.addMenuItem(COMMAND_ID, command);

  CommandManager.register("Beautify", CONTEXTUAL_COMMAND_ID, extract);
  var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
  contextMenu.addMenuItem(CONTEXTUAL_COMMAND_ID);

});